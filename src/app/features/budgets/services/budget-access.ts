import { inject, InjectionToken } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../../../models/user.model';

// Hassib provides a reactive reader backed by Auth.currentRole. Deny by default.
export const BUDGET_ROLE = new InjectionToken<() => UserRole | null>('BUDGET_ROLE', {
  providedIn: 'root',
  factory: () => () => null,
});
export function canManageBudgets(role: UserRole | null): boolean {
  return role === 'admin' || role === 'accountant';
}
export const budgetsGuard: CanActivateFn = () =>
  canManageBudgets(inject(BUDGET_ROLE)()) || inject(Router).createUrlTree(['/login']);
