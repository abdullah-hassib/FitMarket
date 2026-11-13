import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

/**
 * Non-essential UI preference only. Do not store account IDs, card details,
 * passwords, or authentication secrets in JavaScript-readable cookies.
 */
@Injectable({ providedIn: 'root' })
export class DisplayPreferences {
  private readonly document = inject(DOCUMENT);
  private readonly cookieName = 'fitmarket_compact_view';
  readonly compactView = signal(this.loadCompactView());

  private loadCompactView(): boolean {
    const value = this.document.cookie
      .split(';')
      .map(part => part.trim())
      .find(part => part.startsWith(this.cookieName + '='))
      ?.split('=')[1];

    return value === '1';
  }

  toggleCompactView(): void {
    const next = !this.compactView();
    // This preference cannot be HttpOnly (the UI needs to read it).
    // SameSite=Lax, scoped to the site, expires after 30 days.
    const secure = this.document.location.protocol === 'https:' ? '; Secure' : '';
    this.document.cookie = `${this.cookieName}=${next ? '1' : '0'}; Max-Age=2592000; Path=/; SameSite=Lax${secure}`;
    this.compactView.set(next);
  }
}
