import { Routes } from '@angular/router';
import { ComingSoon } from './shared/components/coming-soon/coming-soon';

export const routes: Routes = [
  { path: '', component: ComingSoon },
  { path: 'shop', component: ComingSoon },
  { path: 'memberships', component: ComingSoon },
  { path: 'student-fees', component: ComingSoon },
  { path: 'payroll', component: ComingSoon },
  { path: 'budgets', component: ComingSoon },
  { path: 'login', component: ComingSoon },
  { path: 'signup', component: ComingSoon },
  { path: 'profile', component: ComingSoon },
  { path: 'admin/products', component: ComingSoon },

  { path: '**', redirectTo: '' }
];