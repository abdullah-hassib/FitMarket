
import { Component, inject, signal, computed } from '@angular/core';
import { ProductCard } from '../../components/product-card/product-card';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-shop',
  imports: [ProductCard],
  templateUrl: './shop.html',
  styleUrl: './shop.css',
})
export class Shop {

  // Get products from the shared ProductService
  private readonly productService = inject(ProductService);

  readonly products = this.productService.products;

  // Signals for searching, filtering, and sorting
  readonly searchQuery = signal('');
  readonly selectedCategory = signal('All');
  readonly sortOrder = signal('default');

  // Automatically update the displayed products
  readonly filteredProducts = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();
    const sort = this.sortOrder();

    // Step 1: Filter products
    const result = this.products().filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(query);

      const matchesCategory =
        category === 'All' ||
        product.category === category;

      return matchesSearch && matchesCategory;
    });

    // Step 2: Sort filtered products
    if (sort === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  });

  // Handle search input
  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  // Handle category selection
  onCategoryChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedCategory.set(select.value);
  }

  // Handle sorting selection
  onSortChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sortOrder.set(select.value);
  }
}
