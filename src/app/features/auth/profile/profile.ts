import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/auth/auth';
import { readProfilePhoto } from '../../../shared/utils/profile-photo';

@Component({
  selector: 'app-profile',
  imports: [RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  readonly auth = inject(Auth);
  photoMessage = '';
  photoError = '';
  photoLoading = false;

  async onPictureSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.photoMessage = '';
    this.photoError = '';
    this.photoLoading = true;
    try {
      const photo = await readProfilePhoto(file);
      const success = this.auth.updateProfilePicture(photo);
      if (!success) throw new Error('Unable to save the picture. Browser storage may be full.');
      this.photoMessage = 'Profile photo updated!';
    } catch (error) {
      this.photoError = error instanceof Error ? error.message : 'Could not update the photo.';
    } finally {
      this.photoLoading = false;
      input.value = '';
    }
  }
}
