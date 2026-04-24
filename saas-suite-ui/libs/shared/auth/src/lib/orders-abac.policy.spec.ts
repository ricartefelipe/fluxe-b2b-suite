import { describe, it, expect } from 'vitest';
import { ordersAbacAllows, sessionOrdersAbacAllows, isKnownOrdersAbacPermission } from './orders-abac.policy';
import type { AuthSession } from './models/auth-session.model';

const baseSession = (over: Partial<AuthSession>): AuthSession => ({
  accessToken: 'x',
  userId: 'u',
  email: 'u@x',
  tenantId: '00000000-0000-0000-0000-000000000002',
  roles: ['ops'],
  permissions: ['orders:write'],
  plan: 'pro',
  region: 'region-a',
  expiresAt: Date.now() + 60_000,
  ...over,
});

describe('ordersAbacAllows', () => {
  it('allows orders:write for pro', () => {
    expect(ordersAbacAllows('orders:write', 'pro', 'region-a')).toBe(true);
  });

  it('denies orders:write for starter', () => {
    expect(ordersAbacAllows('orders:write', 'starter', 'region-a')).toBe(false);
  });

  it('allows inventory:write for enterprise', () => {
    expect(ordersAbacAllows('inventory:write', 'enterprise', 'region-b')).toBe(true);
  });

  it('admin:write only enterprise', () => {
    expect(ordersAbacAllows('admin:write', 'pro', 'region-a')).toBe(false);
    expect(ordersAbacAllows('admin:write', 'enterprise', 'region-a')).toBe(true);
  });
});

describe('isKnownOrdersAbacPermission', () => {
  it('recognizes keys', () => {
    expect(isKnownOrdersAbacPermission('orders:write')).toBe(true);
    expect(isKnownOrdersAbacPermission('orders:read')).toBe(false);
  });
});

describe('sessionOrdersAbacAllows bypass', () => {
  it('bypasses tid * admin', () => {
    const s = baseSession({ tenantId: '*', roles: ['admin'], plan: 'starter' });
    expect(sessionOrdersAbacAllows(s, 'orders:write')).toBe(true);
  });
});
