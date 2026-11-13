import { Routes } from '@angular/router';
import { ComingSoon } from './shared/components/coming-soon/coming-soon';
import { authGuard, roleGuard } from './core/auth/auth.guard';
import { budgetsGuard } from './features/budgets/services/budget-access';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/home/pages/home-page').then(m => m.HomePage)
  },
  {
    path: 'shop',
    loadChildren: () =>
      import('./features/shop/shop.routes').then(m => m.SHOP_ROUTES)
  },
  {
  path: 'memberships',
  loadComponent: () =>
    import('./features/memberships/pages/memberships-page/memberships-page')
      .then(m => m.MembershipsPage)
},
 
{
  path: 'student-fees',
  loadComponent: () =>
    import('./features/student-fees/pages/student-fees-page/student-fees-page')
      .then(m => m.StudentFeesPage),
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
  loadComponent: () =>
    import('./features/budgets/pages/budgets-page').then(m => m.BudgetsPage),
  canActivate: [budgetsGuard]
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
  {
    path: 'admin/products',
    loadComponent: () =>
      import('./features/shop/pages/admin-products/admin-products')
        .then(m => m.AdminProducts),
    canActivate: [roleGuard(['admin'])]
  },
{
  path: 'admin/users',
  loadComponent: () =>
    import('./features/admin/user-management/user-management')
      .then(m => m.UserManagement),
  canActivate: [roleGuard(['admin'])]
},


  { path: '**', redirectTo: '' },
];