
import { Injectable, signal, computed } from '@angular/core';
import { User, UserRole } from '../../models/user.model';
import { MOCK_ACCOUNTS } from './mock-accounts';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  // Internal state: only this service can modify it.
  private readonly currentUserState = signal<User | null>(null);

  // Other components can read the current user.
  readonly currentUser = this.currentUserState.asReadonly();

  // Automatically updates when currentUser changes.
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  // Role of the current user, if any.
  readonly currentRole = computed(() => this.currentUser()?.role ?? null);

  // Check whether the current user has a particular role.
  hasRole(role: UserRole): boolean {
    return this.currentRole() === role;
  }

login(username: string, password: string): boolean {
  const account = MOCK_ACCOUNTS.find(
    account =>
      account.user.username === username.trim() &&
      account.password === password
  );

  if (!account) {
    return false;
  }

  this.currentUserState.set(account.user);
  return true;
}

  // End the current session.
  logout(): void {
    this.currentUserState.set(null);
  }
}
