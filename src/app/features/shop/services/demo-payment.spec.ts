import { TestBed } from '@angular/core/testing';
import { DemoPayment, TEST_CARDS } from './demo-payment';

describe('demo payment', () => {
  let payment: DemoPayment;
  const fields = {
    cardholder: 'Demo Customer',
    cardNumber: TEST_CARDS[0].number,
    expiry: '12/30',
    cvv: '123'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    payment = TestBed.inject(DemoPayment);
  });

  it('approves the predefined test Visa and retains only non-sensitive metadata', () => {
    const result = payment.authorize(fields);
    expect(result).toEqual({ ok: true, receipt: { method: 'test-visa', last4: '4242', status: 'demo-paid' } });
    expect(JSON.stringify(result)).not.toContain(fields.cardNumber);
    expect(JSON.stringify(result)).not.toContain('cvv');
    expect(JSON.stringify(result)).not.toContain('Demo Customer');
  });

  it('approves the test Mastercard', () => {
    expect(payment.authorize({ ...fields, cardNumber: TEST_CARDS[1].number })).toEqual({
      ok: true, receipt: { method: 'test-mastercard', last4: '4444', status: 'demo-paid' }
    });
  });

  it('rejects arbitrary card numbers and a declined test card', () => {
    const unknown = payment.authorize({ ...fields, cardNumber: '4111 1111 1111 1111' });
    expect(unknown.ok).toBe(false);
    const declined = payment.authorize({ ...fields, cardNumber: TEST_CARDS[2].number });
    expect(declined.ok).toBe(false);
    if (!declined.ok) expect(declined.message).toContain('declined');
  });

  it('validates name, future expiry, and a three-digit demo CVV', () => {
    expect(payment.authorize({ ...fields, cardholder: '' }).ok).toBe(false);
    expect(payment.authorize({ ...fields, expiry: '01/20' }).ok).toBe(false);
    expect(payment.authorize({ ...fields, expiry: '19/30' }).ok).toBe(false);
    expect(payment.authorize({ ...fields, cvv: '12' }).ok).toBe(false);
    expect(payment.authorize({ ...fields, cvv: 'abc' }).ok).toBe(false);
  });
});
