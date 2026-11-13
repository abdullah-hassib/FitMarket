import { Injectable, signal } from '@angular/core';

export type FeedbackKind = 'success' | 'error';
export interface FeedbackNotice {
  id: number;
  kind: FeedbackKind;
  message: string;
}

/** Shared short-lived notifications. No payment data is ever passed here. */
@Injectable({ providedIn: 'root' })
export class Feedback {
  private readonly state = signal<FeedbackNotice | null>(null);
  readonly notice = this.state.asReadonly();
  private timeout?: ReturnType<typeof setTimeout>;
  private nextId = 1;

  show(kind: FeedbackKind, message: string): void {
    this.dismiss();
    const id = this.nextId++;
    this.state.set({ id, kind, message });
    this.timeout = setTimeout(() => {
      if (this.notice()?.id === id) this.dismiss();
    }, 3500);
  }

  dismiss(): void {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = undefined;
    this.state.set(null);
  }
}
