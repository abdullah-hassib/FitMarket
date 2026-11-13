import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Auth } from '../../../../core/auth/auth';
import { MembershipService } from '../../services/membership.service';
import { StudentFeesService } from '../../../student-fees/services/student-fees.service';
import { RefundRecord } from '../../../student-fees/models/invoice.model';
import { DemoPayment, TEST_CARDS } from '../../../shop/services/demo-payment';
import { Feedback } from '../../../../shared/services/feedback';
import { Sound } from '../../../../shared/services/sound';

@Component({
  selector: 'app-memberships-page',
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './memberships-page.html',
  styleUrls: ['./memberships-page.css', '../../../shop/pages/checkout/checkout.css', './membership-checkout.css', '../../../shop/pages/order-confirmation/order-confirmation.css']
})
export class MembershipsPage {
  readonly auth = inject(Auth);
  readonly memberships = inject(MembershipService);
  private readonly fees = inject(StudentFeesService);
  private readonly payment = inject(DemoPayment);
  private readonly feedback = inject(Feedback);
  private readonly sound = inject(Sound);

  readonly message = signal('');
  readonly paymentSuccess = signal(false);
  readonly paymentError = signal('');
  readonly processing = signal(false);
  readonly selectedPlanId = signal<string | null>(null);
  readonly selectedPlan = computed(() => this.memberships.getPlan(this.selectedPlanId() ?? '') ?? null);
  readonly testCards = TEST_CARDS;

  cardholder = this.auth.currentUser()?.name ?? '';
  cardNumber: string = this.auth.currentUser()?.demoCard === 'test-mastercard'
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
    this.paymentSuccess.set(false);
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
      if (!invoice || !this.fees.payInvoice(invoice.id, result.receipt)) {
        this.paymentError.set('Your membership is pending. Open Student Fees to complete the demo payment.');
        this.feedback.show('error', this.paymentError());
        this.sound.playError();
        return;
      }

      this.selectedPlanId.set(null);
      this.paymentSuccess.set(true);
      this.message.set('Demo payment approved! Your membership is now active.');
      this.feedback.show('success', this.message());
      this.sound.playSuccess();
    } finally {
      this.processing.set(false);
    }
  }

  feesRefundForSubscription(subscriptionId: string): RefundRecord | undefined {
    const user = this.auth.currentUser();
    const invoice = this.fees.invoices().find(i =>
      i.subscriptionId === subscriptionId && i.userId === user?.id
    );
    return invoice ? this.fees.refunds().find(r =>
      r.invoiceId === invoice.id && r.userId === user?.id
    ) : undefined;
  }

  canRetryRefund(subscriptionId: string): boolean {
    return this.fees.canIssueRefundForSubscription(subscriptionId);
  }

  retryRefund(subscriptionId: string): void {
    const refund = this.fees.refundCancelledSubscription(subscriptionId);
    this.message.set(refund
      ? `Full demo refund of ${refund.amountEGP} EGP recorded successfully.`
      : 'Unable to record the demo refund. Check your browser storage and try again.');
    this.feedback.show(refund ? 'success' : 'error', this.message());
    this.sound.unlock();
    if (refund) this.sound.playSuccess();
    else this.sound.playError();
  }

  cancelSubscription(subscriptionId: string): void {
    const user = this.auth.currentUser();
    const subscription = this.userSubscriptions().find(item => item.id === subscriptionId);
    if (!user || !subscription) return;
    // Avoid promising a refund for records that have no matching demo payment.
    if (subscription.status === 'active' && !this.fees.hasPaidPaymentForSubscription(subscriptionId)) {
      this.message.set('Cannot cancel this paid membership: its demo payment record is missing. Please review Student Fees.');
      this.feedback.show('error', this.message());
      return;
    }

    if (!window.confirm(
      subscription.status === 'pending'
        ? 'Withdraw this unpaid membership request?'
        : 'Cancel this membership? A full demo refund will be recorded and your access will end immediately.'
    )) return;

    const success = this.memberships.cancelSubscription(user.id, subscriptionId);
    if (success && subscription.status === 'pending') {
      this.fees.voidUnpaidInvoiceForSubscription(subscriptionId);
    }

    const refund = success && subscription.status === 'active'
      ? this.fees.refundCancelledSubscription(subscriptionId)
      : null;

    this.paymentSuccess.set(false);
    this.message.set(!success
      ? 'Unable to cancel: only your own pending request or an active membership within seven days is eligible.'
      : subscription.status === 'pending'
        ? 'Pending membership request cancelled. No payment or refund was needed.'
        : refund
          ? `Membership cancelled. Full demo refund of ${refund.amountEGP} EGP issued and recorded in Student Fees.`
          : 'Membership cancelled, but the demo refund could not be recorded. Use Retry demo refund below.'
    );

    const resultOk = success && (subscription.status === 'pending' || !!refund);
    this.feedback.show(resultOk ? 'success' : 'error', this.message());
    this.sound.unlock();
    if (resultOk) this.sound.playSuccess();
    else this.sound.playError();
  }
}
