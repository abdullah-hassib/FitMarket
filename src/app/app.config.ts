import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { Auth } from './core/auth/auth';
import { apiFeedbackInterceptor } from './core/http/api-feedback.interceptor';
import { BUDGET_ROLE } from './features/budgets/services/budget-access';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiFeedbackInterceptor])),
    {
      provide: BUDGET_ROLE,
      useFactory: () => {
        const auth = inject(Auth);
        return () => auth.currentRole();
      }
    }
  ]
};
