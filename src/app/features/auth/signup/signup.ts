
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/auth/auth';
import { DemoCard } from '../../../models/user.model';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
  private readonly auth = inject(Auth);

  username = '';
  name = '';
  email = '';
  password = '';

  profilePicture = '';
  preferencesText = '';
  demoCard: DemoCard | '' = '';

  errorMessage = '';
  registered = false;

  async onSubmit(): Promise<void> {
    this.errorMessage = '';

    const error = await this.auth.signup({
      username: this.username,
      name: this.name,
      email: this.email,
      password: this.password,
      profilePicture: this.profilePicture,

      preferences: this.preferencesText
        .split(',')
        .map(value => value.trim())
        .filter(Boolean),

      demoCard: this.demoCard || undefined
    });

    if (error) {
      this.errorMessage = error;
      return;
    }

    this.password = '';
    this.registered = true;
  }
}
