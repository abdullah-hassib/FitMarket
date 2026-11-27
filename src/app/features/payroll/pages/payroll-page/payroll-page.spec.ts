import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from '../../../../core/auth/auth';
import { MOCK_ACCOUNTS } from '../../../../core/auth/mock-accounts';
import { Feedback } from '../../../../shared/services/feedback';
import { PayrollPage } from './payroll-page';

describe('PayrollPage', () => {
  let component: PayrollPage;
  let fixture: ComponentFixture<PayrollPage>;
  let auth: Auth;
  let feedback: Feedback;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PayrollPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    auth = TestBed.inject(Auth);
    feedback = TestBed.inject(Feedback);
    fixture = TestBed.createComponent(PayrollPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('loads payroll for an accountant and matches JSON export to displayed rows', async () => {
    const accountant = MOCK_ACCOUNTS.find((a) => a.user.role === 'accountant')!;
    await auth.login(accountant.user.username, accountant.password);
    await component.loadMonth('2026-11');
    fixture.detectChanges();

    expect(component.canEdit()).toBe(true);
    expect(component.rows().length).toBe(3);

    await component.updateAdjustment(101, 'allowances', 1000);
    const exported = component.buildExportReport();
    expect(exported.employees).toEqual(component.rows());
    expect(exported.totals).toEqual(component.totals());

    await component.runPayroll();
    expect(feedback.notice()?.kind).toBe('success');
  });

  it('denies confidential payroll data to non-accountant trainees', async () => {
    const trainee = MOCK_ACCOUNTS.find((a) => a.user.role === 'trainee')!;
    await auth.login(trainee.user.username, trainee.password);
    fixture.detectChanges();

    expect(component.canEdit()).toBe(false);
    expect(component.rows().length).toBe(0);
    expect(component.errorMessage()).toContain('accountants or admins');
  });
});
