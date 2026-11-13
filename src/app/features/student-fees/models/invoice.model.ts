
export type InvoiceStatus = 'unpaid' | 'paid' | 'void';

export interface Invoice {
  id: string;
  userId: number;
  subscriptionId: string;
  description: string;
  amountEGP: number;
  status: InvoiceStatus;
  issuedAt: string;
  paidAt?: string;
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
