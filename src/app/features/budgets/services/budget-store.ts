import { computed, inject, Injectable, signal } from '@angular/core';
import { SaleRecord } from '../../../models/sale.model';
import { Sales } from '../../shop/services/sales';
import { StudentFeesService } from '../../student-fees/services/student-fees.service';
import { BUDGET_ROLE, canManageBudgets } from './budget-access';
import { BudgetEntry, LedgerEntry, salesLedger, validateEntry } from './budget-engine';

@Injectable({ providedIn: 'root' })
export class BudgetStore {
  private readonly role = inject(BUDGET_ROLE);
  private readonly shopSales = inject(Sales);
  private readonly studentFees = inject(StudentFeesService);
  private readonly manualStorageKey = 'fitmarket.budgets.manual.v1';

  readonly allowed = computed(() => canManageBudgets(this.role()));
  // Real demo transactions are reactive; no fictional opening income/expenses.
  private readonly manual = signal<BudgetEntry[]>(this.loadManual());
  // Optional override retained for integrations/tests using the existing snapshot API.
  private readonly salesOverride = signal<LedgerEntry[] | null>(null);

  readonly ledger = computed<LedgerEntry[]>(() => {
    if (!this.allowed()) return [];

    const shop = this.salesOverride() ?? salesLedger(this.shopSales.sales());
    const memberships: LedgerEntry[] = this.studentFees.payments()
      .filter(p =>
        Number.isFinite(p.amountEGP) && p.amountEGP > 0 &&
        typeof p.paidAt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(p.paidAt)
      )
      .map(p => ({
        id: `membership:${p.id}`,
        department: 'Training' as const,
        type: 'income' as const,
        amount: Math.round(p.amountEGP * 100) / 100,
        date: p.paidAt.slice(0, 10),
        description: `Paid membership invoice ${p.invoiceId.slice(0, 8)}`,
        source: 'membership' as const
      }));

    return [
      ...this.manual().map(e => ({ ...e, source: 'manual' as const })),
      ...shop,
      ...memberships
    ].map(e => ({ ...e }));
  });

  private loadManual(): BudgetEntry[] {
    try {
      const raw = localStorage.getItem(this.manualStorageKey);
      const value: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(value)) return [];
      return value.filter((e): e is BudgetEntry =>
        e !== null && typeof e === 'object' &&
        typeof e.id === 'string' && typeof e.description === 'string' &&
        validateEntry(e as BudgetEntry) === null
      );
    } catch { return []; }
  }

  private saveManual(rows: BudgetEntry[]): void {
    try {
      localStorage.setItem(this.manualStorageKey, JSON.stringify(rows));
      this.manual.set(rows);
    } catch {
      throw new Error('Unable to save budget record in browser storage.');
    }
  }
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
    const updated = editingId
      ? this.manual().map(e => e.id === editingId ? row : e)
      : [...this.manual(), row];
    this.saveManual(updated);
  }
  replaceShopSales(snapshot: readonly SaleRecord[]): void {
    if (!this.allowed()) throw new Error('Accountant or admin access required.');
    this.salesOverride.set(salesLedger(snapshot));
  }
}
