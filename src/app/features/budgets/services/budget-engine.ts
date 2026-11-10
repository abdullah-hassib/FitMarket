import { SaleRecord } from '../../../models/sale.model';

export const DEPARTMENTS = ['Training', 'Shop', 'Events'] as const;
export type Department = (typeof DEPARTMENTS)[number];
export interface BudgetEntry {
  id: string;
  department: Department;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  description: string;
}
export interface LedgerEntry extends BudgetEntry {
  source: 'manual' | 'shop';
}
export interface Summary {
  department: Department;
  income: number;
  expenses: number;
  balance: number;
}
export const cents = (amount: number) => Math.round(amount * 100);
export function validDate(date: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(date)) &&
    new Date(date).toISOString().slice(0, 10) === date
  );
}
export function validateEntry(entry: BudgetEntry): string | null {
  if (!DEPARTMENTS.includes(entry.department) || !['income', 'expense'].includes(entry.type))
    return 'Choose a department and record type.';
  if (entry.department === 'Shop' && entry.type === 'income')
    return 'Shop income comes exclusively from sales.';
  if (
    !Number.isFinite(entry.amount) ||
    entry.amount <= 0 ||
    entry.amount > 100000000 ||
    Math.abs(entry.amount * 100 - cents(entry.amount)) > 0.00001
  )
    return 'Enter a positive amount with at most two decimal places (maximum EGP 100,000,000).';
  if (!validDate(entry.date)) return 'Enter a valid calendar date.';
  if (!entry.description.trim() || entry.description.trim().length > 160)
    return 'Enter a description of 1–160 characters.';
  return null;
}
// Snapshot semantics: repeated IDs replace earlier versions; a refreshed snapshot
// removes deleted sales. Sale total is already net of discounts.
export function salesLedger(sales: readonly SaleRecord[]): LedgerEntry[] {
  const unique = new Map<number, SaleRecord>();
  for (const sale of sales) {
    if (
      !Number.isSafeInteger(sale.id) ||
      !Number.isFinite(sale.total) ||
      sale.total < 0 ||
      sale.total > 100000000 ||
      !validDate(sale.date.slice(0, 10))
    )
      throw new Error('Invalid Shop sales snapshot.');
    unique.set(sale.id, sale);
  }
  return [...unique.values()].map((s) => ({
    id: `sale:${s.id}`,
    department: 'Shop',
    type: 'income',
    amount: cents(s.total) / 100,
    date: s.date.slice(0, 10),
    description: `Shop sale #${s.id}`,
    source: 'shop',
  }));
}
export function summarize(entries: readonly LedgerEntry[]): Summary[] {
  return DEPARTMENTS.map((department) => {
    const rows = entries.filter((e) => e.department === department);
    const income = rows
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + cents(e.amount), 0);
    const expenses = rows
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + cents(e.amount), 0);
    return {
      department,
      income: income / 100,
      expenses: expenses / 100,
      balance: (income - expenses) / 100,
    };
  });
}
