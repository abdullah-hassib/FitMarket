import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { UserRole } from '../../../models/user.model';
import { ComingSoon } from '../../../shared/components/coming-soon/coming-soon';
import { BUDGET_ROLE, budgetsGuard } from '../services/budget-access';

describe('Omar route integration', () => {
  const role = signal<UserRole | null>(null);
  beforeEach(() => {
    role.set(null);
    TestBed.configureTestingModule({
      providers: [
        { provide: BUDGET_ROLE, useValue: role },
        provideRouter([
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () => import('../../home/pages/home-page').then((m) => m.HomePage),
          },
          {
            path: 'budgets',
            canActivate: [budgetsGuard],
            loadComponent: () => import('./budgets-page').then((m) => m.BudgetsPage),
          },
          ...['login', 'signup', 'shop', 'memberships', 'profile'].map((path) => ({
            path,
            component: ComingSoon,
          })),
        ]),
      ],
    });
  });
  it('lazy loads home and follows the shop link', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Find your rhythm',
    );
    (harness.routeNativeElement?.querySelector('a[href="/shop"]') as HTMLAnchorElement).click();
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.textContent).toContain('coming soon');
  });
  it('blocks direct visits and loads the dashboard for an accountant', async () => {
    const harness = await RouterTestingHarness.create('/budgets');
    expect(harness.routeNativeElement?.querySelector('table')).toBeNull();
    role.set('accountant');
    await harness.navigateByUrl('/budgets');
    expect(harness.routeNativeElement?.querySelector('table')).not.toBeNull();
    role.set('trainee');
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('table')).toBeNull();
  });
});
