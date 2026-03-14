export interface PlanDefinition {
  id: string;
  slug: string;
  displayName: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  maxUsers: number;
  maxProjects: number;
  storageGb: number;
}

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';

export interface Subscription {
  id: string;
  tenantId: string;
  planSlug: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  createdAt: string;
}
