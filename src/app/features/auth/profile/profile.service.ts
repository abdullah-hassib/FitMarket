import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Auth } from '../../../core/auth/auth';
import { Feedback } from '../../../shared/services/feedback';
import { ProfileUpsertPayload, UserProfile } from './profile.model';

export const PROFILE_USE_API = new InjectionToken<boolean>('PROFILE_USE_API', {
  providedIn: 'root',
  factory: () => false,
});

export const PROFILE_API_BASE = new InjectionToken<string>('PROFILE_API_BASE', {
  providedIn: 'root',
  factory: () => '/api/profiles',
});

const PROFILES_STORAGE_KEY = 'fitmarket_profiles_v1';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly feedback = inject(Feedback);
  private readonly useApi = inject(PROFILE_USE_API);
  private readonly apiBase = inject(PROFILE_API_BASE);

  async getProfile(userId: number): Promise<UserProfile> {
    if (this.useApi) {
      return firstValueFrom(this.http.get<UserProfile>(`${this.apiBase}/${userId}`));
    }

    const currentUser = this.auth.currentUser();
    if (!currentUser) {
      throw new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', error: { message: 'Authentication required.' } });
    }
    if (currentUser.id !== userId && currentUser.role !== 'admin') {
      throw new HttpErrorResponse({ status: 403, statusText: 'Forbidden', error: { message: 'You can only view your own profile.' } });
    }

    const store = this.readLocalProfiles();
    const existing = store.find((item) => item.userId === userId);
    if (existing) {
      return existing;
    }

    if (currentUser.id === userId) {
      const seeded: UserProfile = {
        id: userId,
        userId,
        name: currentUser.name,
        email: currentUser.email,
        phone: '',
        bio: '',
        fitnessGoal: '',
        profilePicture: currentUser.profilePicture ?? '',
        preferences: currentUser.preferences ?? [],
        updatedAt: new Date().toISOString(),
      };
      this.writeLocalProfiles([...store, seeded]);
      return seeded;
    }

    throw new HttpErrorResponse({ status: 404, statusText: 'Not Found', error: { message: 'Profile not found.' } });
  }

  async createProfile(userId: number, payload: ProfileUpsertPayload): Promise<UserProfile> {
    const validated = this.validatePayload(payload);
    if (this.useApi) {
      const created = await firstValueFrom(
        this.http.post<UserProfile>(this.apiBase, { userId, ...validated }),
      );
      this.feedback.success('Profile created.');
      return created;
    }

    this.assertCanModify(userId);
    const store = this.readLocalProfiles();
    if (store.some((item) => item.userId === userId)) {
      throw new HttpErrorResponse({
        status: 422,
        statusText: 'Unprocessable Entity',
        error: { message: 'Profile already exists for this user.' },
      });
    }

    const created: UserProfile = {
      id: Math.max(0, ...store.map((item) => item.id)) + 1,
      userId,
      ...validated,
      updatedAt: new Date().toISOString(),
    };
    this.writeLocalProfiles([...store, created]);
    this.feedback.success('Profile created.');
    return created;
  }

  async updateProfile(userId: number, payload: ProfileUpsertPayload): Promise<UserProfile> {
    const validated = this.validatePayload(payload);
    if (this.useApi) {
      const updated = await firstValueFrom(
        this.http.put<UserProfile>(`${this.apiBase}/${userId}`, validated),
      );
      this.feedback.success('Profile updated.');
      return updated;
    }

    this.assertCanModify(userId);
    const store = this.readLocalProfiles();
    const index = store.findIndex((item) => item.userId === userId);
    if (index === -1) {
      throw new HttpErrorResponse({ status: 404, statusText: 'Not Found', error: { message: 'Profile not found.' } });
    }

    const updated: UserProfile = {
      ...store[index],
      ...validated,
      updatedAt: new Date().toISOString(),
    };
    const next = [...store];
    next[index] = updated;
    this.writeLocalProfiles(next);
    this.feedback.success('Profile updated.');
    return updated;
  }

  async deleteProfile(userId: number): Promise<void> {
    if (this.useApi) {
      await firstValueFrom(this.http.delete<void>(`${this.apiBase}/${userId}`));
      this.feedback.success('Profile deleted.');
      return;
    }

    this.assertCanModify(userId);
    const store = this.readLocalProfiles();
    const exists = store.some((item) => item.userId === userId);
    if (!exists) {
      throw new HttpErrorResponse({ status: 404, statusText: 'Not Found', error: { message: 'Profile not found.' } });
    }

    this.writeLocalProfiles(store.filter((item) => item.userId !== userId));
    this.feedback.success('Profile deleted.');
  }

  private assertCanModify(targetUserId: number): void {
    const currentUser = this.auth.currentUser();
    if (!currentUser) {
      throw new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', error: { message: 'Authentication required.' } });
    }
    if (currentUser.id !== targetUserId && currentUser.role !== 'admin') {
      throw new HttpErrorResponse({
        status: 403,
        statusText: 'Forbidden',
        error: { message: 'You can only modify your own profile unless an admin overrides.' },
      });
    }
  }

  private validatePayload(payload: ProfileUpsertPayload): ProfileUpsertPayload {
    const name = payload.name.trim();
    const email = payload.email.trim().toLowerCase();
    const phone = payload.phone.trim();
    const bio = payload.bio.trim();
    const fitnessGoal = payload.fitnessGoal.trim();
    const profilePicture = payload.profilePicture.trim();
    const preferences = payload.preferences.map((item) => item.trim()).filter(Boolean);

    const errors: Record<string, string[]> = {};
    if (name.length < 2) {
      errors['name'] = ['Name must be at least 2 characters.'];
    }
    if (!EMAIL_PATTERN.test(email)) {
      errors['email'] = ['Please enter a valid email address.'];
    }
    if (phone && !/^[+\d\s()-]{6,20}$/.test(phone)) {
      errors['phone'] = ['Phone number must be 6-20 valid characters.'];
    }
    if (bio.length > 300) {
      errors['bio'] = ['Bio must be 300 characters or fewer.'];
    }

    if (Object.keys(errors).length > 0) {
      throw new HttpErrorResponse({
        status: 422,
        statusText: 'Unprocessable Entity',
        error: { message: 'Profile validation failed.', errors },
      });
    }

    return { name, email, phone, bio, fitnessGoal, profilePicture, preferences };
  }

  private readLocalProfiles(): UserProfile[] {
    try {
      const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as UserProfile[]) : [];
    } catch {
      return [];
    }
  }

  private writeLocalProfiles(profiles: UserProfile[]): void {
    try {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    } catch {
      throw new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error',
        error: { message: 'Unable to persist profile data.' },
      });
    }
  }
}
