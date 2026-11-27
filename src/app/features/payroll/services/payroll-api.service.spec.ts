import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Auth } from '../../../core/auth/auth';
import { MOCK_ACCOUNTS } from '../../../core/auth/mock-accounts';
import { PAYROLL_USE_API, PayrollApiService } from './payroll-api.service';

describe('PayrollApiService (HTTP API mode)', () => {
  let service: PayrollApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PAYROLL_USE_API, useValue: true },
      ],
    });
    service = TestBed.inject(PayrollApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads monthly payroll, updates salary/adjustments, and runs payroll via API', async () => {
    const loadPromise = service.loadMonth('2026-11');
    const loadReq = httpMock.expectOne('/api/payroll?month=2026-11');
    expect(loadReq.request.method).toBe('GET');
    loadReq.flush({
      month: '2026-11',
      commissionRatePercent: 5,
      employees: [{ id: 101, name: 'Nour Samir', jobTitle: 'Gym Manager', baseSalary: 12500 }],
      adjustments: [],
      sales: [],
    });
    expect((await loadPromise).employees.length).toBe(1);

    const salaryPromise = service.updateBaseSalary(101, 13000);
    const salaryReq = httpMock.expectOne('/api/payroll/employees/101');
    expect(salaryReq.request.method).toBe('PATCH');
    salaryReq.flush(null);
    await salaryPromise;

    const adjPromise = service.upsertAdjustment({
      employeeId: 101,
      month: '2026-11',
      allowances: 500,
      deductions: 100,
    });
    const adjReq = httpMock.expectOne('/api/payroll/adjustments');
    expect(adjReq.request.method).toBe('PUT');
    adjReq.flush(null);
    await adjPromise;

    const runPromise = service.runMonthlyPayroll('2026-11', 5);
    const runReq = httpMock.expectOne('/api/payroll/run');
    expect(runReq.request.method).toBe('POST');
    runReq.flush(null);
    await runPromise;
  });

  it('propagates 403 forbidden for unauthorized API calls', async () => {
    const promise = service.loadMonth('2026-11');
    httpMock
      .expectOne('/api/payroll?month=2026-11')
      .flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    let caughtStatus = 0;
    try {
      await promise;
    } catch (err) {
      caughtStatus = (err as { status: number }).status;
    }
    expect(caughtStatus).toBe(403);
  });
});

describe('PayrollApiService (authorization checks)', () => {
  let service: PayrollApiService;
  let auth: Auth;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PayrollApiService);
    auth = TestBed.inject(Auth);
  });

  it('blocks non-accountant trainees with 403 and allows accountants', async () => {
    const trainee = MOCK_ACCOUNTS.find((a) => a.user.role === 'trainee')!;
    const accountant = MOCK_ACCOUNTS.find((a) => a.user.role === 'accountant')!;

    await auth.login(trainee.user.username, trainee.password);
    let caughtStatus = 0;
    try {
      await service.loadMonth('2026-11');
    } catch (err) {
      caughtStatus = (err as { status: number }).status;
    }
    expect(caughtStatus).toBe(403);

    await auth.login(accountant.user.username, accountant.password);
    const snapshot = await service.loadMonth('2026-11');
    expect(snapshot.employees.length).toBeGreaterThan(0);
  });
});
