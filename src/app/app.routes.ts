import { Routes } from '@angular/router';
import { ComingSoon } from './shared/components/coming-soon/coming-soon';

export const routes: Routes = [
  { path: '', component: ComingSoon },
  { path: 'shop', component: ComingSoon },
  { path: 'memberships', component: ComingSoon },
  { path: 'student-fees', component: ComingSoon },
  {
    path: 'payroll',
    loadComponent: () => import('./features/payroll/pages/payroll-page/payroll-page').then((m) => m.PayrollPage),
  },
  { path: 'budgets', component: ComingSoon },
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
  { path: 'profile', component: ComingSoon },
  { path: 'admin/products', component: ComingSoon },

  { path: '**', redirectTo: '' },
];