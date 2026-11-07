
import { Injectable, signal, computed } from '@angular/core';
import { User, UserRole, DemoCard } from '../../models/user.model';
import { MOCK_ACCOUNTS, MockAccount } from './mock-accounts';

export interface SignupData {
  username: string;
  name: string;
  email: string;
  password: string;
  profilePicture?: string;
  preferences: string[];
  demoCard?: DemoCard;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly accounts: MockAccount[] = [...MOCK_ACCOUNTS];

  private readonly currentUserState = signal<User | null>(null);

  readonly currentUser = this.currentUserState.asReadonly();

  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  readonly currentRole = computed(() => this.currentUser()?.role ?? null);

  hasRole(role: UserRole): boolean {
    return this.currentRole() === role;
  }

  login(username: string, password: string): boolean {
    const account = this.accounts.find(
      account =>
        account.user.username.toLowerCase() ===
          username.trim().toLowerCase() &&
        account.password === password
    );

    if (!account) {
      return false;
    }

    this.currentUserState.set(account.user);
    return true;
  }

  signup(data: SignupData): string | null {
    const username = data.username.trim();
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();

    if (username.length < 3 || !name || !email) {
      return 'Please enter valid account information.';
    }

    if (data.password.length < 6) {
      return 'Demo password must be at least 6 characters.';
    }

    const alreadyExists = this.accounts.some(account =>
      account.user.username.toLowerCase() === username.toLowerCase() ||
      account.user.email.toLowerCase() === email
    );

    if (alreadyExists) {
      return 'Username or email already exists.';
    }

    const id = Math.max(
      0,
      ...this.accounts.map(account => account.user.id)
    ) + 1;

    const newUser: User = {
      id,
      username,
      name,
      email,
      role: 'trainee',
      profilePicture: data.profilePicture?.trim() || undefined,
      preferences: data.preferences,
      demoCard: data.demoCard
    };

    this.accounts.push({
      user: newUser,
      password: data.password
    });

    return null;
  }

  logout(): void {
    this.currentUserState.set(null);
  }
}
