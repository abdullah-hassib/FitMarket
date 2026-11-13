/** Only fictional payment metadata is retained after checkout. */
export type DemoPaymentMethod = 'test-visa' | 'test-mastercard';

export interface DemoPaymentReceipt {
  method: DemoPaymentMethod;
  last4: '4242' | '4444';
  status: 'demo-paid';
}

export function isDemoPaymentReceipt(value: unknown): value is DemoPaymentReceipt {
  if (!value || typeof value !== 'object') return false;
  const receipt = value as Record<string, unknown>;
  return receipt['status'] === 'demo-paid' && (
    (receipt['method'] === 'test-visa' && receipt['last4'] === '4242') ||
    (receipt['method'] === 'test-mastercard' && receipt['last4'] === '4444')
  );
}
