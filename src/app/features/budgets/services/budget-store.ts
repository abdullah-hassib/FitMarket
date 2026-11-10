import { computed, inject, Injectable, signal } from '@angular/core';
import { SaleRecord } from '../../../models/sale.model';
import { BUDGET_ROLE, canManageBudgets } from './budget-access';
import { BudgetEntry, LedgerEntry, salesLedger, validateEntry } from './budget-engine';

const SEED: BudgetEntry[] = [
  {
    id: 'demo:1',
    department: 'Training',
    type: 'income',
    amount: 18000,
    date: '2026-11-01',
    description: 'Fictional academy subscriptions',
  },
  {
    id: 'demo:2',
    department: 'Training',
    type: 'expense',
    amount: 7200,
    date: '2026-11-03',
    description: 'Fictional equipment maintenance',
  },
  {
    id: 'demo:3',
    department: 'Shop',
    type: 'expense',
    amount: 2600,
    date: '2026-11-04',
    description: 'Fictional inventory delivery',
  },
  {
    id: 'demo:4',
    department: 'Events',
    type: 'income',
    amount: 4500,
    date: '2026-11-05',
    description: 'Fictional workshop registrations',
  },
  {
    id: 'demo:5',
    department: 'Events',
    type: 'expense',
    amount: 5200,
    date: '2026-11-06',
    description: 'Fictional venue hire',
  },
];
@Injectable({ providedIn: 'root' })
export class BudgetStore {
  private readonly role = inject(BUDGET_ROLE);
  readonly allowed = computed(() => canManageBudgets(this.role()));
  private readonly manual = signal<BudgetEntry[]>(SEED.map((e) => ({ ...e })));
  private readonly sales = signal<LedgerEntry[]>([]);
  readonly ledger = computed<LedgerEntry[]>(() =>
    this.allowed()
      ? [...this.manual().map((e) => ({ ...e, source: 'manual' as const })), ...this.sales()].map(
          (e) => ({ ...e }),
        )
      : [],
  );
  save(entry: BudgetEntry, editingId?: string): void {
    if (!this.allowed()) throw new Error('Accountant or admin access required.');
    const error = validateEntry(entry);
    if (error) throw new Error(error);
    if (editingId && !this.manual().some((e) => e.id === editingId))
      throw new Error('Record no longer exists or is managed by Shop.');
    const row = {
      ...entry,
      description: entry.description.trim(),
      id: editingId ?? crypto.randomUUID(),
    };
    this.manual.update((rows) =>
      editingId ? rows.map((e) => (e.id === editingId ? row : e)) : [...rows, row],
    );
  }
  replaceShopSales(snapshot: readonly SaleRecord[]): void {
    if (!this.allowed()) throw new Error('Accountant or admin access required.');
    this.sales.set(salesLedger(snapshot));
  }
}
