
import { Component, computed, inject } from '@angular/core';
import { Cart } from '../../services/cart';
import { ProductService } from '../../services/product';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.css',
})
export class CartPage {
  readonly cart = inject(Cart);
  private readonly productService = inject(ProductService);

  readonly cartRows = computed(() => {
    const products = this.productService.products();

    return this.cart.items().flatMap(item => {
      const product = products.find(
        p => p.id === item.productId
      );

      if (!product) {
        return [];
      }

      return [{
        product,
        quantity: item.quantity,
        lineTotal: product.price * item.quantity
      }];
    });
  });

  increase(productId: number, quantity: number): void {
    this.cart.updateQuantity(productId, quantity + 1);
  }

  decrease(productId: number, quantity: number): void {
    if (quantity > 1) {
      this.cart.updateQuantity(productId, quantity - 1);
    }
  }

  remove(productId: number): void {
    this.cart.removeItem(productId);
  }
}
