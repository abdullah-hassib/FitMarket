import { CurrencyPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SaleRecord } from '../../../../models/sale.model';
import { CommissionPolicy, Employee, MonthlyPayrollAdjustment } from '../../models/payroll.model';
import { PayrollCalculationService } from '../../services/payroll-calculation.service';

@Component({
  selector: 'app-payroll-page',
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './payroll-page.html',
  styleUrl: './payroll-page.css',
})
export class PayrollPage {
  readonly selectedMonth = signal('2026-11');
  readonly commissionRatePercent = signal(5);
  // Temporary demo role. The route guard/current-user integration belongs to the shared auth module.
  readonly demoRole = signal<'admin' | 'accountant' | 'trainee'>('accountant');
  readonly canEdit = computed(() => this.demoRole() === 'admin' || this.demoRole() === 'accountant');
  readonly employees = signal<Employee[]>([
    { id: 101, name: 'Nour Samir', jobTitle: 'Gym Manager', baseSalary: 12500 },
    { id: 102, name: 'Mina Adel', jobTitle: 'Sales Coach', baseSalary: 8000 },
    { id: 103, name: 'Laila Fathy', jobTitle: 'Receptionist', baseSalary: 6500 },
  ]);
  readonly adjustments = signal<MonthlyPayrollAdjustment[]>([
    { employeeId: 101, month: '2026-11', allowances: 800, deductions: 0 },
    { employeeId: 102, month: '2026-11', allowances: 600, deductions: 250 },
    { employeeId: 103, month: '2026-11', allowances: 300, deductions: 100 },
  ]);
  // Mock shop data: only sales whose staffId matches an employee are credited.
  readonly sales: readonly SaleRecord[] = [
    { id: 5001, date: '2026-11-02', items: [], subtotal: 2400, discountAmount: 200, total: 2200, staffId: 102 },
    { id: 5002, date: '2026-11-08', items: [], subtotal: 1200, discountAmount: 0, total: 1200, staffId: 101 },
    { id: 5003, date: '2026-11-13', items: [], subtotal: 900, discountAmount: 100, total: 800 },
    { id: 5004, date: '2026-10-29', items: [], subtotal: 1800, discountAmount: 0, total: 1800, staffId: 102 },
  ];
  readonly policy = computed<CommissionPolicy>(() => ({
    rate: Math.max(0, Math.min(100, Number(this.commissionRatePercent()) || 0)) / 100,
    basis: 'sale-total-after-discount',
  }));
  readonly rows = computed(() => this.payroll.createReport(this.employees(), this.selectedMonth(), this.adjustments(), this.sales, this.policy()).employees);
  readonly totals = computed(() => this.payroll.createReport(this.employees(), this.selectedMonth(), this.adjustments(), this.sales, this.policy()).totals);

  constructor(private readonly payroll: PayrollCalculationService) {}

  updateEmployee(id: number, field: 'baseSalary', rawValue: number): void {
    if (!this.canEdit()) return;
    const value = Math.max(0, Number(rawValue) || 0);
    this.employees.update((employees) => employees.map((employee) => employee.id === id ? { ...employee, [field]: value } : employee));
  }

  updateAdjustment(id: number, field: 'allowances' | 'deductions', rawValue: number): void {
    if (!this.canEdit()) return;
    const value = Math.max(0, Number(rawValue) || 0);
    const month = this.selectedMonth();
    this.adjustments.update((adjustments) => {
      const current = adjustments.find((item) => item.employeeId === id && item.month === month);
      if (!current) return [...adjustments, { employeeId: id, month, allowances: 0, deductions: 0, [field]: value }];
      return adjustments.map((item) => item === current ? { ...item, [field]: value } : item);
    });
  }

  exportJson(): void {
    const report = this.payroll.createReport(this.employees(), this.selectedMonth(), this.adjustments(), this.sales, this.policy());
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fitmarket-payroll-${report.month}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
