import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sales } from '../../services/sales';

@Component({
  selector: 'app-order-history',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './order-history.html',
  styleUrl: './order-history.css'
})
export class OrderHistory {
  private readonly sales = inject(Sales);
  readonly orders = computed(() => this.sales.getMyOrders());
  readonly totalSpent = computed(() =>
    this.orders().reduce((sum, order) => sum + Math.round(order.total * 100), 0) / 100
  );
}
