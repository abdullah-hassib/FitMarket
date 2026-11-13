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
    expect(memberships.subscriptions().length).toBe(0);
    expect(fees.invoices().length).toBe(0);
    expect(page.paymentError()).toContain('declined');
    expect(page.cvv).toBe('');
  });

  it('refunds a cancelled paid membership exactly once and preserves the original payment', () => {
    const sub = memberships.requestSubscription(42, 'basic')!;
    const invoice = fees.createInvoiceForSubscription(sub.id)!;
    expect(fees.payInvoice(invoice.id)).toBe(true);
    expect(memberships.subscriptions()[0].status).toBe('active');
    expect(memberships.cancelSubscription(42, sub.id)).toBe(true);

    const refund = fees.refundCancelledSubscription(sub.id);
    expect(refund).not.toBeNull();
    expect(refund!.amountEGP).toBe(500);
    expect(refund!.invoiceId).toBe(invoice.id);
    expect(fees.invoices()[0].status).toBe('refunded');
    expect(fees.payments().length).toBe(1);
    expect(fees.refunds().length).toBe(1);
    expect(fees.refundCancelledSubscription(sub.id)).toBeNull();
    expect(fees.refunds().length).toBe(1);
  });

  it('does not refund a withdrawn unpaid request', () => {
    const sub = memberships.requestSubscription(42, 'basic')!;
    expect(memberships.cancelSubscription(42, sub.id)).toBe(true);
    expect(fees.refundCancelledSubscription(sub.id)).toBeNull();
    expect(fees.refunds().length).toBe(0);
  });

  it('activates once on approval and saves only the card type and last four', async () => {
    page.selectPlan('standard');
    page.cvv = '123';
    const first = page.confirmSubscription();
    const second = page.confirmSubscription();
    expect(page.processing()).toBe(true);
    await Promise.all([first, second]);
    expect(memberships.subscriptions().length).toBe(1);
    expect(memberships.subscriptions()[0].status).toBe('active');
    expect(fees.invoices().length).toBe(1);
    expect(fees.invoices()[0].status).toBe('paid');
    expect(fees.payments().length).toBe(1);
    expect(fees.payments()[0].method).toBe('test-visa');
    expect(fees.payments()[0].last4).toBe('4242');
    expect(JSON.stringify(fees.payments())).not.toContain('cvv');
    expect(JSON.stringify(fees.payments())).not.toContain('cardNumber');
    expect(page.cvv).toBe('');
  });
});
