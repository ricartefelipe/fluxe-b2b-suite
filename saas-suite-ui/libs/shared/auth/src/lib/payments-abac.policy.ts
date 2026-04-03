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

export type PaymentsAbacPermissionKey = 'ledger:read';

type AbacRule = { allowedPlans: string[]; allowedRegions: string[] };

const RULES: Record<PaymentsAbacPermissionKey, AbacRule> = {
  'ledger:read': {
    allowedPlans: ['pro', 'enterprise'],
    allowedRegions: ['region-a', 'region-b'],
  },
};

function normalizePlan(plan: string | undefined | null): string {
  const p = (plan ?? '').trim().toLowerCase();
  return p || 'free';
}

function normalizeRegion(region: string | undefined | null): string {
  const r = (region ?? '').trim().toLowerCase();
  return r || 'region-a';
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

/**
 * Bypass alinhado a `authorize()` no payments quando `tid == '*'` e role `admin`.
 */
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
  return p === 'ledger:read';
}
