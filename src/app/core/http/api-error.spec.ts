import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Feedback } from '../../shared/services/feedback';
import { normalizeHttpError } from './api-error';
import { apiFeedbackInterceptor, SKIP_GLOBAL_ERROR_TOAST } from './api-feedback.interceptor';

describe('normalizeHttpError', () => {
  it('maps 422 validation errors and extracts field errors', () => {
    const err = new HttpErrorResponse({
      status: 422,
      error: {
        message: 'The given data was invalid.',
        errors: {
          email: ['The email must be a valid email address.'],
          name: ['The name field is required.'],
        },
      },
    });

    const normalized = normalizeHttpError(err);
    expect(normalized.category).toBe('validation');
    expect(normalized.message).toBe('The email must be a valid email address.');
    expect(normalized.fieldErrors['name']).toEqual(['The name field is required.']);
  });

  it('maps 401, 403, 404, 500, and 0 network status codes', () => {
    expect(normalizeHttpError(new HttpErrorResponse({ status: 401 })).category).toBe('unauthorized');
    expect(normalizeHttpError(new HttpErrorResponse({ status: 403 })).category).toBe('forbidden');
    expect(normalizeHttpError(new HttpErrorResponse({ status: 404 })).category).toBe('not_found');
    expect(normalizeHttpError(new HttpErrorResponse({ status: 500, error: { message: 'SQLSTATE leak' } }))).toEqual({
      status: 500,
      category: 'server',
      message: 'A server error occurred. Please try again shortly.',
      fieldErrors: {},
    });
    expect(normalizeHttpError(new HttpErrorResponse({ status: 0 })).category).toBe('network');
  });
});

describe('apiFeedbackInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let feedback: Feedback;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiFeedbackInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    feedback = TestBed.inject(Feedback);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('shows a standardized error toast on 404', () => {
    let caughtStatus = 0;
    http.get('/api/profiles/999').subscribe({
      error: (err: HttpErrorResponse) => {
        caughtStatus = err.status;
      },
    });

    const req = httpMock.expectOne('/api/profiles/999');
    req.flush({ message: 'Profile not found.' }, { status: 404, statusText: 'Not Found' });

    expect(caughtStatus).toBe(404);
    expect(feedback.notice()?.kind).toBe('error');
    expect(feedback.notice()?.message).toBe('Profile not found.');
  });

  it('skips toast when SKIP_GLOBAL_ERROR_TOAST header is present', () => {
    http.get('/api/payroll', { headers: { [SKIP_GLOBAL_ERROR_TOAST]: '1' } }).subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne('/api/payroll');
    expect(req.request.headers.has(SKIP_GLOBAL_ERROR_TOAST)).toBe(false);
    req.flush({}, { status: 403, statusText: 'Forbidden' });

    expect(feedback.notice()).toBeNull();
  });
});
