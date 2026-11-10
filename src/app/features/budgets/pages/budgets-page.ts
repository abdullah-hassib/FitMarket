import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BudgetStore } from '../services/budget-store';
import {
  BudgetEntry,
  cents,
  DEPARTMENTS,
  LedgerEntry,
  summarize,
  validDate,
} from '../services/budget-engine';

@Component({
  selector: 'app-budgets-page',
  imports: [FormsModule, CurrencyPipe, RouterLink],
  templateUrl: './budgets-page.html',
  styleUrl: './budgets-page.css',
})
export class BudgetsPage {
  readonly store = inject(BudgetStore);
  readonly departments = DEPARTMENTS;
  readonly department = signal('All');
  readonly from = signal('');
  readonly to = signal('');
  readonly filterError = computed(() =>
    (this.from() && !validDate(this.from())) ||
    (this.to() && !validDate(this.to())) ||
    (this.from() && this.to() && this.from() > this.to())
      ? 'Choose a valid date range with the start on or before the end.'
      : '',
  );
  readonly rows = computed(() =>
    this.filterError()
      ? []
      : this.store
          .ledger()
          .filter(
            (e) =>
              (this.department() === 'All' || e.department === this.department()) &&
              (!this.from() || e.date >= this.from()) &&
              (!this.to() || e.date <= this.to()),
          )
          .sort((a, b) => b.date.localeCompare(a.date)),
  );
  readonly summaries = computed(() =>
    summarize(this.rows()).filter(
      (s) => this.department() === 'All' || s.department === this.department(),
    ),
  );
  readonly totals = computed(() => {
    const totals = this.summaries().reduce(
      (t, s) => ({ income: t.income + cents(s.income), expenses: t.expenses + cents(s.expenses) }),
      { income: 0, expenses: 0 },
    );
    return {
      income: totals.income / 100,
      expenses: totals.expenses / 100,
      balance: (totals.income - totals.expenses) / 100,
    };
  });
  readonly chartMax = computed(() =>
    Math.max(1, ...this.summaries().flatMap((s) => [s.income, s.expenses, Math.abs(s.balance)])),
  );
  editingId?: string;
  draft: Omit<BudgetEntry, 'amount'> & { amount: number | null } = this.emptyDraft();
  message = '';
  error = '';
  private emptyDraft(): Omit<BudgetEntry, 'amount'> & { amount: number | null } {
    return {
      id: '',
      department: 'Training',
      type: 'income',
      amount: null,
      date: new Date().toISOString().slice(0, 10),
      description: '',
    };
  }
  edit(row: LedgerEntry): void {
    if (row.source !== 'manual' || !this.store.allowed()) return;
    this.editingId = row.id;
    this.draft = { ...row };
    this.error = '';
    this.message = 'Record opened for editing.';
    document.getElementById('record-description')?.focus();
  }
  cancel(): void {
    this.editingId = undefined;
    this.draft = this.emptyDraft();
    this.error = '';
  }
  save(): void {
    try {
      this.store.save({ ...this.draft, amount: this.draft.amount ?? 0 }, this.editingId);
      this.message = this.editingId ? 'Record updated.' : 'Record added.';
      this.cancel();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Unable to save the record.';
    }
  }
  width(amount: number): number {
    return (Math.abs(amount) / this.chartMax()) * 100;
  }
}
