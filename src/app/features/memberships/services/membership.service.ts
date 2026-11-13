
import { Injectable, signal } from '@angular/core';

import {
  MembershipPlan,
  MembershipSubscription
} from '../models/membership.model';

const STORAGE_KEY = 'fitmarket_memberships_v1';

@Injectable({
  providedIn: 'root'
})
export class MembershipService {

  // Available membership plans (fictional demo prices)
  readonly plans: MembershipPlan[] = [
    {
      id: 'basic',
      name: 'Basic',
      priceEGP: 500,
      durationMonths: 1,
      benefits: [
        'Gym access',
        'Basic equipment'
      ]
    },
    {
      id: 'standard',
      name: 'Standard',
      priceEGP: 1200,
      durationMonths: 3,
      benefits: [
        'Gym access',
        'Group classes',
        'Fitness assessment'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      priceEGP: 4000,
      durationMonths: 12,
      benefits: [
        'Full gym access',
        'Group classes',
        'Personal training sessions',
        'Fitness assessment'
      ]
    }
  ];

  private readonly _subscriptions =
    signal<MembershipSubscription[]>(this.load());

  readonly subscriptions = this._subscriptions.asReadonly();

  // Retrieve subscriptions belonging to a specific user
  getUserSubscriptions(userId: number): MembershipSubscription[] {
    return this.subscriptions().filter(
      subscription => subscription.userId === userId
    );
  }

  // Find a membership plan
  getPlan(planId: string): MembershipPlan | undefined {
    return this.plans.find(plan => plan.id === planId);
  }

  // Request a membership
  requestSubscription(
    userId: number,
    planId: string
  ): MembershipSubscription | null {

    const plan = this.getPlan(planId);

    if (!Number.isSafeInteger(userId) || userId <= 0 || !plan) {
      return null;
    }

    // Prevent duplicate pending or active subscriptions
    const existing = this.getUserSubscriptions(userId).some(
      subscription =>
        subscription.status === 'pending' ||
        subscription.status === 'active'
    );

    if (existing) {
      return null;
    }

    const subscription: MembershipSubscription = {
      id: crypto.randomUUID(),
      userId,
      planId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const updated = [
      ...this.subscriptions(),
      subscription
    ];

    return this.save(updated) ? subscription : null;
  }

  // Activate a subscription after simulated payment
  activateSubscription(subscriptionId: string): boolean {

    const subscription = this.subscriptions().find(
      item => item.id === subscriptionId
    );

    if (!subscription || subscription.status !== 'pending') {
      return false;
    }

    const plan = this.getPlan(subscription.planId);

    if (!plan) {
      return false;
    }

    const start = new Date();
    const end = new Date(start);

    // Add months, clamping dates at month boundaries
    end.setUTCDate(1);
    end.setUTCMonth(end.getUTCMonth() + plan.durationMonths);

    const lastDay = new Date(Date.UTC(
      end.getUTCFullYear(),
      end.getUTCMonth() + 1,
      0
    )).getUTCDate();

    end.setUTCDate(Math.min(start.getUTCDate(), lastDay));

    const updated = this.subscriptions().map(item =>
      item.id === subscriptionId
        ? {
            ...item,
            status: 'active' as const,
            startDate: start.toISOString(),
            endDate: end.toISOString()
          }
        : item
    );

    return this.save(updated);
  }


  /** A cancellation is allowed for exactly seven days after demo activation. */
  canCancelSubscription(userId: number, subscription: MembershipSubscription, now = Date.now()): boolean {
    if (subscription.userId !== userId || subscription.status !== 'active' || !subscription.startDate) {
      return false;
    }

    const startedAt = Date.parse(subscription.startDate);
    return Number.isFinite(startedAt) &&
      now >= startedAt &&
      now - startedAt <= 7 * 24 * 60 * 60 * 1000;
  }

  /** Cancellation stops demo access; it does not refund or erase a paid invoice. */
  cancelSubscription(userId: number, subscriptionId: string): boolean {
    const subscription = this.subscriptions().find(item => item.id === subscriptionId);
    if (!subscription || !this.canCancelSubscription(userId, subscription)) return false;

    const updated = this.subscriptions().map(item =>
      item.id === subscriptionId
        ? { ...item, status: 'cancelled' as const, cancelledAt: new Date().toISOString() }
        : item
    );
    return this.save(updated);
  }

  // Restore data from browser storage
  private load(): MembershipSubscription[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const data: unknown = stored ? JSON.parse(stored) : [];

      if (!Array.isArray(data)) {
        return [];
      }

      return data.filter((item): item is MembershipSubscription =>
        item !== null &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.userId === 'number' &&
        typeof item.planId === 'string' &&
        ['pending', 'active', 'expired', 'cancelled']
          .includes(item.status)
      );
    } catch {
      return [];
    }
  }

  // Save subscriptions and update Angular state
  private save(subscriptions: MembershipSubscription[]): boolean {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(subscriptions)
      );

      this._subscriptions.set(subscriptions);
      return true;
    } catch {
      return false;
    }
  }
}
