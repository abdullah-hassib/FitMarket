import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Auth } from '../../../core/auth/auth';
import { SaleRecord } from '../../../models/sale.model';
import {
  Employee,
  MonthlyPayrollAdjustment,
  MonthlyPayrollReport,
} from '../models/payroll.model';

export const PAYROLL_USE_API = new InjectionToken<boolean>('PAYROLL_USE_API', {
  providedIn: 'root',
  factory: () => false,
});

export const PAYROLL_API_BASE = new InjectionToken<string>('PAYROLL_API_BASE', {
  providedIn: 'root',
  factory: () => '/api/payroll',
});

export interface PayrollSnapshot {
  month: string;
  commissionRatePercent: number;
  employees: Employee[];
  adjustments: MonthlyPayrollAdjustment[];
  sales: SaleRecord[];
}

const DEMO_EMPLOYEES: Employee[] = [
  { id: 101, name: 'Nour Samir', jobTitle: 'Gym Manager', baseSalary: 12500 },
  { id: 102, name: 'Mina Adel', jobTitle: 'Sales Coach', baseSalary: 8000 },
  { id: 103, name: 'Laila Fathy', jobTitle: 'Receptionist', baseSalary: 6500 },
];

const DEMO_ADJUSTMENTS: MonthlyPayrollAdjustment[] = [
  { employeeId: 101, month: '2026-11', allowances: 800, deductions: 0 },
  { employeeId: 102, month: '2026-11', allowances: 600, deductions: 250 },
  { employeeId: 103, month: '2026-11', allowances: 300, deductions: 100 },
];

const DEMO_SALES: SaleRecord[] = [
  { id: 5001, date: '2026-11-02', items: [], subtotal: 2400, discountAmount: 200, total: 2200, staffId: 102 },
  { id: 5002, date: '2026-11-08', items: [], subtotal: 1200, discountAmount: 0, total: 1200, staffId: 101 },
  { id: 5003, date: '2026-11-13', items: [], subtotal: 900, discountAmount: 100, total: 800 },
  { id: 5004, date: '2026-10-29', items: [], subtotal: 1800, discountAmount: 0, total: 1800, staffId: 102 },
];

@Injectable({ providedIn: 'root' })
export class PayrollApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly useApi = inject(PAYROLL_USE_API);
  private readonly apiBase = inject(PAYROLL_API_BASE);

  async loadMonth(month: string): Promise<PayrollSnapshot> {
    if (this.useApi) {
      const params = new HttpParams().set('month', month);
      return firstValueFrom(this.http.get<PayrollSnapshot>(this.apiBase, { params }));
    }

    this.assertAuthorized();
    return {
      month,
      commissionRatePercent: 5,
      employees: DEMO_EMPLOYEES.map((e) => ({ ...e })),
      adjustments: DEMO_ADJUSTMENTS.map((a) => ({ ...a })),
      sales: DEMO_SALES.map((s) => ({ ...s })),
    };
  }

  async updateBaseSalary(employeeId: number, baseSalary: number): Promise<void> {
    if (!Number.isFinite(baseSalary) || baseSalary < 0) {
      throw new HttpErrorResponse({
        status: 422,
        statusText: 'Unprocessable Entity',
        error: { message: 'Base salary must be zero or positive.' },
      });
    }
    if (this.useApi) {
      await firstValueFrom(
        this.http.patch<void>(`${this.apiBase}/employees/${employeeId}`, { baseSalary }),
      );
      return;
    }
    this.assertAuthorized();
  }

  async upsertAdjustment(adjustment: MonthlyPayrollAdjustment): Promise<void> {
    if (adjustment.allowances < 0 || adjustment.deductions < 0) {
      throw new HttpErrorResponse({
        status: 422,
        statusText: 'Unprocessable Entity',
        error: { message: 'Allowances and deductions must be zero or positive.' },
      });
    }
    if (this.useApi) {
      await firstValueFrom(this.http.put<void>(`${this.apiBase}/adjustments`, adjustment));
      return;
    }
    this.assertAuthorized();
  }

  async runMonthlyPayroll(month: string, commissionRatePercent: number): Promise<void> {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new HttpErrorResponse({
        status: 422,
        statusText: 'Unprocessable Entity',
        error: { message: 'Payroll month must use YYYY-MM format.' },
      });
    }
    if (this.useApi) {
      await firstValueFrom(
        this.http.post<void>(`${this.apiBase}/run`, { month, commissionRatePercent }),
      );
      return;
    }
    this.assertAuthorized();
  }

  async fetchMonthlyReport(month: string): Promise<MonthlyPayrollReport> {
    this.assertAuthorized();
    const params = new HttpParams().set('month', month);
    return firstValueFrom(
      this.http.get<MonthlyPayrollReport>(`${this.apiBase}/report`, { params }),
    );
  }

  private assertAuthorized(): void {
    const role = this.auth.currentRole();
    if (!role) {
      throw new HttpErrorResponse({
        status: 401,
        statusText: 'Unauthorized',
        error: { message: 'Authentication required to access payroll.' },
      });
    }
    if (role !== 'admin' && role !== 'accountant') {
      throw new HttpErrorResponse({
        status: 403,
        statusText: 'Forbidden',
        error: { message: 'Only accountants or admins can view or modify payroll.' },
      });
    }
  }
}
