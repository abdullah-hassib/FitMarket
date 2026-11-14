
import { Injectable, computed, inject, signal } from '@angular/core';

import { Auth } from '../../../core/auth/auth';
import { MembershipService } from '../../memberships/services/membership.service';
import { Invoice, PaymentRecord, RefundRecord } from '../models/invoice.model';
import { DemoPaymentReceipt } from '../../../models/demo-payment.model';

const STORAGE_KEY = 'fitmarket_student_fees_v1';

interface FeesState {
  invoices: Invoice[];
  payments: PaymentRecord[];
  refunds: RefundRecord[];
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
  readonly refunds = computed(() => this.state().refunds);

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

  getVisibleRefunds(): RefundRecord[] {
    const user = this.auth.currentUser();
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'accountant') return this.refunds();
    return this.refunds().filter(refund => refund.userId === user.id);
  }

  /** A paid membership must have a matching demo payment before a refund is promised. */
  hasPaidPaymentForSubscription(subscriptionId: string): boolean {
    const user = this.auth.currentUser();
    const subscription = this.memberships.subscriptions().find(s => s.id === subscriptionId);
    if (!user || !subscription || subscription.userId !== user.id) return false;

    const invoice = this.invoices().find(i =>
      i.subscriptionId === subscriptionId && i.userId === user.id && i.status === 'paid'
    );
    if (!invoice) return false;
    return this.payments().some(p =>
      p.invoiceId === invoice.id && p.userId === user.id &&
      p.amountEGP === invoice.amountEGP && p.amountEGP > 0
    );
  }

  /** Supports both immediate refunds and retries for memberships cancelled earlier. */
  canIssueRefundForSubscription(subscriptionId: string): boolean {
    const user = this.auth.currentUser();
    const sub = this.memberships.subscriptions().find(s => s.id === subscriptionId);
    if (!user || !sub || sub.userId !== user.id ||
        sub.status !== 'cancelled' || !sub.startDate || !sub.cancelledAt) return false;

    const start = Date.parse(sub.startDate);
    const cancelled = Date.parse(sub.cancelledAt);
    if (!Number.isFinite(start) || !Number.isFinite(cancelled) ||
        cancelled < start || cancelled - start > 7 * 24 * 60 * 60 * 1000) return false;

    return this.hasPaidPaymentForSubscription(subscriptionId);
  }

  /** Full fictional refund against the original payment, exactly once. */
  refundCancelledSubscription(subscriptionId: string): RefundRecord | null {
    if (!this.canIssueRefundForSubscription(subscriptionId)) return null;
    const invoice = this.invoices().find(i => i.subscriptionId === subscriptionId && i.status === 'paid')!;
    const payment = this.payments().find(p => p.invoiceId === invoice.id && p.userId === invoice.userId)!;
    if (this.refunds().some(r => r.paymentId === payment.id || r.invoiceId === invoice.id)) return null;

    const now = new Date().toISOString();
    const refund: RefundRecord = {
      id: crypto.randomUUID(),
      paymentId: payment.id,
      invoiceId: invoice.id,
      userId: invoice.userId,
      amountEGP: payment.amountEGP,
      refundedAt: now,
      method: payment.method,
      last4: payment.last4
    };
    const saved = this.save({
      ...this.state(),
      invoices: this.invoices().map(i =>
        i.id === invoice.id ? { ...i, status: 'refunded' as const, refundedAt: now } : i
      ),
      refunds: [...this.refunds(), refund]
    });
    return saved ? refund : null;
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
      ...this.state(),
      invoices: updatedInvoices,
      payments: [...this.payments(), payment]
    });
  }

  private load(): FeesState {
    const empty: FeesState = {
      invoices: [],
      payments: [],
      refunds: []
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

      const state = parsed as Omit<FeesState, 'refunds'> & { refunds?: RefundRecord[] };
      return {
        invoices: state.invoices,
        payments: state.payments,
        refunds: Array.isArray(state.refunds) ? state.refunds : []
      };
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
