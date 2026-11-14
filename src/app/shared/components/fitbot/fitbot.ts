import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-fitbot',
  templateUrl: './fitbot.html',
  styleUrl: './fitbot.css',
})
export class Fitbot {
  readonly open = signal(false);
  readonly botUrl = 'https://bots.easy-peasy.ai/bot/14571691-cec1-4916-b035-f6bb55f7a445';

  toggle(): void {
    this.open.update(value => !value);
  }

  close(): void {
    this.open.set(false);
  }
}
