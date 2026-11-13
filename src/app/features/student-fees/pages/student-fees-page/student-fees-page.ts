
import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { Auth } from '../../../../core/auth/auth';
import { Feedback } from '../../../../shared/services/feedback';
import { Sound } from '../../../../shared/services/sound';
import { MembershipService } from '../../../memberships/services/membership.service';
import { StudentFeesService } from '../../services/student-fees.service';

@Component({
  selector: 'app-student-fees-page',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './student-fees-page.html',
  styleUrl: './student-fees-page.css'
})
export class StudentFeesPage {
  readonly auth = inject(Auth);
  readonly memberships = inject(MembershipService);
  readonly fees = inject(StudentFeesService);
  private readonly feedback = inject(Feedback);
  private readonly sound = inject(Sound);

  readonly message = signal('');

  readonly isStaff = computed(() => {
    const role = this.auth.currentRole();
    return role === 'admin' || role === 'accountant';
  });

  readonly visibleInvoices = computed(() =>
    this.fees.getVisibleInvoices()
  );

  readonly visiblePayments = computed(() =>
    this.fees.getVisiblePayments()
  );

  // Pending memberships that do not have an invoice yet
  readonly pendingWithoutInvoice = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return [];

    const existingIds = new Set(
      this.fees.invoices().map(invoice => invoice.subscriptionId)
    );

    return this.memberships.subscriptions().filter(sub =>
      sub.status === 'pending' &&
      (this.isStaff() || sub.userId === user.id) &&
      !existingIds.has(sub.id)
    );
  });

  createInvoice(subscriptionId: string): void {
    const invoice = this.fees.createInvoiceForSubscription(
      subscriptionId
    );

    this.message.set(
      invoice
        ? 'Invoice created successfully.'
        : 'Unable to create invoice.'
    );
  }

  payInvoice(invoiceId: string): void {
    const success = this.fees.payInvoice(invoiceId);

    this.message.set(success
      ? 'Demo payment completed! Membership activated.'
      : 'Unable to complete demo payment.'
    );
    this.feedback.show(success ? 'success' : 'error', this.message());
    if (success) this.sound.playSuccess();
  }
}
