import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Feedback } from '../../shared/services/feedback';

export const SKIP_GLOBAL_ERROR_TOAST = 'X-Skip-Error-Toast';

export const apiFeedbackInterceptor: HttpInterceptorFn = (req, next) => {
  const feedback = inject(Feedback);
  const skipToast = req.headers.has(SKIP_GLOBAL_ERROR_TOAST);
  const cleanReq = skipToast ? req.clone({ headers: req.headers.delete(SKIP_GLOBAL_ERROR_TOAST) }) : req;

  return next(cleanReq).pipe(
    catchError((error: unknown) => {
      if (!skipToast && error instanceof HttpErrorResponse) {
        feedback.fromHttpError(error);
      }
      return throwError(() => error);
    }),
  );
};
