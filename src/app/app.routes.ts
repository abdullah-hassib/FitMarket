import { Routes } from '@angular/router';
import { ComingSoon } from './shared/components/coming-soon/coming-soon';
import { authGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', component: ComingSoon },
  { path: 'shop', component: ComingSoon },
  {
  path: 'memberships',
  loadComponent: () =>
    import('./features/memberships/pages/memberships-page/memberships-page')
      .then(m => m.MembershipsPage)
},
  { path: 'student-fees', component: ComingSoon,
    canActivate: [authGuard] 

  },
 {
  path: 'payroll',
  loadComponent: () =>
    import('./features/payroll/pages/payroll-page/payroll-page')
      .then(m => m.PayrollPage),
  canActivate: [roleGuard(['admin', 'accountant'])]
},
  {
  path: 'budgets',
  component: ComingSoon,
  canActivate: [roleGuard(['admin', 'accountant'])]
},
{
  path: 'login',
  loadComponent: () =>
    import('./features/auth/login/login')
      .then(m => m.Login)
},
  {
  path: 'signup',
  loadComponent: () =>
    import('./features/auth/signup/signup')
      .then(m => m.Signup)
},
 {
  path: 'profile',
  loadComponent: () =>
    import('./features/auth/profile/profile')
      .then(m => m.Profile),
  canActivate: [authGuard]
},
  { path: 'admin/products', component: ComingSoon },
{
  path: 'admin/users',
  loadComponent: () =>
    import('./features/admin/user-management/user-management')
      .then(m => m.UserManagement),
  canActivate: [roleGuard(['admin'])]
},


  { path: '**', redirectTo: '' },
];