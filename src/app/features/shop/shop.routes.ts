
import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const SHOP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/shop/shop').then(m => m.Shop)
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./pages/cart-page/cart-page').then(m => m.CartPage)
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/checkout/checkout').then(m => m.Checkout)
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/order-history/order-history').then(m => m.OrderHistory)
  },
  {
    path: 'order/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/order-confirmation/order-confirmation')
        .then(m => m.OrderConfirmation)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/product-details/product-details')
        .then(m => m.ProductDetails)
  }
];
