
import { Injectable, computed, inject, signal } from '@angular/core';

import { Auth } from '../../../core/auth/auth';
import { MembershipService } from '../../memberships/services/membership.service';
import { Invoice, PaymentRecord } from '../models/invoice.model';
import { DemoPaymentReceipt } from '../../../models/demo-payment.model';

const STORAGE_KEY = 'fitmarket_student_fees_v1';

interface FeesState {
  invoices: Invoice[];
  payments: PaymentRecord[];
}

@Injectable({
  providedIn: 'root'
})
export class StudentFeesService {
  private readonly auth = inject(Auth);
  private readonly memberships = inject(MembershipService);

  private readonly state = signal<FeesState>(this.load());

  readonly invoices = computed(() => this.state().invoices);
  readonly payments = computed(() => this.state().payments);

  // Show all invoices to staff, or only the trainee's own invoices.
  getVisibleInvoices(): Invoice[] {
    const user = this.auth.currentUser();

    if (!user) return [];

    if (user.role === 'admin' || user.role === 'accountant') {
      return this.invoices();
    }

    return this.invoices().filter(
      invoice => invoice.userId === user.id
    );
  }

  getVisiblePayments(): PaymentRecord[] {
    const user = this.auth.currentUser();

    if (!user) return [];

    if (user.role === 'admin' || user.role === 'accountant') {
      return this.payments();
    }

    return this.payments().filter(
      payment => payment.userId === user.id
    );
  }

  // Generate an invoice for a pending membership.
  createInvoiceForSubscription(
    subscriptionId: string
  ): Invoice | null {
    const user = this.auth.currentUser();

    if (!user) return null;

    const subscription = this.memberships.subscriptions().find(
      item => item.id === subscriptionId
    );

    if (!subscription || subscription.status !== 'pending') {
      return null;
    }

    const isStaff =
      user.role === 'admin' || user.role === 'accountant';

    if (!isStaff && (
      user.role !== 'trainee' || subscription.userId !== user.id
    )) {
      return null;
    }

    // Never generate two invoices for the same subscription.
    const existing = this.invoices().find(
      invoice => invoice.subscriptionId === subscriptionId
    );

    if (existing) return existing;

    const plan = this.memberships.getPlan(subscription.planId);

    if (!plan) return null;

    const invoice: Invoice = {
      id: crypto.randomUUID(),
      userId: subscription.userId,
      subscriptionId,
      description: `${plan.name} Membership`,
      amountEGP: plan.priceEGP,
      status: 'unpaid',
      issuedAt: new Date().toISOString()
    };

    const saved = this.save({
      ...this.state(),
      invoices: [...this.invoices(), invoice]
    });

    return saved ? invoice : null;
  }

  /** Keep cancelled unpaid membership requests out of checkout, without deleting their audit trail. */
  voidUnpaidInvoiceForSubscription(subscriptionId: string): boolean {
    const user = this.auth.currentUser();
    const sub = this.memberships.subscriptions().find(item => item.id === subscriptionId);
    if (!user || !sub || sub.userId !== user.id || sub.status !== 'cancelled') return false;

    const updated = this.invoices().map(invoice =>
      invoice.subscriptionId === subscriptionId && invoice.status === 'unpaid'
        ? { ...invoice, status: 'void' as const }
        : invoice
    );
    return this.save({ ...this.state(), invoices: updated });
  }

  // Simulate paying an invoice.
  payInvoice(invoiceId: string, receipt?: DemoPaymentReceipt): boolean {
    const user = this.auth.currentUser();

    if (!user) return false;

    const invoice = this.invoices().find(
      item => item.id === invoiceId
    );

    if (!invoice || invoice.status !== 'unpaid') {
      return false;
    }

    const isStaff =
      user.role === 'admin' || user.role === 'accountant';

    if (!isStaff && (
      user.role !== 'trainee' || invoice.userId !== user.id
    )) {
      return false;
    }

    // Payment is valid only for a pending subscription.
    const subscription = this.memberships.subscriptions().find(
      item => item.id === invoice.subscriptionId
    );

    if (
      !subscription ||
      subscription.userId !== invoice.userId ||
      subscription.status !== 'pending'
    ) {
      return false;
    }

    // Activate the matching membership.
    if (!this.memberships.activateSubscription(subscription.id)) {
      return false;
    }

    const now = new Date().toISOString();

    const updatedInvoices = this.invoices().map(item =>
      item.id === invoice.id
        ? {
            ...item,
            status: 'paid' as const,
            paidAt: now
          }
        : item
    );

    const payment: PaymentRecord = {
      id: crypto.randomUUID(),
      invoiceId: invoice.id,
      userId: invoice.userId,
      amountEGP: invoice.amountEGP,
      paidAt: now,
      method: receipt?.method ?? 'demo',
      last4: receipt?.last4
    };

    return this.save({
      invoices: updatedInvoices,
      payments: [...this.payments(), payment]
    });
  }

  private load(): FeesState {
    const empty: FeesState = {
      invoices: [],
      payments: []
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) return empty;

      const parsed: unknown = JSON.parse(raw);

      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !('invoices' in parsed) ||
        !('payments' in parsed) ||
        !Array.isArray(parsed.invoices) ||
        !Array.isArray(parsed.payments)
      ) {
        return empty;
      }

      return parsed as FeesState;
    } catch {
      return empty;
    }
  }

  private save(data: FeesState): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.state.set(data);
      return true;
    } catch {
      return false;
    }
  }
}
