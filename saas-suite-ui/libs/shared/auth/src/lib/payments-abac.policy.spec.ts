import { describe, it, expect } from 'vitest';
import { paymentsAbacAllows, sessionPaymentsAbacAllows, isKnownPaymentsAbacPermission } from './payments-abac.policy';
import type { AuthSession } from './models/auth-session.model';

const baseSession = (over: Partial<AuthSession>): AuthSession => ({
  accessToken: 'x',
  userId: 'u',
  email: 'u@x',
  tenantId: 'tenant_demo',
  roles: ['ops'],
  permissions: ['ledger:read', 'payments:read'],
  plan: 'pro',
  region: 'region-a',
  expiresAt: Date.now() + 60_000,
  ...over,
});

describe('paymentsAbacAllows ledger:read', () => {
  it('allows pro + region-a', () => {
    expect(paymentsAbacAllows('ledger:read', 'pro', 'region-a')).toBe(true);
  });

  it('allows enterprise tier', () => {
    expect(paymentsAbacAllows('ledger:read', 'enterprise', 'region-b')).toBe(true);
  });

  it('denies starter', () => {
    expect(paymentsAbacAllows('ledger:read', 'starter', 'region-a')).toBe(false);
  });

  it('denies free', () => {
    expect(paymentsAbacAllows('ledger:read', 'free', 'region-a')).toBe(false);
  });

  it('denies wrong region', () => {
    expect(paymentsAbacAllows('ledger:read', 'pro', 'global')).toBe(false);
  });

  it('treats empty plan as free', () => {
    expect(paymentsAbacAllows('ledger:read', '', 'region-a')).toBe(false);
  });

  it('treats empty region as region-a', () => {
    expect(paymentsAbacAllows('ledger:read', 'pro', '')).toBe(true);
  });
});

describe('paymentsAbacAllows payments:read', () => {
  it('allows free in region-a', () => {
    expect(paymentsAbacAllows('payments:read', 'free', 'region-a')).toBe(true);
  });

  it('denies free in wrong region', () => {
    expect(paymentsAbacAllows('payments:read', 'free', 'eu-west-1')).toBe(false);
  });
});

describe('isKnownPaymentsAbacPermission', () => {
  it('recognizes seeded keys', () => {
    expect(isKnownPaymentsAbacPermission('ledger:read')).toBe(true);
    expect(isKnownPaymentsAbacPermission('payments:read')).toBe(true);
    expect(isKnownPaymentsAbacPermission('unknown')).toBe(false);
  });
});

describe('sessionPaymentsAbacAllows', () => {
  it('bypasses for global admin', () => {
    const s = baseSession({
      tenantId: '*',
      roles: ['admin'],
      plan: 'enterprise',
      region: 'global',
    });
    expect(sessionPaymentsAbacAllows(s, 'ledger:read')).toBe(true);
  });

  it('denies global region for normal tenant', () => {
    const s = baseSession({ plan: 'enterprise', region: 'global' });
    expect(sessionPaymentsAbacAllows(s, 'ledger:read')).toBe(false);
  });
});
