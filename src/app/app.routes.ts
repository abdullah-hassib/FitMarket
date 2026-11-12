import { Routes } from '@angular/router';
import { ComingSoon } from './shared/components/coming-soon/coming-soon';

export const routes: Routes = [
  { path: '', component: ComingSoon },
  
{
  path: 'shop',
  loadChildren: () =>
    import('./features/shop/shop.routes')
      .then(m => m.SHOP_ROUTES)
},

  { path: 'memberships', component: ComingSoon },
  { path: 'student-fees', component: ComingSoon },
  { path: 'payroll', component: ComingSoon },
  { path: 'budgets', component: ComingSoon },
  { path: 'login', component: ComingSoon },
  { path: 'signup', component: ComingSoon },
  { path: 'profile', component: ComingSoon },
  
{
  path: 'admin/products',
  loadComponent: () =>
    import('./features/shop/pages/admin-products/admin-products')
      .then(m => m.AdminProducts)
  // Add the team's admin authorization guard here.
},


  { path: '**', redirectTo: '' }
];