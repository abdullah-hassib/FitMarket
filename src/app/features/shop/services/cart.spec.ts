
import { TestBed } from '@angular/core/testing';
import { Cart } from './cart';
import { ProductService } from './product';

describe('Cart', () => {
  let service: Cart;

  beforeEach(() => {
    // Karma runs suites in one real browser: isolate persisted demo cart state.
    localStorage.removeItem('fitmarket.shop.cart.v1');
    localStorage.removeItem('fitmarket.shop.products.v1');
    TestBed.configureTestingModule({});
    service = TestBed.inject(Cart);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initially have an empty cart', () => {
    expect(service.items()).toEqual([]);
  });

  it('should add a product to the cart', () => {
    const success = service.addItem(1, 2);

    expect(success).toBe(true);
    expect(service.items()).toEqual([
      { productId: 1, quantity: 2 }
    ]);
  });

  it('should combine quantities for the same product', () => {
    service.addItem(1, 2);
    service.addItem(1, 3);

    expect(service.items()[0].quantity).toBe(5);
  });

  it('should not allow quantity to exceed stock', () => {
    const success = service.addItem(1, 11);

    expect(success).toBe(false);
    expect(service.items()).toEqual([]);
  });

  it('should reject products that do not exist', () => {
    const success = service.addItem(999);

    expect(success).toBe(false);
  });


it('should remove a product from the cart', () => {
  service.addItem(1, 2);
  service.removeItem(1);

  expect(service.items()).toEqual([]);
});

it('should update a product quantity', () => {
  service.addItem(1, 2);

  const success = service.updateQuantity(1, 5);

  expect(success).toBe(true);
  expect(service.items()[0].quantity).toBe(5);
});

it('should reject quantities exceeding stock', () => {
  service.addItem(1, 2);

  const success = service.updateQuantity(1, 11);

  expect(success).toBe(false);
  expect(service.items()[0].quantity).toBe(2);
});

it('should calculate the cart subtotal', () => {
  service.addItem(1, 2);
  service.addItem(2, 1);

  expect(service.subtotal()).toBe(5650);
});

it('should clear the cart', () => {
  service.addItem(1, 2);
  service.clearCart();

  expect(service.items()).toEqual([]);
  expect(service.itemCount()).toBe(0);
  expect(service.subtotal()).toBe(0);
});


it('should calculate product discounts', () => {
  const products = TestBed.inject(ProductService);

  products.updateProduct({
    ...products.getProductById(1)!,
    discountPercent: 10
  });

  service.addItem(1, 2);

  expect(service.subtotal()).toBe(5000);
  expect(service.discountTotal()).toBe(500);
  expect(service.total()).toBe(4500);
});

it('should react to admin discount changes', () => {
  const products = TestBed.inject(ProductService);

  service.addItem(1, 2);

  products.updateProduct({
    ...products.getProductById(1)!,
    discountPercent: 20
  });

  expect(service.total()).toBe(4000);
});

});
