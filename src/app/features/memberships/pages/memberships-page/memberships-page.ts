import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Auth } from '../../../../core/auth/auth';
import { MembershipService } from '../../services/membership.service';
import { StudentFeesService } from '../../../student-fees/services/student-fees.service';
import { DemoPayment, TEST_CARDS } from '../../../shop/services/demo-payment';
import { Feedback } from '../../../../shared/services/feedback';
import { Sound } from '../../../../shared/services/sound';

@Component({
  selector: 'app-memberships-page',
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './memberships-page.html',
  styleUrls: ['./memberships-page.css', '../../../shop/pages/checkout/checkout.css']
})
export class MembershipsPage {
  readonly auth = inject(Auth);
  readonly memberships = inject(MembershipService);
  private readonly fees = inject(StudentFeesService);
  private readonly payment = inject(DemoPayment);
  private readonly feedback = inject(Feedback);
  private readonly sound = inject(Sound);

  readonly message = signal('');
  readonly paymentError = signal('');
  readonly processing = signal(false);
  readonly selectedPlanId = signal<string | null>(null);
  readonly selectedPlan = computed(() => this.memberships.getPlan(this.selectedPlanId() ?? '') ?? null);
  readonly testCards = TEST_CARDS;

  cardholder = this.auth.currentUser()?.name ?? '';
  cardNumber = this.auth.currentUser()?.demoCard === 'test-mastercard'
    ? TEST_CARDS[1].number
    : TEST_CARDS[0].number;
  expiry = '12/30';
  cvv = '';

  readonly userSubscriptions = computed(() => {
    const user = this.auth.currentUser();
    return user ? this.memberships.getUserSubscriptions(user.id) : [];
  });

  readonly canSubscribe = computed(() => {
    const user = this.auth.currentUser();
    return !!user && user.role === 'trainee' &&
      !this.userSubscriptions().some(sub => sub.status === 'pending' || sub.status === 'active');
  });

  selectPlan(planId: string): void {
    if (!this.canSubscribe() || !this.memberships.getPlan(planId) || this.processing()) {
      this.message.set('You cannot subscribe right now.');
      return;
    }
    this.selectedPlanId.set(planId);
    this.cardholder = this.auth.currentUser()?.name ?? '';
    this.cvv = '';
    this.paymentError.set('');
    this.message.set('');
  }

  selectTestCard(number: string): void {
    if (this.processing()) return;
    this.cardNumber = number;
    this.cvv = '';
    this.paymentError.set('');
  }

  async confirmSubscription(): Promise<void> {
    const user = this.auth.currentUser();
    const plan = this.selectedPlan();
    if (this.processing() || !user || !plan || !this.canSubscribe()) return;

    this.paymentError.set('');
    const result = this.payment.authorize({
      cardholder: this.cardholder,
      cardNumber: this.cardNumber,
      expiry: this.expiry,
      cvv: this.cvv
    });
    this.cvv = '';
    this.sound.unlock();
    if (!result.ok) {
      this.paymentError.set(result.message);
      this.feedback.show('error', result.message);
      this.sound.playError();
      return;
    }

    this.processing.set(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 650));
      const subscription = this.memberships.requestSubscription(user.id, plan.id);
      if (!subscription) {
        this.paymentError.set('Unable to create your membership. Please try again.');
        this.sound.playError();
        return;
      }

      const invoice = this.fees.createInvoiceForSubscription(subscription.id);
      if (!invoice || !this.fees.payInvoice(invoice.id)) {
        this.paymentError.set('Your membership is pending. Open Student Fees to complete the demo payment.');
        this.feedback.show('error', this.paymentError());
        this.sound.playError();
        return;
      }

      this.selectedPlanId.set(null);
      this.message.set('Demo payment approved! Your membership is now active.');
      this.feedback.show('success', this.message());
      this.sound.playSuccess();
    } finally {
      this.processing.set(false);
    }
  }

  cancelSubscription(subscriptionId: string): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const success = this.memberships.cancelSubscription(user.id, subscriptionId);
    this.message.set(success
      ? 'Membership cancelled. This demo cancellation does not issue a refund.'
      : 'Cancellation is only available within seven days of membership activation.');
    this.feedback.show(success ? 'success' : 'error', this.message());
    if (success) this.sound.playSuccess();
    else this.sound.playError();
  }
}
