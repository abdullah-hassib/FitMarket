import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Auth } from '../../../../core/auth/auth';
import { User } from '../../../../models/user.model';
import { MembershipService } from '../../services/membership.service';
import { StudentFeesService } from '../../../student-fees/services/student-fees.service';
import { MembershipsPage } from './memberships-page';

describe('membership test-card checkout', () => {
  let page: MembershipsPage;
  let memberships: MembershipService;
  let fees: StudentFeesService;
  const user = signal<User | null>({
    id: 42, username: 'test-trainee', name: 'Demo Customer',
    email: 'demo@example.test', role: 'trainee'
  });

  beforeEach(async () => {
    localStorage.removeItem('fitmarket_memberships_v1');
    localStorage.removeItem('fitmarket_student_fees_v1');
    localStorage.removeItem('fitmarket_sound_enabled_v1');
    await TestBed.configureTestingModule({
      imports: [MembershipsPage],
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: {
          currentUser: user.asReadonly(),
          isLoggedIn: computed(() => !!user()),
          currentRole: computed(() => user()?.role ?? null)
        } }
      ]
    }).compileComponents();
    page = TestBed.createComponent(MembershipsPage).componentInstance;
    memberships = TestBed.inject(MembershipService);
    fees = TestBed.inject(StudentFeesService);
  });

  it('declines a test card without creating any invoice or membership', async () => {
    page.selectPlan('basic');
    page.selectTestCard('4000 0000 0000 0002');
    page.cvv = '123';
    await page.confirmSubscription();
    expect(memberships.subscriptions()).toHaveLength(0);
    expect(fees.invoices()).toHaveLength(0);
    expect(page.paymentError()).toContain('declined');
    expect(page.cvv).toBe('');
  });

  it('activates once on approval and saves only the card type and last four', async () => {
    page.selectPlan('standard');
    page.cvv = '123';
    const first = page.confirmSubscription();
    const second = page.confirmSubscription();
    expect(page.processing()).toBe(true);
    await Promise.all([first, second]);
    expect(memberships.subscriptions()).toHaveLength(1);
    expect(memberships.subscriptions()[0].status).toBe('active');
    expect(fees.invoices()).toHaveLength(1);
    expect(fees.invoices()[0].status).toBe('paid');
    expect(fees.payments()).toHaveLength(1);
    expect(fees.payments()[0].method).toBe('test-visa');
    expect(fees.payments()[0].last4).toBe('4242');
    expect(JSON.stringify(fees.payments())).not.toContain('cvv');
    expect(JSON.stringify(fees.payments())).not.toContain('cardNumber');
    expect(page.cvv).toBe('');
  });
});
