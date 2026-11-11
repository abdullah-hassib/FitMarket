
import { Injectable, signal } from '@angular/core';
import { Product } from '../../../models/product.model';

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
      stock: 10
    },
    {
      id: 2,
      name: 'Gym Training Shirt',
      category: 'Sportswear',
      price: 650,
      stock: 20
    },
    {
      id: 3,
      name: 'Whey Protein',
      category: 'Supplements',
      price: 2200,
      stock: 5
    },
    {
      id: 4,
      name: 'Strength Training Plan',
      category: 'Training Plans',
      price: 900,
      stock: 0
    }
  ]);

  readonly products = this._products.asReadonly();

}
