
import { TestBed } from '@angular/core/testing';
import { Sales } from './sales';
import { Cart } from './cart';
import { ProductService } from './product';

describe('Sales', () => {
  let sales: Sales;
  let cart: Cart;
  let products: ProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    sales = TestBed.inject(Sales);
    cart = TestBed.inject(Cart);
    products = TestBed.inject(ProductService);
  });

  it('should reject an empty cart', () => {
    expect(sales.completeSale()).toBeNull();
    expect(sales.sales().length).toBe(0);
  });

  it('should create a completed sale', () => {
    cart.addItem(1, 2);

    const sale = sales.completeSale();

    expect(sale).not.toBeNull();
    expect(sale?.subtotal).toBe(5000);
    expect(sale?.total).toBe(5000);
    expect(sale?.items[0].unitPrice).toBe(2500);
    expect(sales.sales().length).toBe(1);
  });

  it('should reduce stock after checkout', () => {
    cart.addItem(1, 2);
    sales.completeSale();

    expect(products.getProductById(1)?.stock).toBe(8);
  });

  it('should clear cart after checkout', () => {
    cart.addItem(1, 2);
    sales.completeSale();

    expect(cart.items()).toEqual([]);
  });

  it('should not create a second sale from an empty cart', () => {
    cart.addItem(1, 1);

    expect(sales.completeSale()).not.toBeNull();
    expect(sales.completeSale()).toBeNull();
    expect(sales.sales().length).toBe(1);
  });

  it('should generate different IDs for completed sales', () => {
    cart.addItem(1, 1);
    const first = sales.completeSale();

    cart.addItem(2, 1);
    const second = sales.completeSale();

    expect(first?.id).not.toBe(second?.id);
  });


it('should record discounted sale totals', () => {
  products.updateProduct({
    ...products.getProductById(1)!,
    discountPercent: 10
  });

  cart.addItem(1, 2);

  const sale = sales.completeSale();

  expect(sale?.subtotal).toBe(5000);
  expect(sale?.discountAmount).toBe(500);
  expect(sale?.total).toBe(4500);
});

});
