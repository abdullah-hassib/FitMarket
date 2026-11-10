
export type InvoiceStatus = 'unpaid' | 'paid';

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
  method: 'demo';
}
