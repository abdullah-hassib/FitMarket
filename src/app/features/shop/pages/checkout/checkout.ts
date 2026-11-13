import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Auth } from '../../../../core/auth/auth';
import { Cart } from '../../services/cart';
import { DemoPayment, TEST_CARDS } from '../../services/demo-payment';
import { Sales } from '../../services/sales';
import { Feedback } from '../../../../shared/services/feedback';
import { Sound } from '../../../../shared/services/sound';

@Component({
  selector: 'app-checkout',
  imports: [FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  readonly cart = inject(Cart);
  readonly sound = inject(Sound);

  private readonly auth = inject(Auth);
  private readonly payment = inject(DemoPayment);
  private readonly sales = inject(Sales);
  private readonly feedback = inject(Feedback);
  private readonly router = inject(Router);

  readonly testCards = TEST_CARDS;
  readonly errorMessage = signal('');
  readonly processing = signal(false);

  cardholder = this.auth.currentUser()?.name ?? '';
  cardNumber = this.auth.currentUser()?.demoCard === 'test-mastercard'
    ? TEST_CARDS[1].number
    : TEST_CARDS[0].number;
  expiry = '12/30';
  cvv = '';

  selectTestCard(number: string): void {
    if (this.processing()) return;
    this.cardNumber = number;
    this.cvv = '';
    this.errorMessage.set('');
  }

  async placeOrder(): Promise<void> {
    if (this.processing()) return;
    this.errorMessage.set('');

    // Only temporary form values are sent to the demo validator.
    const result = this.payment.authorize({
      cardholder: this.cardholder,
      cardNumber: this.cardNumber,
      expiry: this.expiry,
      cvv: this.cvv
    });
    this.cvv = ''; // Never keep the CVV after an attempt.
    if (!result.ok) {
      this.errorMessage.set(result.message);
      return;
    }

    this.processing.set(true);
    this.sound.unlock(); // Audio can only start after a user interaction.
    try {
      // Short delay makes the demo processing state visible.
      await new Promise<void>(resolve => setTimeout(resolve, 650));

      // Sales re-checks the logged-in user, entire cart and current stock.
      const sale = this.sales.completeSale(result.receipt);
      if (!sale) {
        this.errorMessage.set('Unable to place the order. Please review your cart and stock availability.');
        return;
      }

      this.feedback.show('success', 'Demo payment approved. Your order is confirmed!');
      this.sound.playSuccess();
      await this.router.navigate(['/shop/order', sale.id]);
    } finally {
      this.processing.set(false);
    }
  }
}
