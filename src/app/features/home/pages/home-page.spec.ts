import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomePage } from './home-page';

describe('HomePage', () => {
  it('renders the required router destinations', async () => {
    TestBed.configureTestingModule({ imports: [HomePage], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    const links = [...fixture.nativeElement.querySelectorAll('a')].map((a: HTMLAnchorElement) =>
      a.getAttribute('href'),
    );
    for (const path of ['/signup', '/login', '/memberships', '/shop', '/profile'])
      expect(links).toContain(path);
  });
});
