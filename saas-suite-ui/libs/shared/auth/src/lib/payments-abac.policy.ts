import type { AuthSession } from './models/auth-session.model';

/**
 * Espelha as políticas ABAC default do py-payments-ledger (`seed._upsert_policies`).
 * Se alterares políticas no serviço de pagamentos, atualiza este mapa ou extrai contrato partilhado.
 */
const PLAN_TIER: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
};

export type PaymentsAbacPermissionKey =
  | 'payments:read'
  | 'payments:write'
  | 'ledger:read'
  | 'admin:write'
  | 'profile:read'
  | 'analytics:read';

type AbacRule = { allowedPlans: string[]; allowedRegions: string[] };

const RULES: Record<PaymentsAbacPermissionKey, AbacRule> = {
  'payments:read': {
    allowedPlans: ['free', 'pro', 'enterprise'],
    allowedRegions: ['region-a', 'region-b'],
  },
  'payments:write': {
    allowedPlans: ['pro', 'enterprise'],
    allowedRegions: ['region-a', 'region-b'],
  },
  'ledger:read': {
    allowedPlans: ['pro', 'enterprise'],
    allowedRegions: ['region-a', 'region-b'],
  },
  'admin:write': {
    allowedPlans: ['enterprise'],
    allowedRegions: ['region-a', 'region-b'],
  },
  'profile:read': {
    allowedPlans: ['free', 'pro', 'enterprise'],
    allowedRegions: ['region-a', 'region-b'],
  },
  'analytics:read': {
    allowedPlans: ['pro', 'enterprise'],
    allowedRegions: ['region-a', 'region-b'],
  },
};

function normalizePlan(plan: string | undefined | null): string {
  const p = (plan ?? '').trim().toLowerCase();
  if (!p) return 'free';
  if (p === 'professional') return 'pro';
  return p;
}

function normalizeRegion(region: string | undefined | null): string {
  const r = (region ?? '').trim().toLowerCase();
  if (!r) return 'region-a';
  if (r === 'us-east-1') return 'region-a';
  return r;
}

function planAllowed(planNorm: string, allowed: string[]): boolean {
  if (allowed.includes(planNorm)) return true;
  const userTier = PLAN_TIER[planNorm];
  if (userTier === undefined) return false;
  const tiers = allowed.map(a => PLAN_TIER[a]).filter((t): t is number => t !== undefined);
  if (!tiers.length) return false;
  return userTier >= Math.min(...tiers);
}

function regionAllowed(regionNorm: string, allowed: string[]): boolean {
  return allowed.includes(regionNorm);
}

function isPaymentsAbacBypassSession(session: AuthSession | null): boolean {
  if (!session) return false;
  return session.tenantId === '*' && session.roles.includes('admin');
}

export function paymentsAbacAllows(
  permission: PaymentsAbacPermissionKey,
  plan: string | undefined | null,
  region: string | undefined | null,
): boolean {
  const rule = RULES[permission];
  if (!rule) return true;
  const planNorm = normalizePlan(plan);
  const regionNorm = normalizeRegion(region);
  return planAllowed(planNorm, rule.allowedPlans) && regionAllowed(regionNorm, rule.allowedRegions);
}

export function sessionPaymentsAbacAllows(
  session: AuthSession | null,
  permission: PaymentsAbacPermissionKey,
): boolean {
  if (!session) return false;
  if (isPaymentsAbacBypassSession(session)) return true;
  return paymentsAbacAllows(permission, session.plan, session.region);
}

export function isKnownPaymentsAbacPermission(p: string): p is PaymentsAbacPermissionKey {
  return Object.prototype.hasOwnProperty.call(RULES, p);
}
