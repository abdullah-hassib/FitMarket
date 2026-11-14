
export type InvoiceStatus = 'unpaid' | 'paid' | 'void' | 'refunded';

export interface Invoice {
  id: string;
  userId: number;
  subscriptionId: string;
  description: string;
  amountEGP: number;
  status: InvoiceStatus;
  issuedAt: string;
  paidAt?: string;
  refundedAt?: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  userId: number;
  amountEGP: number;
  paidAt: string;
  method: 'demo' | 'test-visa' | 'test-mastercard';
  last4?: string;
}

/** A fictional refund record; no payment gateway is contacted. */
export interface RefundRecord {
  id: string;
  paymentId: string;
  invoiceId: string;
  userId: number;
  amountEGP: number;
  refundedAt: string;
  method: PaymentRecord['method'];
  last4?: string;
}
