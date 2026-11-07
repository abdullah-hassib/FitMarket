import { SaleRecord } from '../../../models/sale.model';

/** Local payroll identity. Its id is the value used by SaleRecord.staffId. */
export interface Employee {
  id: number;
  name: string;
  jobTitle: string;
  baseSalary: number;
}

export interface MonthlyPayrollAdjustment {
  employeeId: number;
  month: string; // YYYY-MM, matching the first seven characters of a sale's ISO date
  allowances: number;
  deductions: number;
}

export interface CommissionPolicy {
  /** Decimal percentage: 0.05 means 5%. This is a configurable demo value, not a team policy. */
  rate: number;
  basis: 'sale-total-after-discount';
}

export interface PayrollBreakdown {
  employee: Employee;
  month: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  eligibleSalesCount: number;
  eligibleSalesTotal: number;
  commissionRate: number;
  commission: number;
  netSalary: number;
}

export interface MonthlyPayrollReport {
  generatedAt: string;
  month: string;
  commissionPolicy: CommissionPolicy;
  employees: PayrollBreakdown[];
  totals: {
    baseSalary: number;
    allowances: number;
    deductions: number;
    commission: number;
    netSalary: number;
  };
}

export type PayrollSales = readonly SaleRecord[];
