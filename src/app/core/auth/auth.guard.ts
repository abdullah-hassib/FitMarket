
import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router
} from '@angular/router';

import { Auth } from './auth';
import { UserRole } from '../../models/user.model';

// Requires any logged-in user.
export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return auth.isLoggedIn()
    ? true
    : router.createUrlTree(['/login']);
};

// Requires a logged-in user with an allowed role.
export const roleGuard = (
  allowedRoles: readonly UserRole[]
): CanActivateFn => {
  return () => {
    const auth = inject(Auth);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      return router.createUrlTree(['/login']);
    }

    const role = auth.currentRole();

    if (role && allowedRoles.includes(role)) {
      return true;
    }

    return router.createUrlTree(['/']);
  };
};
