
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Auth } from '../../../../core/auth/auth';
import { MembershipService } from '../../services/membership.service';
import { StudentFeesService } from '../../../student-fees/services/student-fees.service';
@Component({
  selector: 'app-memberships-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './memberships-page.html',
  styleUrl: './memberships-page.css'
})
export class MembershipsPage {
  readonly auth = inject(Auth);
  readonly memberships = inject(MembershipService);
private readonly fees = inject(StudentFeesService);
  readonly message = signal('');

  readonly userSubscriptions = computed(() => {
    const user = this.auth.currentUser();

    if (!user) return [];

    return this.memberships.getUserSubscriptions(user.id);
  });

  readonly canSubscribe = computed(() => {
    const user = this.auth.currentUser();

    if (!user || user.role !== 'trainee') return false;

    return !this.userSubscriptions().some(
      sub => sub.status === 'pending' || sub.status === 'active'
    );
  });

  subscribe(planId: string): void {
    const user = this.auth.currentUser();

    if (!user || !this.canSubscribe()) {
      this.message.set('You cannot request a subscription right now.');
      return;
    }

    const result = this.memberships.requestSubscription(
      user.id,
      planId
    );

    if (result) {
  const invoice = this.fees.createInvoiceForSubscription(result.id);

  this.message.set(
    invoice
      ? 'Membership requested! Your invoice is ready in Student Fees.'
      : 'Membership requested. Open Student Fees to generate your invoice.'
  );
} else {
  this.message.set('Unable to request membership.');
}
  }
}
