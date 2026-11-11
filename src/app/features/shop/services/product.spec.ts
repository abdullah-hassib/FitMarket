
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
});
