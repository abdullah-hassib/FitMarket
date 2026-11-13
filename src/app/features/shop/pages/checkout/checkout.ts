
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Cart } from '../../services/cart';
import { Sales } from '../../services/sales';

@Component({
  selector: 'app-checkout',
  imports: [],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  readonly cart = inject(Cart);

  private readonly sales = inject(Sales);
  private readonly router = inject(Router);

  readonly errorMessage = signal('');

  placeOrder(): void {
    this.errorMessage.set('');

    const sale = this.sales.completeSale();

    if (!sale) {
      this.errorMessage.set(
        'Unable to complete checkout. Check your cart and stock availability.'
      );
      return;
    }

    this.router.navigate(['/shop/order', sale.id]);
  }
}
