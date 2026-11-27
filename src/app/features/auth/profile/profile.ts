import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/auth/auth';
import { normalizeHttpError } from '../../../core/http/api-error';
import { Feedback } from '../../../shared/services/feedback';
import { UserProfile } from './profile.model';
import { ProfileService } from './profile.service';

@Component({
  selector: 'app-profile',
  imports: [RouterLink, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  readonly auth = inject(Auth);
  private readonly profileService = inject(ProfileService);
  private readonly feedback = inject(Feedback);

  readonly profile = signal<UserProfile | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string[]>>({});
  readonly targetUserId = signal<number | null>(null);

  readonly formName = signal('');
  readonly formEmail = signal('');
  readonly formPhone = signal('');
  readonly formBio = signal('');
  readonly formFitnessGoal = signal('');
  readonly formProfilePicture = signal('');
  readonly formPreferencesText = signal('');

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (!user) {
        this.profile.set(null);
        this.targetUserId.set(null);
        this.errorMessage.set(null);
        return;
      }
      this.targetUserId.set(user.id);
      void this.loadProfile(user.id);
    });
  }

  async loadProfile(userId = this.targetUserId() ?? this.auth.currentUser()?.id): Promise<void> {
    if (!userId) return;
    this.loading.set(true);
    this.errorMessage.set(null);
    this.fieldErrors.set({});
    try {
      const loaded = await this.profileService.getProfile(userId);
      this.profile.set(loaded);
      this.syncFormFromProfile(loaded);
    } catch (err) {
      const normalized = normalizeHttpError(err);
      this.profile.set(null);
      this.errorMessage.set(normalized.message);
      this.feedback.error(normalized.message);
      this.prefillEmptyForm();
    } finally {
      this.loading.set(false);
    }
  }

  startEdit(): void {
    const current = this.profile();
    if (current) {
      this.syncFormFromProfile(current);
    } else {
      this.prefillEmptyForm();
    }
    this.fieldErrors.set({});
    this.errorMessage.set(null);
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.fieldErrors.set({});
    this.errorMessage.set(null);
    const current = this.profile();
    if (current) this.syncFormFromProfile(current);
  }

  async saveProfile(): Promise<void> {
    const userId = this.targetUserId() ?? this.auth.currentUser()?.id;
    if (!userId) return;

    this.saving.set(true);
    this.errorMessage.set(null);
    this.fieldErrors.set({});

    const payload = {
      name: this.formName(),
      email: this.formEmail(),
      phone: this.formPhone(),
      bio: this.formBio(),
      fitnessGoal: this.formFitnessGoal(),
      profilePicture: this.formProfilePicture(),
      preferences: this.formPreferencesText()
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    };

    try {
      const saved = this.profile()
        ? await this.profileService.updateProfile(userId, payload)
        : await this.profileService.createProfile(userId, payload);
      this.profile.set(saved);
      this.syncFormFromProfile(saved);
      this.editing.set(false);
    } catch (err) {
      const normalized = normalizeHttpError(err);
      this.errorMessage.set(normalized.message);
      this.fieldErrors.set(normalized.fieldErrors);
      this.feedback.error(normalized.message);
    } finally {
      this.saving.set(false);
    }
  }

  async deleteProfile(): Promise<void> {
    const userId = this.targetUserId() ?? this.auth.currentUser()?.id;
    if (!userId) return;

    this.saving.set(true);
    this.errorMessage.set(null);
    try {
      await this.profileService.deleteProfile(userId);
      this.profile.set(null);
      this.editing.set(false);
      this.prefillEmptyForm();
    } catch (err) {
      const normalized = normalizeHttpError(err);
      this.errorMessage.set(normalized.message);
      this.feedback.error(normalized.message);
    } finally {
      this.saving.set(false);
    }
  }

  private syncFormFromProfile(profile: UserProfile): void {
    this.formName.set(profile.name);
    this.formEmail.set(profile.email);
    this.formPhone.set(profile.phone);
    this.formBio.set(profile.bio);
    this.formFitnessGoal.set(profile.fitnessGoal);
    this.formProfilePicture.set(profile.profilePicture);
    this.formPreferencesText.set(profile.preferences.join(', '));
  }

  private prefillEmptyForm(): void {
    const user = this.auth.currentUser();
    this.formName.set(user?.name ?? '');
    this.formEmail.set(user?.email ?? '');
    this.formPhone.set('');
    this.formBio.set('');
    this.formFitnessGoal.set('');
    this.formProfilePicture.set(user?.profilePicture ?? '');
    this.formPreferencesText.set((user?.preferences ?? []).join(', '));
  }
}
