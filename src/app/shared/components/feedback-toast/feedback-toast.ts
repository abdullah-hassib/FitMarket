import { Component, inject } from '@angular/core';
import { Feedback } from '../../services/feedback';

@Component({
  selector: 'app-feedback-toast',
  templateUrl: './feedback-toast.html',
  styleUrl: './feedback-toast.css'
})
export class FeedbackToast {
  readonly feedback = inject(Feedback);
}
