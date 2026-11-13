
import { Component, inject, computed, signal, OnDestroy } from '@angular/core';
import { Feedback } from '../../../../shared/services/feedback';
import { Sound } from '../../../../shared/services/sound';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { ProductService } from '../../services/product';
import { Cart } from '../../services/cart';
import { calculateFinalPrice } from '../../utils/pricing';

@Component({
  selector: 'app-product-details',
  imports: [RouterLink],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnDestroy {
  private readonly feedback = inject(Feedback);
  private readonly sound = inject(Sound);
  private addedTimer?: ReturnType<typeof setTimeout>;
  readonly added = signal(false);

  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);

  // Read the product ID from the URL
  private readonly productId = toSignal(
    this.route.paramMap.pipe(
      map(params => Number(params.get('id')))
    )
  );

  // Find the product using its ID
  readonly product = computed(() => {
    const id = this.productId();

    if (!id || !Number.isInteger(id)) {
      return undefined;
    }

    return this.productService.getProductById(id);
  });
  readonly discountedPrice = computed(() => {
  const product = this.product();

  return product ? calculateFinalPrice(product, 1) : 0;
});

  // ===== ADD THE NEW CODE BELOW THIS LINE =====

  // Current selected quantity
  readonly quantity = signal(1);

  // Check if quantity can increase
  readonly canIncrease = computed(() => {
    const product = this.product();

    return product !== undefined &&
      this.quantity() < product.stock;
  });

  // Increase quantity without exceeding stock
  increaseQuantity(): void {
    if (this.canIncrease()) {
      this.quantity.update(q => q + 1);
    }
  }

  // Decrease quantity without going below 1
  decreaseQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }
  private readonly cart = inject(Cart);

readonly cartMessage = signal('');

addToCart(): void {
  const product = this.product();

  if (!product) {
    this.cartMessage.set('Product not found.');
    return;
  }

  const success = this.cart.addItem(
    product.id,
    this.quantity()
  );

  this.cartMessage.set(success
    ? 'Product added to cart!'
    : 'Unable to add product. Check available stock.'
  );
  if (!success) {
    this.feedback.show('error', 'Unable to add product. Check available stock.');
    return;
  }

  this.feedback.show('success', `${product.name} added to your cart!`);
  this.sound.playAdded();
  this.added.set(true);
  if (this.addedTimer) clearTimeout(this.addedTimer);
  this.addedTimer = setTimeout(() => this.added.set(false), 1400);
}

  ngOnDestroy(): void {
    if (this.addedTimer) clearTimeout(this.addedTimer);
  }
}
