
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ProductService } from '../../services/product';
import { Product } from '../../../../models/product.model';

@Component({
  selector: 'app-admin-products',
  imports: [FormsModule],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.css',
})
export class AdminProducts {
  readonly productService = inject(ProductService);

  readonly editingId = signal<number | null>(null);
  readonly message = signal('');

  formProduct: Product = this.emptyProduct();

  private emptyProduct(): Product {
    return {
      id: 0,
      name: '',
      category: 'Equipment',
      price: 0,
      stock: 0,
      description: '',
      discountPercent: 0
    };
  }

  editProduct(product: Product): void {
    this.editingId.set(product.id);
    this.formProduct = { ...product };
    this.message.set('');
  }

  resetForm(): void {
    this.editingId.set(null);
    this.formProduct = this.emptyProduct();
    this.message.set('');
  }

  saveProduct(): void {
    const isEditing = this.editingId() !== null;

    if (!isEditing) {
      const ids = this.productService.products().map(p => p.id);
      this.formProduct.id = Math.max(0, ...ids) + 1;
    }

    const success = isEditing
      ? this.productService.updateProduct(this.formProduct)
      : this.productService.addProduct(this.formProduct);

    if (success) {
      this.resetForm();
      this.message.set(
        isEditing ? 'Product updated successfully.' : 'Product added successfully.'
      );
    } else {
      this.message.set('Unable to save product. Check the entered values.');
    }
  }

  deleteProduct(id: number): void {
    const confirmed = window.confirm(
      'Are you sure you want to delete this product?'
    );

    if (!confirmed) return;

    const success = this.productService.deleteProduct(id);

    this.message.set(
      success ? 'Product deleted successfully.' : 'Unable to delete product.'
    );
  }
}
