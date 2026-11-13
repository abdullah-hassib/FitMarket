
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../../../models/product.model';
import { calculateFinalPrice } from '../../utils/pricing';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css'
})
export class ProductCard {
  product = input.required<Product>();

  getDiscountedPrice(): number {
  return calculateFinalPrice(this.product(), 1);
}
}
