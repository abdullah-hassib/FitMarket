
import { Product } from '../../../models/product.model';

export function calculateDiscount(
  product: Product,
  quantity: number
): number {
  const discount = product.discountPercent ?? 0;

  return product.price * quantity * (discount / 100);
}

export function calculateFinalPrice(
  product: Product,
  quantity: number
): number {
  const subtotal = product.price * quantity;

  return subtotal - calculateDiscount(product, quantity);
}
