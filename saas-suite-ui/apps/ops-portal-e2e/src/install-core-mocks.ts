import type { Page, Route } from '@playwright/test';

function base64url(obj: object): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function buildJwtFromDevTokenBody(body: Record<string, unknown>): string {
  const header = { alg: 'none', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(body['sub'] ?? 'e2e'),
    email: String(body['email'] ?? body['sub'] ?? 'e2e@local'),
    tid: body['tid'] ?? null,
    roles: Array.isArray(body['roles']) ? body['roles'] : [],
    perms: Array.isArray(body['perms']) ? body['perms'] : [],
    plan: String(body['plan'] ?? 'starter'),
    region: String(body['region'] ?? 'us-east-1'),
    iat: now,
    exp: now + 86400,
  };
  return `${base64url(header)}.${base64url(payload)}.e2e`;
}

const E2E_TENANT_DEMO = '00000000-0000-0000-0000-000000000002';
const E2E_TENANT_PLATFORM = '00000000-0000-0000-0000-000000000001';

/** O dashboard exige as três; outras rotas usam subconjunto (permissionGuard + ABAC). */
const E2E_OPS_JWT_PERMS: string[] = [
  'orders:read',
  'orders:write',
  'payments:read',
  'payments:write',
  'inventory:read',
  'inventory:write',
  'ledger:read',
];

const E2E_ADMIN_JWT_PERMS: string[] = [
  'tenants:read',
  'tenants:write',
  'policies:read',
  'flags:read',
  'audit:read',
  'analytics:read',
  'admin:write',
];

function buildAccessTokenForE2eLogin(emailRaw: string): string {
  const email = emailRaw.trim().toLowerCase();
  if (email.includes('viewer') || email === 'viewer@e2e.local') {
    return buildJwtFromDevTokenBody({
      sub: 'viewer-e2e',
      email: emailRaw,
      tid: E2E_TENANT_DEMO,
      roles: ['viewer'],
    });
  }
  if (email.includes('ops') || email.startsWith('ops@')) {
    return buildJwtFromDevTokenBody({
      sub: 'ops-e2e',
      email: emailRaw,
      tid: E2E_TENANT_PLATFORM,
      roles: ['ops'],
      perms: E2E_OPS_JWT_PERMS,
      plan: 'pro',
      region: 'us-east-1',
    });
  }
  return buildJwtFromDevTokenBody({
    sub: 'admin-e2e',
    email: emailRaw,
    tid: '*',
    roles: ['admin'],
    perms: E2E_ADMIN_JWT_PERMS,
    plan: 'enterprise',
    region: 'us-east-1',
  });
}

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

const cursorEmpty = { data: [] as unknown[], nextCursor: null, hasMore: false };
const pageEmpty = { data: [] as unknown[], total: 0, page: 0, pageSize: 0 };
const coreListEmpty = { data: [] as unknown[], total: 0, page: 0, pageSize: 0 };

/**
 * Mock do core (dev token) e APIs usadas pelo ops (orders/payments) para E2E sem serviços em :8080/:3000/:8000.
 */
export async function installCoreE2eMocks(page: Page): Promise<void> {
  await page.route(/\/v1\/dev\/token$/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    let body: Record<string, unknown> = {};
    try {
      const raw = route.request().postData();
      if (raw) body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      body = {};
    }
    await fulfillJson(route, {
      access_token: buildJwtFromDevTokenBody(body),
      token_type: 'Bearer',
      expires_in: 86400,
    });
  });

  await page.route(/\/v1\/auth\/login$/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    let email = 'ops@e2e.local';
    try {
      const raw = route.request().postData();
      if (raw) {
        const parsed = JSON.parse(raw) as { email?: string };
        if (typeof parsed.email === 'string') email = parsed.email;
      }
    } catch {
      /* use default */
    }
    await fulfillJson(route, {
      access_token: buildAccessTokenForE2eLogin(email),
      token_type: 'Bearer',
      expires_in: 86400,
    });
  });

  await page.route('**/api/core/v1/tenants**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await fulfillJson(route, coreListEmpty);
  });

  await page.route('**/api/orders/v1/inventory/adjustments**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await fulfillJson(route, cursorEmpty);
  });

  await page.route('**/api/orders/v1/inventory**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await fulfillJson(route, cursorEmpty);
  });

  await page.route('**/api/orders/v1/orders**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await fulfillJson(route, cursorEmpty);
  });

  await page.route('**/api/payments/v1/payment-intents**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await fulfillJson(route, pageEmpty);
  });
}
