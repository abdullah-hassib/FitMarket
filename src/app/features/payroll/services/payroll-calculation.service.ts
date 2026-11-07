import { Injectable } from '@angular/core';
import { SaleRecord } from '../../../models/sale.model';
import {
  CommissionPolicy,
  Employee,
  MonthlyPayrollAdjustment,
  MonthlyPayrollReport,
  PayrollBreakdown,
} from '../models/payroll.model';

const money = (value: number): number => Math.round(value * 100) / 100;
const nonNegative = (value: number | undefined): number =>
  Number.isFinite(value) ? Math.max(0, value ?? 0) : 0;

/**
 * Date matching deliberately uses the YYYY-MM prefix of the project's ISO date
 * strings. It avoids parsing a date into the browser timezone and changing months.
 */
export function isSaleInMonth(sale: SaleRecord, month: string): boolean {
  return /^\d{4}-\d{2}$/.test(month) && sale.date.startsWith(`${month}-`);
}

export function calculatePayroll(
  employee: Employee,
  month: string,
  adjustment: MonthlyPayrollAdjustment | undefined,
  sales: readonly SaleRecord[],
  policy: CommissionPolicy,
): PayrollBreakdown {
  const eligibleSales = sales.filter(
    (sale) => sale.staffId === employee.id && isSaleInMonth(sale, month) && nonNegative(sale.total) > 0,
  );
  const eligibleSalesTotal = money(eligibleSales.reduce((total, sale) => total + nonNegative(sale.total), 0));
  const rate = Math.min(1, nonNegative(policy.rate));
  const baseSalary = nonNegative(employee.baseSalary);
  const allowances = nonNegative(adjustment?.allowances);
  const deductions = nonNegative(adjustment?.deductions);
  const commission = money(eligibleSalesTotal * rate);

  return {
    employee,
    month,
    baseSalary,
    allowances,
    deductions,
    eligibleSalesCount: eligibleSales.length,
    eligibleSalesTotal,
    commissionRate: rate,
    commission,
    netSalary: money(baseSalary + allowances + commission - deductions),
  };
}

export function createMonthlyReport(
  employees: readonly Employee[],
  month: string,
  adjustments: readonly MonthlyPayrollAdjustment[],
  sales: readonly SaleRecord[],
  policy: CommissionPolicy,
): MonthlyPayrollReport {
  const payrollRows = employees.map((employee) =>
    calculatePayroll(employee, month, adjustments.find((item) => item.employeeId === employee.id && item.month === month), sales, policy),
  );
  const sum = (field: keyof Pick<PayrollBreakdown, 'baseSalary' | 'allowances' | 'deductions' | 'commission' | 'netSalary'>) =>
    money(payrollRows.reduce((total, row) => total + row[field], 0));

  return {
    generatedAt: new Date().toISOString(),
    month,
    commissionPolicy: policy,
    employees: payrollRows,
    totals: {
      baseSalary: sum('baseSalary'),
      allowances: sum('allowances'),
      deductions: sum('deductions'),
      commission: sum('commission'),
      netSalary: sum('netSalary'),
    },
  };
}

@Injectable({ providedIn: 'root' })
export class PayrollCalculationService {
  calculate = calculatePayroll;
  createReport = createMonthlyReport;
}
