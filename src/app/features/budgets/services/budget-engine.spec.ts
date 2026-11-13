import { BudgetEntry, salesLedger, summarize, validateEntry, validDate } from './budget-engine';
import { SaleRecord } from '../../../models/sale.model';

const sale = (id: number, total: number): SaleRecord => ({
  id,
  total,
  date: '2026-11-01',
  items: [],
  subtotal: total + 10,
  discountAmount: 10,
});
const entry: BudgetEntry = {
  id: '1',
  department: 'Events',
  type: 'expense',
  amount: 0.2,
  date: '2026-11-01',
  description: 'Venue',
};
describe('budget calculations', () => {
  it('returns all departments with zero totals for no records', () => {
    expect(summarize([])).toEqual(
      (['Training', 'Shop', 'Events'] as const).map((department) => ({
        department,
        income: 0,
        expenses: 0,
        balance: 0,
      })),
    );
  });
  it('uses cents and preserves negative balances', () => {
    const result = summarize([
      { ...entry, source: 'manual' },
      { ...entry, id: '2', amount: 0.1, source: 'manual' },
    ]);
    expect(result[2]).toEqual({ department: 'Events', income: 0, expenses: 0.3, balance: -0.3 });
  });
  it('counts discounted sale total once and takes the latest duplicate ID', () => {
    const rows = salesLedger([sale(1, 100), sale(2, 200), sale(1, 80)]);
    expect(rows.length).toBe(2);
    expect(summarize(rows)[1].income).toBe(280);
  });
  it('rejects invalid snapshots and calendar dates', () => {
    expect(() => salesLedger([sale(1, NaN)])).toThrow();
    expect(validDate('2026-02-30')).toBe(false);
    expect(validDate('2028-02-29')).toBe(true);
  });
  it('rejects manual Shop income, empty text, invalid precision and nonpositive amounts', () => {
    for (const invalid of [
      { department: 'Shop', type: 'income' },
      { description: ' ' },
      { amount: -1 },
      { amount: 0 },
      { amount: Infinity },
      { amount: 1.234 },
      { date: '2026-02-30' },
    ]) {
      expect(validateEntry({ ...entry, ...invalid } as BudgetEntry)).toBeTruthy();
    }
    expect(validateEntry(entry)).toBeNull();
  });
});
