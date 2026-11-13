
import { Injectable, inject, signal, effect } from '@angular/core';
import { loadStoredArray, saveStoredArray } from '../utils/storage';
import { SaleRecord, SaleItem } from '../../../models/sale.model';
import { ProductService } from './product';
import { Cart } from './cart';
import { Auth } from '../../../core/auth/auth';

@Injectable({
  providedIn: 'root'
})
export class Sales {

  private readonly productService = inject(ProductService);
  private readonly cart = inject(Cart);
  private readonly auth = inject(Auth);

  private readonly _sales = signal<SaleRecord[]>([]);

  readonly sales = this._sales.asReadonly();


private readonly storageKey = 'fitmarket.shop.sales.v1';

private isStoredSale(value: unknown): value is SaleRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const sale = value as Record<string, unknown>;

  if (
    typeof sale['id'] !== 'number' ||
    !Number.isInteger(sale['id']) ||
    sale['id'] <= 0 ||
    typeof sale['date'] !== 'string' ||
    !Number.isFinite(Date.parse(sale['date'])) ||
    !Array.isArray(sale['items']) ||
    sale['items'].length === 0
  ) {
    return false;
  }

  const validItems = sale['items'].every((value: unknown) => {
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
      item['quantity'] > 0 &&
      typeof item['unitPrice'] === 'number' &&
      Number.isFinite(item['unitPrice']) &&
      item['unitPrice'] >= 0 &&
      (item['productName'] === undefined || typeof item['productName'] === 'string')
    );
  });

  const subtotal = sale['subtotal'];
  const discount = sale['discountAmount'];
  const total = sale['total'];

  return (
    validItems &&
    typeof subtotal === 'number' &&
    Number.isFinite(subtotal) &&
    subtotal >= 0 &&
    typeof discount === 'number' &&
    Number.isFinite(discount) &&
    discount >= 0 &&
    discount <= subtotal &&
    typeof total === 'number' &&
    Number.isFinite(total) &&
    total >= 0 &&
    Math.abs(total - (subtotal - discount)) < 0.01 &&
    (sale['staffId'] === undefined ||
      (typeof sale['staffId'] === 'number' &&
        Number.isInteger(sale['staffId']) &&
        sale['staffId'] > 0)) &&
    (sale['customerId'] === undefined ||
      (typeof sale['customerId'] === 'number' && Number.isSafeInteger(sale['customerId']) && sale['customerId'] > 0))
  );
}

constructor() {
  const saved = loadStoredArray<SaleRecord>(
    this.storageKey,
    value => this.isStoredSale(value)
  );

  if (saved !== null) {
    this._sales.set(saved);
  }

  effect(() => {
    saveStoredArray(this.storageKey, this._sales());
  });
}


  completeSale(): SaleRecord | null {
    const customer = this.auth.currentUser();
    if (!customer) return null;

    const cartItems = this.cart.items();

    // Empty carts cannot be checked out
    if (cartItems.length === 0) {
      return null;
    }

    const saleItems: SaleItem[] = [];

    // Validate the cart and capture purchase-time prices
    for (const item of cartItems) {
      const product = this.productService.getProductById(
        item.productId
      );

      if (
        !product ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        item.quantity > product.stock
      ) {
        return null;
      }

      saleItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        productName: product.name
      });
    }

    // Calculate subtotal
    const subtotal = saleItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    // Discounts will be connected to admin settings later
    const discountAmount = this.cart.discountTotal();
    const total = Math.max(0, subtotal - discountAmount);

    // Update inventory only if every item is available
    const stockUpdated = this.productService.purchaseStock(
      saleItems
    );

    if (!stockUpdated) {
      return null;
    }

    // Generate a unique ID within the in-memory sales list
    const nextId = Math.max(
      0,
      ...this._sales().map(sale => sale.id)
    ) + 1;

    const sale: SaleRecord = {
      id: nextId,
      date: new Date().toISOString(),
      items: saleItems,
      subtotal,
      discountAmount,
      total,
      customerId: customer.id
    };

    // Save the completed sale
    this._sales.update(sales => [...sales, sale]);

    // Empty the cart only after successful checkout
    this.cart.clearCart();

    return sale;
  }

  /** Restrict receipts to the purchaser's demo account. */
  getSaleById(id: number): SaleRecord | undefined {
    const userId = this.auth.currentUser()?.id;
    return userId ? this.sales().find(sale => sale.id === id && sale.customerId === userId) : undefined;
  }

  getMyOrders(): SaleRecord[] {
    const userId = this.auth.currentUser()?.id;
    return userId ? this.sales()
      .filter(sale => sale.customerId === userId)
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id) : [];
  }
  
}
