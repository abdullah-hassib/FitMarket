import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminProducts } from './admin-products';

describe('AdminProducts', () => {
  let component: AdminProducts;
  let fixture: ComponentFixture<AdminProducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProducts],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProducts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


it('should add a product through the admin component', () => {
  component.formProduct = {
    id: 0,
    name: 'Yoga Mat',
    category: 'Equipment',
    price: 450,
    stock: 20,
    discountPercent: 10
  };

  component.saveProduct();

  const added = component.productService.products()
    .find(p => p.name === 'Yoga Mat');

  expect(added).toBeDefined();
  expect(added?.price).toBe(450);
});

it('should edit an existing product', () => {
  const product = component.productService.getProductById(1)!;

  component.editProduct(product);
  component.formProduct.price = 3000;
  component.saveProduct();

  expect(
    component.productService.getProductById(1)?.price
  ).toBe(3000);
});

it('should reject invalid product data', () => {
  component.formProduct = {
    id: 0,
    name: '',
    category: 'Equipment',
    price: -100,
    stock: 10,
    discountPercent: 150
  };

  component.saveProduct();

  expect(component.productService.products().length).toBe(4);
  expect(component.message()).toContain('Unable to save');
});

it('should identify low-stock products', () => {
  const lowStock = component.productService.lowStockProducts();

  expect(lowStock.some(p => p.id === 3)).toBe(true);
  expect(lowStock.some(p => p.id === 4)).toBe(true);
});

it('should copy product data before editing', () => {
  const original = component.productService.getProductById(1)!;

  component.editProduct(original);
  component.formProduct.name = 'Changed Name';

  expect(
    component.productService.getProductById(1)?.name
  ).toBe('Adjustable Dumbbell');
});

});
