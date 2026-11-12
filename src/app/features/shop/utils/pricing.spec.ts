
import { calculateDiscount, calculateFinalPrice } from './pricing';
import { Product } from '../../../models/product.model';

describe('Pricing utilities', () => {
  const product: Product = {
    id: 1,
    name: 'Dumbbell',
    category: 'Equipment',
    price: 2500,
    stock: 10,
    discountPercent: 10
  };

  it('should calculate the discount', () => {
    expect(calculateDiscount(product, 2)).toBe(500);
  });

  it('should calculate the discounted total', () => {
    expect(calculateFinalPrice(product, 2)).toBe(4500);
  });

  it('should treat missing discounts as zero', () => {
    const noDiscount = {
      ...product,
      discountPercent: undefined
    };

    expect(calculateFinalPrice(noDiscount, 2)).toBe(5000);
  });
});
