import { Injectable, signal } from '@angular/core';

const SOUND_KEY = 'fitmarket_sound_enabled_v1';

/** Original short Web Audio tones; opt-in, disabled by default. */
@Injectable({ providedIn: 'root' })
export class Sound {
  readonly enabled = signal(this.savedPreference());
  private context?: AudioContext;

  private savedPreference(): boolean {
    try { return localStorage.getItem(SOUND_KEY) === '1'; }
    catch { return false; }
  }

  toggle(): void {
    const next = !this.enabled();
    this.enabled.set(next);
    try { localStorage.setItem(SOUND_KEY, next ? '1' : '0'); } catch { /* no storage available */ }
    if (next) this.unlock();
  }

  /** Call synchronously from a user gesture to satisfy browser audio policies. */
  unlock(): void {
    if (!this.enabled() || typeof window === 'undefined' || !window.AudioContext) return;
    try {
      this.context ??= new window.AudioContext();
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
    } catch { /* audio is optional */ }
  }

  private notes(tones: readonly { frequency: number; offset: number; duration: number }[]): void {
    if (!this.enabled()) return;
    this.unlock();
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running') return;
    try {
      const start = ctx.currentTime;
      for (const note of tones) {
        const oscillator = ctx.createOscillator();
        const volume = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(note.frequency, start + note.offset);
        volume.gain.setValueAtTime(0.0001, start + note.offset);
        volume.gain.exponentialRampToValueAtTime(0.055, start + note.offset + 0.015);
        volume.gain.exponentialRampToValueAtTime(0.0001, start + note.offset + note.duration);
        oscillator.connect(volume).connect(ctx.destination);
        oscillator.start(start + note.offset);
        oscillator.stop(start + note.offset + note.duration + 0.02);
      }
    } catch { /* never block checkout due to audio */ }
  }

  playAdded(): void {
    this.notes([{ frequency: 540, offset: 0, duration: 0.085 }]);
  }

  playSuccess(): void {
    this.notes([
      { frequency: 523, offset: 0, duration: 0.16 },
      { frequency: 659, offset: 0.12, duration: 0.16 },
      { frequency: 784, offset: 0.24, duration: 0.25 }
    ]);
  }

  playError(): void {
    this.notes([{ frequency: 230, offset: 0, duration: 0.16 }]);
  }
}
