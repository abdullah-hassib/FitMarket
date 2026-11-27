import { Injectable, signal } from '@angular/core';
import { NormalizedApiError, normalizeHttpError } from '../../core/http/api-error';

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

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  fromHttpError(err: unknown): NormalizedApiError {
    const normalized = normalizeHttpError(err);
    this.show('error', normalized.message);
    return normalized;
  }

  dismiss(): void {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = undefined;
    this.state.set(null);
  }
}
