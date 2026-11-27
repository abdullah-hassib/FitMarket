import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../../../core/auth/auth';
import { normalizeHttpError } from '../../../../core/http/api-error';
import { SaleRecord } from '../../../../models/sale.model';
import { Feedback } from '../../../../shared/services/feedback';
import {
  CommissionPolicy,
  Employee,
  MonthlyPayrollAdjustment,
  MonthlyPayrollReport,
} from '../../models/payroll.model';
import { PayrollApiService } from '../../services/payroll-api.service';
import { PayrollCalculationService } from '../../services/payroll-calculation.service';

@Component({
  selector: 'app-payroll-page',
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './payroll-page.html',
  styleUrl: './payroll-page.css',
})
export class PayrollPage {
  private readonly auth = inject(Auth);
  private readonly payrollApi = inject(PayrollApiService);
  private readonly feedback = inject(Feedback);

  readonly selectedMonth = signal('2026-11');
  readonly commissionRatePercent = signal(5);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly canEdit = computed(
    () => this.auth.currentRole() === 'admin' || this.auth.currentRole() === 'accountant',
  );

  readonly employees = signal<Employee[]>([]);
  readonly adjustments = signal<MonthlyPayrollAdjustment[]>([]);
  readonly sales = signal<SaleRecord[]>([]);

  readonly policy = computed<CommissionPolicy>(() => ({
    rate: Math.max(0, Math.min(100, Number(this.commissionRatePercent()) || 0)) / 100,
    basis: 'sale-total-after-discount',
  }));

  readonly report = computed<MonthlyPayrollReport>(() =>
    this.payroll.createReport(
      this.employees(),
      this.selectedMonth(),
      this.adjustments(),
      this.sales(),
      this.policy(),
    ),
  );
  readonly rows = computed(() => this.report().employees);
  readonly totals = computed(() => this.report().totals);

  constructor(private readonly payroll: PayrollCalculationService) {
    effect(() => {
      const month = this.selectedMonth();
      const role = this.auth.currentRole();
      if (role === 'admin' || role === 'accountant') {
        void this.loadMonth(month);
      } else {
        this.employees.set([]);
        this.adjustments.set([]);
        this.sales.set([]);
        if (role !== null) {
          this.errorMessage.set('Only accountants or admins can view or modify payroll.');
        }
      }
    });
  }

  async loadMonth(month = this.selectedMonth()): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const snapshot = await this.payrollApi.loadMonth(month);
      this.employees.set(snapshot.employees);
      this.adjustments.set(snapshot.adjustments);
      this.sales.set(snapshot.sales);
      this.commissionRatePercent.set(snapshot.commissionRatePercent);
    } catch (err) {
      const normalized = normalizeHttpError(err);
      this.errorMessage.set(normalized.message);
      this.feedback.error(normalized.message);
    } finally {
      this.loading.set(false);
    }
  }

  async updateEmployee(id: number, field: 'baseSalary', rawValue: number): Promise<void> {
    if (!this.canEdit()) return;
    const value = Math.max(0, Number(rawValue) || 0);
    this.employees.update((employees) =>
      employees.map((employee) => (employee.id === id ? { ...employee, [field]: value } : employee)),
    );
    try {
      await this.payrollApi.updateBaseSalary(id, value);
    } catch (err) {
      const normalized = normalizeHttpError(err);
      this.errorMessage.set(normalized.message);
      this.feedback.error(normalized.message);
    }
  }

  async updateAdjustment(
    id: number,
    field: 'allowances' | 'deductions',
    rawValue: number,
  ): Promise<void> {
    if (!this.canEdit()) return;
    const value = Math.max(0, Number(rawValue) || 0);
    const month = this.selectedMonth();
    let updatedAdjustment: MonthlyPayrollAdjustment | undefined;
    this.adjustments.update((adjustments) => {
      const current = adjustments.find((item) => item.employeeId === id && item.month === month);
      if (!current) {
        updatedAdjustment = { employeeId: id, month, allowances: 0, deductions: 0, [field]: value };
        return [...adjustments, updatedAdjustment];
      }
      updatedAdjustment = { ...current, [field]: value };
      return adjustments.map((item) => (item === current ? updatedAdjustment! : item));
    });
    if (updatedAdjustment) {
      try {
        await this.payrollApi.upsertAdjustment(updatedAdjustment);
      } catch (err) {
        const normalized = normalizeHttpError(err);
        this.errorMessage.set(normalized.message);
        this.feedback.error(normalized.message);
      }
    }
  }

  async runPayroll(): Promise<void> {
    if (!this.canEdit()) return;
    this.saving.set(true);
    this.errorMessage.set(null);
    try {
      await this.payrollApi.runMonthlyPayroll(
        this.selectedMonth(),
        this.commissionRatePercent(),
      );
      this.feedback.success(`Payroll saved for ${this.selectedMonth()}.`);
    } catch (err) {
      const normalized = normalizeHttpError(err);
      this.errorMessage.set(normalized.message);
      this.feedback.error(normalized.message);
    } finally {
      this.saving.set(false);
    }
  }

  buildExportReport(): MonthlyPayrollReport {
    return this.report();
  }

  exportJson(): void {
    if (!this.canEdit()) return;
    const report = this.buildExportReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fitmarket-payroll-${report.month}.json`;
    link.click();
    URL.revokeObjectURL(url);
    this.feedback.success(`Exported payroll JSON for ${report.month}.`);
  }
}
