import { Component, inject } from '@angular/core';
import { DisplayPreferences } from './core/preferences/display-preferences';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/components/navbar/navbar';
import { FeedbackToast } from './shared/components/feedback-toast/feedback-toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, FeedbackToast],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: { '[class.compact-view]': 'preferences.compactView()' }
})
export class App {
  readonly preferences = inject(DisplayPreferences);
}