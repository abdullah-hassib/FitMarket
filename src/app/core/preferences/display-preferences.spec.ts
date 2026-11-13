import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { DisplayPreferences } from './display-preferences';

describe('DisplayPreferences cookie', () => {
  let fakeDocument: { cookie: string; location: { protocol: string } };

  beforeEach(() => {
    fakeDocument = { cookie: '', location: { protocol: 'http:' } };
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: fakeDocument }]
    });
  });

  it('defaults to comfortable and writes a non-sensitive compact-view cookie', () => {
    const preferences = TestBed.inject(DisplayPreferences);
    expect(preferences.compactView()).toBe(false);
    preferences.toggleCompactView();
    expect(preferences.compactView()).toBe(true);
    expect(fakeDocument.cookie).toContain('fitmarket_compact_view=1');
    expect(fakeDocument.cookie).toContain('SameSite=Lax');
    expect(fakeDocument.cookie).toContain('Max-Age=2592000');
    expect(fakeDocument.cookie).not.toContain('Secure');
  });

  it('restores a saved preference and adds Secure on HTTPS', () => {
    fakeDocument.cookie = 'fitmarket_compact_view=1';
    fakeDocument.location.protocol = 'https:';
    const preferences = TestBed.inject(DisplayPreferences);
    expect(preferences.compactView()).toBe(true);
    preferences.toggleCompactView();
    expect(preferences.compactView()).toBe(false);
    expect(fakeDocument.cookie).toContain('fitmarket_compact_view=0');
    expect(fakeDocument.cookie).toContain('Secure');
  });
});
