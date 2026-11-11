
import { Component } from '@angular/core';
import { Product } from '../../../../models/product.model';
import { ProductCard } from '../../components/product-card/product-card';

@Component({
  selector: 'app-shop',
  imports: [ProductCard],
  templateUrl: './shop.html',
  styleUrl: './shop.css',
})
export class Shop {
  products: Product[] = [
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
  ];
}
