import { calculateDiscount } from '../utils/pricing';
import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { ProductService } from './product';
import { CartItem } from '../models/cart-item.model';
import { loadStoredArray, saveStoredArray } from '../utils/storage';

@Injectable({
  providedIn: 'root'
})
export class Cart {

  private readonly productService = inject(ProductService);

  // Private writable cart state
  private readonly _items = signal<CartItem[]>([]);

  // Public read-only cart state
  readonly items = this._items.asReadonly();


constructor() {
  const saved = loadStoredArray<CartItem>(
    this.storageKey,
    value => this.isStoredCartItem(value)
  );

  if (saved !== null) {
    const seen = new Set<number>();

    const validItems = saved.filter(item => {
      const product = this.productService.getProductById(
        item.productId
      );

      if (
        !product ||
        item.quantity > product.stock ||
        seen.has(item.productId)
      ) {
        return false;
      }

      seen.add(item.productId);
      return true;
    });

    this._items.set(validItems);
  }

  effect(() => {
    saveStoredArray(this.storageKey, this._items());
  });
}


  addItem(productId: number, quantity: number = 1): boolean {

    // Find the product
    const product = this.productService.getProductById(productId);

    // Reject invalid products or quantities
    if (!product || !Number.isInteger(quantity) || quantity <= 0) {
      return false;
    }

    // Check whether the product already exists in the cart
    const existingItem = this._items().find(
      item => item.productId === productId
    );

    const currentQuantity = existingItem?.quantity ?? 0;

    // Prevent exceeding available stock
    if (currentQuantity + quantity > product.stock) {
      return false;
    }

    if (existingItem) {
      // Increase quantity of an existing cart item
      this._items.update(items =>
        items.map(item =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      // Add a new product to the cart
      this._items.update(items => [
        ...items,
        { productId, quantity }
      ]);
    }

    return true;
  }

  // Remove a product completely from the cart
  removeItem(productId: number): void {
    this._items.update(items =>
      items.filter(item => item.productId !== productId)
    );
  }

  // Set a product's quantity with stock validation
  updateQuantity(productId: number, quantity: number): boolean {
    const product = this.productService.getProductById(productId);

    if (!product || !Number.isInteger(quantity) || quantity < 1) {
      return false;
    }

    const existingItem = this._items().find(
      item => item.productId === productId
    );

    if (!existingItem || quantity > product.stock) {
      return false;
    }

    this._items.update(items =>
      items.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    );

    return true;
  }

  // Empty the shopping cart
  clearCart(): void {
    this._items.set([]);
  }

  // Total number of units across all cart items
  readonly itemCount = computed(() =>
    this.items().reduce(
      (sum, item) => sum + item.quantity,
      0
    )
  );

  // Calculate total using current product prices
  readonly subtotal = computed(() =>
    this.items().reduce((sum, item) => {
      const product = this.productService.getProductById(item.productId);

      return sum + (product?.price ?? 0) * item.quantity;
    }, 0)
  );

readonly discountTotal = computed(() =>
  this.items().reduce((sum, item) => {
    const product = this.productService.getProductById(
      item.productId
    );

    if (!product) {
      return sum;
    }

    return sum + calculateDiscount(product, item.quantity);
  }, 0)
);

readonly total = computed(() =>
  Math.max(0, this.subtotal() - this.discountTotal())
);
private readonly storageKey = 'fitmarket.shop.cart.v1';

private isStoredCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item['productId'] === 'number' &&
    Number.isInteger(item['productId']) &&
    item['productId'] > 0 &&
    typeof item['quantity'] === 'number' &&
    Number.isInteger(item['quantity']) &&
    item['quantity'] > 0
  );
}


}
