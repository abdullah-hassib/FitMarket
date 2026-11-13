
import { Routes } from '@angular/router';

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
    loadComponent: () =>
      import('./pages/checkout/checkout').then(m => m.Checkout)
  },
  {
    path: 'order/:id',
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
