import { SaleRecord } from '../../../models/sale.model';
import { CommissionPolicy, Employee, MonthlyPayrollAdjustment } from '../models/payroll.model';
import { calculatePayroll, createMonthlyReport, isSaleInMonth } from './payroll-calculation.service';

const employee: Employee = { id: 7, name: 'Mina Adel', jobTitle: 'Sales Coach', baseSalary: 8000 };
const adjustment: MonthlyPayrollAdjustment = { employeeId: 7, month: '2026-11', allowances: 600, deductions: 250 };
const policy: CommissionPolicy = { rate: 0.05, basis: 'sale-total-after-discount' };
const sales: SaleRecord[] = [
  { id: 1, date: '2026-11-02', items: [], subtotal: 1000, discountAmount: 100, total: 900, staffId: 7 },
  { id: 2, date: '2026-10-31', items: [], subtotal: 800, discountAmount: 0, total: 800, staffId: 7 },
  { id: 3, date: '2026-11-10', items: [], subtotal: 400, discountAmount: 0, total: 400 },
];

describe('payroll calculations', () => {
  it('uses only assigned sales in the selected ISO month', () => {
    const result = calculatePayroll(employee, '2026-11', adjustment, sales, policy);
    expect(result.eligibleSalesCount).toBe(1);
    expect(result.eligibleSalesTotal).toBe(900);
    expect(result.commission).toBe(45);
    expect(result.netSalary).toBe(8395);
  });

  it('does not count a sale from another month or an unassigned sale', () => {
    expect(isSaleInMonth(sales[1], '2026-11')).toBe(false);
    expect(calculatePayroll(employee, '2026-11', adjustment, [sales[2]], policy).commission).toBe(0);
  });

  it('normalizes invalid negative values so pay cannot be distorted', () => {
    const result = calculatePayroll({ ...employee, baseSalary: -1 }, '2026-11', { ...adjustment, allowances: -5, deductions: -9 }, sales, { ...policy, rate: -2 });
    expect(result.netSalary).toBe(0);
  });

  it('creates parseable report JSON with totals', () => {
    const report = createMonthlyReport([employee], '2026-11', [adjustment], sales, policy);
    const parsed = JSON.parse(JSON.stringify(report));
    expect(parsed.employees).toHaveLength(1);
    expect(parsed.totals.netSalary).toBe(8395);
  });
});
