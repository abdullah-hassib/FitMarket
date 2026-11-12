
import { Injectable, signal, computed, effect } from '@angular/core';
import { Product } from '../../../models/product.model';
import { loadStoredArray, saveStoredArray } from '../utils/storage';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

 
private readonly _products = signal<Product[]>([
  {
    id: 1,
    name: 'Adjustable Dumbbell',
    category: 'Equipment',
    price: 2500,
    stock: 10,
    imageUrl: '/images/products/dumbbells.jpg',
    description: 'Versatile adjustable dumbbell designed for effective strength training and muscle development. Featuring a comfortable grip and adjustable weight settings, it is ideal for home and gym workouts.'
  },
  {
    id: 2,
    name: 'Gym Training Shirt',
    category: 'Sportswear',
    price: 650,
    stock: 20,
    imageUrl: '/images/products/training-shirt.webp',
    description: 'Comfortable and lightweight training shirt made with breathable, moisture-wicking fabric to keep you cool and dry during workouts.'
  },
  {
    id: 3,
    name: 'Whey Protein',
    category: 'Supplements',
    price: 2200,
    stock: 5,
    imageUrl: '/images/products/whey-protein.jpg',
    description: 'High-quality whey protein supplement designed to support muscle recovery, muscle growth, and daily protein intake.'
  },
  {
    id: 4,
    name: 'Strength Training Plan',
    category: 'Training Plans',
    price: 900,
    stock: 0,
    description: 'A structured strength training program designed to help improve performance, build muscle, and develop consistent workout habits.'
  }
]);



  readonly products = this._products.asReadonly();

  getProductById(id: number): Product | undefined {
  return this.products().find(product => product.id === id);
}

purchaseStock(
  items: { productId: number; quantity: number }[]
): boolean {
  if (items.length === 0) {
    return false;
  }

  const products = this._products();

  // Validate every item before updating anything
  const valid = items.every(item => {
    const product = products.find(
      p => p.id === item.productId
    );

    return product !== undefined &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0 &&
      item.quantity <= product.stock;
  });

  if (!valid) {
    return false;
  }

  // Calculate all stock changes together
  const quantities = new Map<number, number>();

  for (const item of items) {
    quantities.set(
      item.productId,
      (quantities.get(item.productId) ?? 0) + item.quantity
    );
  }

  // Recheck combined quantities, just in case
  for (const [id, quantity] of quantities) {
    const product = products.find(p => p.id === id);

    if (!product || quantity > product.stock) {
      return false;
    }
  }

  this._products.update(products =>
    products.map(product => ({
      ...product,
      stock: product.stock -
        (quantities.get(product.id) ?? 0)
    }))
  );

  return true;
}


  // Add a new product
  addProduct(product: Product): boolean {
    if (!this.isValidProduct(product)) {
      return false;
    }

    if (this.getProductById(product.id)) {
      return false;
    }

    this._products.update(products => [
      ...products,
      { ...product }
    ]);

    return true;
  }

  // Update an existing product
  updateProduct(product: Product): boolean {
    if (!this.isValidProduct(product)) {
      return false;
    }

    if (!this.getProductById(product.id)) {
      return false;
    }

    this._products.update(products =>
      products.map(existing =>
        existing.id === product.id
          ? { ...product }
          : existing
      )
    );

    return true;
  }

  // Delete a product
  deleteProduct(id: number): boolean {
    if (!this.getProductById(id)) {
      return false;
    }

    this._products.update(products =>
      products.filter(product => product.id !== id)
    );

    return true;
  }

  // Identify products running low on stock
  readonly lowStockProducts = computed(() =>
    this._products().filter(
      product => product.stock <= 5
    )
  );

  // Shared validation for adding and editing products
  private isValidProduct(product: Product): boolean {
  const discount = product.discountPercent ?? 0;

  return (
    Number.isInteger(product.id) &&
    product.id > 0 &&
    product.name.trim().length > 0 &&
    product.category.trim().length > 0 &&
    Number.isFinite(product.price) &&
    product.price >= 0 &&
    Number.isInteger(product.stock) &&
    product.stock >= 0 &&
    Number.isFinite(discount) &&
    discount >= 0 &&
    discount <= 100
  );
}
private readonly storageKey = 'fitmarket.shop.products.v1';

private isStoredProduct(value: unknown): value is Product {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const p = value as Record<string, unknown>;

  return (
    typeof p['id'] === 'number' &&
    Number.isInteger(p['id']) &&
    p['id'] > 0 &&
    typeof p['name'] === 'string' &&
    p['name'].trim().length > 0 &&
    typeof p['category'] === 'string' &&
    p['category'].trim().length > 0 &&
    typeof p['price'] === 'number' &&
    Number.isFinite(p['price']) &&
    p['price'] >= 0 &&
    typeof p['stock'] === 'number' &&
    Number.isInteger(p['stock']) &&
    p['stock'] >= 0 &&
    (p['discountPercent'] === undefined ||
      (typeof p['discountPercent'] === 'number' &&
        Number.isFinite(p['discountPercent']) &&
        p['discountPercent'] >= 0 &&
        p['discountPercent'] <= 100)) &&
    (p['description'] === undefined ||
      typeof p['description'] === 'string') &&
    (p['imageUrl'] === undefined ||
      typeof p['imageUrl'] === 'string')
  );
}

constructor() {
  const saved = loadStoredArray<Product>(
    this.storageKey,
    value => this.isStoredProduct(value)
  );

  if (saved !== null) {
    this._products.set(saved);
  }

  effect(() => {
    saveStoredArray(this.storageKey, this._products());
  });
}



}
