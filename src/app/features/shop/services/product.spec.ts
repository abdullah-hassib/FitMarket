
import { TestBed } from '@angular/core/testing';
import { ProductService } from './product';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initially contain four products', () => {
    expect(service.products().length).toBe(4);
  });

  it('should contain the Adjustable Dumbbell', () => {
    const product = service.products().find(
      p => p.id === 1
    );

    expect(product?.name).toBe('Adjustable Dumbbell');
  });


it('should add a valid product', () => {
  const success = service.addProduct({
    id: 10,
    name: 'Yoga Mat',
    category: 'Equipment',
    price: 400,
    stock: 15
  });

  expect(success).toBe(true);
  expect(service.getProductById(10)?.name).toBe('Yoga Mat');
});

it('should reject duplicate product IDs', () => {
  const success = service.addProduct({
    id: 1,
    name: 'Duplicate',
    category: 'Equipment',
    price: 100,
    stock: 5
  });

  expect(success).toBe(false);
});

it('should update an existing product', () => {
  const success = service.updateProduct({
    id: 1,
    name: 'Updated Dumbbell',
    category: 'Equipment',
    price: 3000,
    stock: 8
  });

  expect(success).toBe(true);
  expect(service.getProductById(1)?.price).toBe(3000);
});

it('should delete a product', () => {
  const success = service.deleteProduct(1);

  expect(success).toBe(true);
  expect(service.getProductById(1)).toBeUndefined();
});

it('should identify low-stock products', () => {
  const lowStock = service.lowStockProducts();

  expect(lowStock.some(p => p.id === 3)).toBe(true);
  expect(lowStock.some(p => p.id === 4)).toBe(true);
});

});
