import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { UserRole } from '../../../models/user.model';
import { BudgetStore } from './budget-store';
import { BUDGET_ROLE, budgetsGuard } from './budget-access';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { Sales } from '../../shop/services/sales';
import { StudentFeesService } from '../../student-fees/services/student-fees.service';
import { SaleRecord } from '../../../models/sale.model';

describe('BudgetStore access and updates', () => {
  const role = signal<UserRole | null>(null);
  let store: BudgetStore;
  const saleSnapshot = signal<SaleRecord[]>([]);
  const paymentSnapshot = signal<{ id: string; invoiceId: string; amountEGP: number; paidAt: string }[]>([]);
  beforeEach(() => {
    role.set(null);
    saleSnapshot.set([]);
    paymentSnapshot.set([]);
    localStorage.removeItem('fitmarket.budgets.manual.v1');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: BUDGET_ROLE, useValue: role },
        { provide: Sales, useValue: { sales: saleSnapshot.asReadonly() } },
        { provide: StudentFeesService, useValue: { payments: paymentSnapshot.asReadonly() } }
      ],
    });
    store = TestBed.inject(BudgetStore);
  });
  it('denies anonymous and trainee reads, writes and routing', () => {
    for (const r of [null, 'trainee'] as const) {
      role.set(r);
      expect(store.ledger()).toEqual([]);
      expect(() => store.replaceShopSales([])).toThrow();
      expect(
        TestBed.runInInjectionContext(() => budgetsGuard({} as never, {} as never)),
      ).toBeInstanceOf(UrlTree);
    }
    expect(TestBed.inject(Router)).toBeTruthy();
  });
  it('allows admin and accountant and hides data immediately on logout', () => {
    for (const r of ['admin', 'accountant'] as const) {
      role.set(r);
      expect(store.allowed()).toBe(true);
      expect(TestBed.runInInjectionContext(() => budgetsGuard({} as never, {} as never))).toBe(
        true,
      );
    }
    role.set(null);
    expect(store.ledger()).toEqual([]);
  });
  it('adds and edits without duplicating records and does not expose mutable state', () => {
    role.set('accountant');
    const initial = store.ledger().length;
    const entry = {
      id: '',
      department: 'Training' as const,
      type: 'income' as const,
      amount: 25,
      date: '2026-11-09',
      description: 'Extra session',
    };
    store.save(entry);
    const row = store.ledger().find((e) => e.description === entry.description)!;
    store.save({ ...row, amount: 50 }, row.id);
    expect(store.ledger().length).toBe(initial + 1);
    expect(store.ledger().find((e) => e.id === row.id)?.amount).toBe(50);
    row.amount = 999;
    expect(store.ledger().find((e) => e.id === row.id)?.amount).toBe(50);
    expect(() => store.save(entry, 'sale:99')).toThrow();
  });
  it('reactively includes actual shop revenue and paid membership income without duplicate seeds', () => {
    role.set('accountant');
    expect(store.ledger()).toEqual([]);
    saleSnapshot.set([
      { id: 77, date: '2026-11-13', items: [], subtotal: 300, discountAmount: 30, total: 270 }
    ]);
    paymentSnapshot.set([
      { id: 'payment1', invoiceId: 'invoice1', amountEGP: 500, paidAt: '2026-11-13T09:00:00.000Z' }
    ]);
    const ledger = store.ledger();
    expect(ledger.find(row => row.id === 'sale:77')?.amount).toBe(270);
    expect(ledger.find(row => row.id === 'membership:payment1')?.amount).toBe(500);
    expect(ledger.reduce((sum, row) => sum + row.amount, 0)).toBe(770);
    saleSnapshot.set([]);
    expect(store.ledger().some(row => row.id === 'sale:77')).toBe(false);
  });

  it('replaces sales snapshots instead of appending on refresh', () => {
    role.set('admin');
    const sales = [
      { id: 1, date: '2026-11-01', items: [], subtotal: 100, discountAmount: 20, total: 80 },
    ];
    store.replaceShopSales(sales);
    store.replaceShopSales(sales);
    expect(store.ledger().filter((e) => e.source === 'shop').length).toBe(1);
    store.replaceShopSales([]);
    expect(store.ledger().filter((e) => e.source === 'shop').length).toBe(0);
  });
});
