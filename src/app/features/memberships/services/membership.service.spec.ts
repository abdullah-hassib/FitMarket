import { TestBed } from '@angular/core/testing';
import { MembershipService } from './membership.service';

describe('membership seven-day cancellation', () => {
  let memberships: MembershipService;

  beforeEach(() => {
    localStorage.removeItem('fitmarket_memberships_v1');
    TestBed.configureTestingModule({});
    memberships = TestBed.inject(MembershipService);
  });

  it('allows the owning trainee to cancel a recently activated membership', () => {
    const sub = memberships.requestSubscription(42, 'basic');
    expect(sub).not.toBeNull();
    expect(memberships.activateSubscription(sub!.id)).toBe(true);
    expect(memberships.cancelSubscription(5, sub!.id)).toBe(false);
    expect(memberships.cancelSubscription(42, sub!.id)).toBe(true);
    expect(memberships.subscriptions()[0].status).toBe('cancelled');
    expect(memberships.subscriptions()[0].cancelledAt).toBeTruthy();
    expect(memberships.cancelSubscription(42, sub!.id)).toBe(false);
    expect(memberships.requestSubscription(42, 'standard')).not.toBeNull();
  });

  it('rejects cancellation outside the first seven days', () => {
    const sub = memberships.requestSubscription(42, 'basic')!;
    expect(memberships.activateSubscription(sub.id)).toBe(true);
    const active = memberships.subscriptions()[0];
    const eightDaysLater = Date.parse(active.startDate!) + 8 * 24 * 60 * 60 * 1000;
    expect(memberships.canCancelSubscription(42, active, eightDaysLater)).toBe(false);
    expect(memberships.canCancelSubscription(42, active, Date.parse(active.startDate!))).toBe(true);
  });
});
