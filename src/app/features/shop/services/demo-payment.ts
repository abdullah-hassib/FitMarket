import { Injectable } from '@angular/core';
import { DemoPaymentReceipt } from '../../../models/demo-payment.model';

export interface DemoCardFields {
  cardholder: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export type DemoPaymentResult =
  | { ok: true; receipt: DemoPaymentReceipt }
  | { ok: false; message: string };

export const TEST_CARDS = [
  { id: 'test-visa', name: 'Test Visa', number: '4242 4242 4242 4242', outcome: 'approved' },
  { id: 'test-mastercard', name: 'Test Mastercard', number: '5555 5555 5555 4444', outcome: 'approved' },
  { id: 'test-declined', name: 'Declined test card', number: '4000 0000 0000 0002', outcome: 'declined' }
] as const;

/**
 * No gateway is contacted. Only the test numbers above are recognized.
 * Never save cardholder details, full numbers, expiry or CVV.
 */
@Injectable({ providedIn: 'root' })
export class DemoPayment {
  authorize(fields: DemoCardFields): DemoPaymentResult {
    if (fields.cardholder.trim().length < 2) {
      return { ok: false, message: 'Enter a name for the fictional test card.' };
    }

    const digits = fields.cardNumber.replace(/\s/g, '');
    const card = TEST_CARDS.find(item => item.number.replace(/\s/g, '') === digits);
    if (!card) {
      return { ok: false, message: 'Use one of the test card numbers shown below. Real cards are not supported.' };
    }

    const expiry = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(fields.expiry.trim());
    if (!expiry) {
      return { ok: false, message: 'Enter an expiry date in MM/YY format.' };
    }
    const month = Number(expiry[1]);
    const year = 2000 + Number(expiry[2]);
    const today = new Date();
    if (year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth() + 1)) {
      return { ok: false, message: 'That test card has expired.' };
    }

    if (!/^\d{3}$/.test(fields.cvv.trim())) {
      return { ok: false, message: 'Enter a three-digit demo CVV (for example, 123).' };
    }

    if (card.outcome === 'declined') {
      return { ok: false, message: 'This test card simulates a declined payment. No order was placed.' };
    }

    const receipt: DemoPaymentReceipt = card.id === 'test-visa'
      ? { method: 'test-visa', last4: '4242', status: 'demo-paid' }
      : { method: 'test-mastercard', last4: '4444', status: 'demo-paid' };

    return { ok: true, receipt };
  }
}
