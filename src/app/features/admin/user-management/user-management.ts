
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../../core/auth/auth';
import { User, UserRole } from '../../../models/user.model';

interface AccountRow {
  user: User;
  builtIn: boolean;
}

@Component({
  selector: 'app-user-management',
  imports: [FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagement {
  readonly auth = inject(Auth);

  users: AccountRow[] = [];
  message = '';

  constructor() {
    this.refreshUsers();
  }

  refreshUsers(): void {
    this.users = this.auth.listUsers();
  }

  changeRole(id: number, role: UserRole): void {
    const success = this.auth.updateUserRole(id, role);

    this.message = success
      ? 'User role updated successfully.'
      : 'Could not update user role.';

    this.refreshUsers();
  }

  deleteUser(id: number): void {
    const account = this.users.find(
      item => item.user.id === id
    );

    if (!account || account.builtIn) return;

    const confirmed = window.confirm(
      `Delete account "${account.user.username}"?`
    );

    if (!confirmed) return;

    const success = this.auth.deleteUser(id);

    this.message = success
      ? 'User deleted successfully.'
      : 'Could not delete user.';

    this.refreshUsers();
  }
}
