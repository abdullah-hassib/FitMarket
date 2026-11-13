
import { Injectable, signal, computed } from '@angular/core';
import { User, UserRole, DemoCard } from '../../models/user.model';
import { MOCK_ACCOUNTS } from './mock-accounts';
import {
  createDemoVerifier,
  verifyDemoPassword
} from './demo-password';

const ACCOUNTS_KEY = 'fitmarket_demo_accounts_v1';
const SESSION_KEY = 'fitmarket_session_user_id_v1';
const DEMO_AVATAR_KEY = 'fitmarket_demo_avatar_v1_';

export interface SignupData {
  username: string;
  name: string;
  email: string;
  password: string;
  profilePicture?: string;
  preferences: string[];
  demoCard?: DemoCard;
}

interface StoredAccount {
  user: User;
  salt: string;
  passwordHash: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  // Previously registered demo accounts, restored from localStorage.
  private readonly registeredAccounts = this.loadAccounts();

  // Restore the logged-in user from this tab's sessionStorage.
  private readonly currentUserState =
    signal<User | null>(this.restoreSession());

  readonly currentUser = this.currentUserState.asReadonly();

  readonly isLoggedIn = computed(
    () => this.currentUser() !== null
  );

  readonly currentRole = computed(
    () => this.currentUser()?.role ?? null
  );

  hasRole(role: UserRole): boolean {
    return this.currentRole() === role;
  }

  private loadAccounts(): StoredAccount[] {
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter((item): item is StoredAccount =>
          item !== null &&
          typeof item === 'object' &&
          Number.isSafeInteger(item.user?.id) &&
          typeof item.user?.username === 'string' &&
          typeof item.user?.name === 'string' &&
          typeof item.user?.email === 'string' &&
          typeof item.salt === 'string' &&
          /^[0-9a-f]{32}$/.test(item.salt) &&
          typeof item.passwordHash === 'string' &&
          /^[0-9a-f]{64}$/.test(item.passwordHash)
        )
       .map(item => ({
  ...item,
  user: {
    ...item.user,
    role: (
      ['admin', 'accountant', 'trainee'].includes(item.user.role)
        ? item.user.role
        : 'trainee'
    ) as UserRole
  }
}));
    } catch {
      return [];
    }
  }

  private restoreSession(): User | null {
    try {
      const storedId = sessionStorage.getItem(SESSION_KEY);

      if (!storedId) {
        return null;
      }

      const id = Number(storedId);

      const demoUser = MOCK_ACCOUNTS.find(
        account => account.user.id === id
      )?.user;

      const registeredUser = this.registeredAccounts.find(
        account => account.user.id === id
      )?.user;

      return demoUser ? this.withDemoPhoto(demoUser) : (registeredUser ?? null);
    } catch {
      return null;
    }
  }

  async login(
    username: string,
    password: string
  ): Promise<boolean> {
    const normalizedUsername = username.trim().toLowerCase();

    const demoAccount = MOCK_ACCOUNTS.find(
      account =>
        account.user.username.toLowerCase() === normalizedUsername &&
        account.password === password
    );

    let user: User | undefined = demoAccount?.user;

    if (!user) {
      const registeredAccount = this.registeredAccounts.find(
        account =>
          account.user.username.toLowerCase() === normalizedUsername
      );

      if (registeredAccount) {
        const valid = await verifyDemoPassword(
          password,
          registeredAccount.salt,
          registeredAccount.passwordHash
        );

        if (valid) {
          user = registeredAccount.user;
        }
      }
    }

    if (!user) {
      return false;
    }

    try {
      sessionStorage.setItem(SESSION_KEY, String(user.id));
    } catch {
      return false;
    }

    this.currentUserState.set(demoAccount ? this.withDemoPhoto(user) : user);
    return true;
  }

  async signup(data: SignupData): Promise<string | null> {
    const username = data.username.trim();
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();

    if (username.length < 3 || !name || !email) {
      return 'Please enter valid account information.';
    }

    if (data.password.length < 6) {
      return 'Demo password must be at least 6 characters.';
    }

    const allUsers = [
      ...MOCK_ACCOUNTS.map(account => account.user),
      ...this.registeredAccounts.map(account => account.user)
    ];

    const exists = allUsers.some(user =>
      user.username.toLowerCase() === username.toLowerCase() ||
      user.email.toLowerCase() === email
    );

    if (exists) {
      return 'Username or email already exists.';
    }

    const id = Math.max(0, ...allUsers.map(user => user.id)) + 1;

    const user: User = {
      id,
      username,
      name,
      email,
      role: 'trainee',
      profilePicture: data.profilePicture?.trim() || undefined,
      preferences: data.preferences,
      demoCard: data.demoCard
    };

    const verifier = await createDemoVerifier(data.password);

    const newAccount: StoredAccount = {
      user,
      ...verifier
    };

    try {
      const updatedAccounts = [
        ...this.registeredAccounts,
        newAccount
      ];

      localStorage.setItem(
        ACCOUNTS_KEY,
        JSON.stringify(updatedAccounts)
      );

      this.registeredAccounts.push(newAccount);
      return null;
    } catch {
      return 'Unable to save account. Check browser storage settings.';
    }
  }

