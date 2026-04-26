import type { AuthSession } from './models/auth-session.model';

const PLATFORM_TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Espelha políticas default do node-b2b-orders (`prisma/seed.ts` → Policy).
 * `allowedRegions` vazio no seed = sem restrição de região no serviço.
 */

const PLAN_TIER: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
};

type AbacRule = { allowedPlans: string[]; allowedRegions: string[] };

export type OrdersAbacPermissionKey =
  | 'orders:write'
  | 'inventory:write'
  | 'products:write'
  | 'admin:write'
  | 'analytics:read'
  | 'audit:read'
  | 'webhooks:read'
  | 'webhooks:write';

const RULES: Record<OrdersAbacPermissionKey, AbacRule> = {
  'orders:write': { allowedPlans: ['pro', 'enterprise'], allowedRegions: [] },
  'inventory:write': { allowedPlans: ['pro', 'enterprise'], allowedRegions: [] },
  'products:write': { allowedPlans: ['pro', 'enterprise'], allowedRegions: [] },
  'admin:write': { allowedPlans: ['enterprise'], allowedRegions: [] },
  'analytics:read': { allowedPlans: ['pro', 'enterprise'], allowedRegions: [] },
  'audit:read': { allowedPlans: ['pro', 'enterprise'], allowedRegions: [] },
  'webhooks:read': { allowedPlans: ['pro', 'enterprise'], allowedRegions: [] },
  'webhooks:write': { allowedPlans: ['pro', 'enterprise'], allowedRegions: [] },
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
  if (!allowed.length) return true;
  if (allowed.includes(planNorm)) return true;
  const userTier = PLAN_TIER[planNorm];
  if (userTier === undefined) return false;
  const tiers = allowed.map(a => PLAN_TIER[a]).filter((t): t is number => t !== undefined);
  if (!tiers.length) return false;
  return userTier >= Math.min(...tiers);
}

function regionAllowed(regionNorm: string, allowed: string[]): boolean {
  if (!allowed.length) return true;
  return allowed.includes(regionNorm);
}

function isOrdersAbacBypassSession(session: AuthSession | null): boolean {
  if (!session) return false;
  return (session.tenantId === '*' || session.tenantId === PLATFORM_TENANT_ID) && session.roles.includes('admin');
}

export function ordersAbacAllows(
  permission: OrdersAbacPermissionKey,
  plan: string | undefined | null,
  region: string | undefined | null,
): boolean {
  const rule = RULES[permission];
  if (!rule) return true;
  const planNorm = normalizePlan(plan);
  const regionNorm = normalizeRegion(region);
  return planAllowed(planNorm, rule.allowedPlans) && regionAllowed(regionNorm, rule.allowedRegions);
}

export function sessionOrdersAbacAllows(
  session: AuthSession | null,
  permission: OrdersAbacPermissionKey,
): boolean {
  if (!session) return false;
  if (isOrdersAbacBypassSession(session)) return true;
  return ordersAbacAllows(permission, session.plan, session.region);
}

export function isKnownOrdersAbacPermission(p: string): p is OrdersAbacPermissionKey {
  return Object.prototype.hasOwnProperty.call(RULES, p);
}
