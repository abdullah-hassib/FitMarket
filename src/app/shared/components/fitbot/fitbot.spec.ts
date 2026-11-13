import { TestBed } from '@angular/core/testing';
import { Fitbot } from './fitbot';

describe('FitBot support widget', () => {
  it('shows an accessible chat button and opens the AI iframe', async () => {
    await TestBed.configureTestingModule({ imports: [Fitbot] }).compileComponents();
    const fixture = TestBed.createComponent(Fitbot);
    await fixture.whenStable();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.fitbot-toggle');
    expect(button).not.toBeNull();
    expect(button.getAttribute('aria-label')).toBe('Open FitBot support chat');

    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.fitbot-panel')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('iframe')).not.toBeNull();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.fitbot-footer a');
    expect(link.href).toContain('bots.easy-peasy.ai/bot/');

    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
  });
});
