
export interface MembershipPlan {
  id: string;
  name: string;
  priceEGP: number;
  durationMonths: number;
  benefits: string[];
}

export type MembershipStatus =
  | 'pending'
  | 'active'
  | 'expired'
  | 'cancelled';

export interface MembershipSubscription {
  id: string;
  userId: number;
  planId: string;
  status: MembershipStatus;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  cancelledAt?: string;
}