listUsers(): { user: User; builtIn: boolean }[] {
  if (!this.hasRole('admin')) return [];

  return [
    ...MOCK_ACCOUNTS.map(account => ({
      user: { ...account.user },
      builtIn: true
    })),
    ...this.registeredAccounts.map(account => ({
      user: { ...account.user },
      builtIn: false
    }))
  ];
}

private saveAccounts(accounts: StoredAccount[]): boolean {
  try {
    localStorage.setItem(
      ACCOUNTS_KEY,
      JSON.stringify(accounts)
    );

    this.registeredAccounts.splice(
      0,
      this.registeredAccounts.length,
      ...accounts
    );

    return true;
  } catch {
    return false;
  }
}

updateUserRole(id: number, role: UserRole): boolean {
  if (!this.hasRole('admin')) return false;

  // Prevent changing your own role.
  if (this.currentUser()?.id === id) return false;

  if (!['admin', 'accountant', 'trainee'].includes(role)) {
    return false;
  }

  // Only registered accounts are editable.
  const exists = this.registeredAccounts.some(
    account => account.user.id === id
  );

  if (!exists) return false;

  const updatedAccounts = this.registeredAccounts.map(
    account =>
      account.user.id === id
        ? {
            ...account,
            user: { ...account.user, role }
          }
        : account
  );

  return this.saveAccounts(updatedAccounts);
}

deleteUser(id: number): boolean {
  if (!this.hasRole('admin')) return false;

  // Never delete your own account.
  if (this.currentUser()?.id === id) return false;

  const exists = this.registeredAccounts.some(
    account => account.user.id === id
  );

  if (!exists) return false;

  const updatedAccounts = this.registeredAccounts.filter(
    account => account.user.id !== id
  );

  return this.saveAccounts(updatedAccounts);
}


  private withDemoPhoto(user: User): User {
    try {
      const stored = localStorage.getItem(DEMO_AVATAR_KEY + user.id);
      return stored && /^data:image\/(jpeg|png|webp);base64,/.test(stored)
        ? { ...user, profilePicture: stored }
        : user;
    } catch {
      return user;
    }
  }

  /** Update the current account's avatar; only compact local JPG/PNG/WebP data URLs. */
  updateProfilePicture(photo: string): boolean {
    const current = this.currentUser();
    if (!current || photo.length > 560_000 ||
        !/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(photo)) {
      return false;
    }

    const user = { ...current, profilePicture: photo };
    const exists = this.registeredAccounts.some(account => account.user.id === current.id);
    if (exists) {
      const updated = this.registeredAccounts.map(account =>
        account.user.id === current.id ? { ...account, user } : account
      );
      if (!this.saveAccounts(updated)) return false;
    } else if (MOCK_ACCOUNTS.some(account => account.user.id === current.id)) {
      try {
        localStorage.setItem(DEMO_AVATAR_KEY + current.id, photo);
      } catch {
        return false;
      }
    } else {
      return false;
    }

    this.currentUserState.set(user);
    return true;
  }

  logout(): void {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } finally {
      this.currentUserState.set(null);
    }
  }
}
