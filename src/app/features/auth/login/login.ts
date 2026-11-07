
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../../core/auth/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  readonly auth = inject(Auth);

  username = '';
  password = '';
  errorMessage = '';

  onSubmit(): void {
    this.errorMessage = '';

    const success = this.auth.login(
      this.username,
      this.password
    );

    this.password = '';

    if (!success) {
      this.errorMessage = 'Invalid username or password.';
    }
  }

  logout(): void {
    this.auth.logout();
    this.username = '';
    this.password = '';
    this.errorMessage = '';
  }
}
