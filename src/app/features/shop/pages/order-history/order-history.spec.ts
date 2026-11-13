import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Auth } from '../../../../core/auth/auth';
import { SaleRecord } from '../../../../models/sale.model';
import { Sales } from '../../services/sales';
import { OrderHistory } from './order-history';

describe('OrderHistory', () => {
  const user = signal<{ id: number } | null>({ id: 42 });
  const sales = signal<SaleRecord[]>([
    { id: 1, customerId: 42, date: '2026-11-13', items: [{ productId: 1, quantity: 1, unitPrice: 100, productName: 'Dumbbell' }], subtotal: 100, discountAmount: 0, total: 100 },
    { id: 2, customerId: 77, date: '2026-11-12', items: [{ productId: 2, quantity: 1, unitPrice: 200 }], subtotal: 200, discountAmount: 0, total: 200 },
    { id: 3, date: '2026-11-11', items: [{ productId: 3, quantity: 1, unitPrice: 300 }], subtotal: 300, discountAmount: 0, total: 300 }
  ]);

  beforeEach(() => {
    user.set({ id: 42 });
    TestBed.configureTestingModule({
      imports: [OrderHistory],
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: { currentUser: user.asReadonly() } },
        { provide: Sales, useValue: { getMyOrders: () => sales().filter(s => s.customerId === user()?.id) } }
      ]
    });
  });

  it('only shows the current account and totals its purchases', async () => {
    const fixture = TestBed.createComponent(OrderHistory);
    await fixture.whenStable();
    expect(fixture.componentInstance.orders().map(x => x.id)).toEqual([1]);
    expect(fixture.componentInstance.totalSpent()).toBe(100);
    expect(fixture.nativeElement.textContent).not.toContain('ORDER #2');
    expect(fixture.nativeElement.textContent).not.toContain('ORDER #3');
  });
});
