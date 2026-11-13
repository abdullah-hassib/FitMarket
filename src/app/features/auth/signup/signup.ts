
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/auth/auth';
import { DemoCard } from '../../../models/user.model';
import { readProfilePhoto } from '../../../shared/utils/profile-photo';

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
  photoLoading = false;
  registered = false;

  async onPictureSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.photoLoading = true;
    this.errorMessage = '';
    try {
      this.profilePicture = await readProfilePhoto(file);
    } catch (error) {
      this.profilePicture = '';
      this.errorMessage = error instanceof Error ? error.message : 'Could not load the image.';
      input.value = '';
    } finally {
      this.photoLoading = false;
    }
  }

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
