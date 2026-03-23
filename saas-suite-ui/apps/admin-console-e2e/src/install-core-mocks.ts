import type { Page, Route } from '@playwright/test';

function base64url(obj: object): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

/**
 * JWT local (alg:none) espelhando o body do POST /v1/dev/token para o perfil escolhido nos testes.
 */
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

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

/**
 * Mock do core (dev token) para E2E sem spring-saas-core em :8080.
 */
const emptyPage = { data: [] as unknown[], total: 0, page: 0, pageSize: 0 };

const mockBillingPlans = [
  {
    id: 'plan-e2e-1',
    slug: 'starter',
    displayName: 'Starter',
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    maxUsers: 5,
    maxProjects: 10,
    storageGb: 1,
  },
  {
    id: 'plan-e2e-2',
    slug: 'pro',
    displayName: 'Pro',
    monthlyPriceCents: 9900,
    yearlyPriceCents: 99000,
    maxUsers: 20,
    maxProjects: 50,
    storageGb: 10,
  },
];

/**
 * Mock do core (dev token + leituras usadas pelo admin) para E2E sem spring-saas-core em :8080.
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

  await page.route('**/api/core/v1/tenants**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await fulfillJson(route, emptyPage);
  });

  await page.route('**/api/core/v1/policies**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await fulfillJson(route, emptyPage);
  });

  await page.route('**/api/core/v1/audit**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await fulfillJson(route, emptyPage);
  });

  await page.route('**/api/core/v1/billing/plans**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await fulfillJson(route, mockBillingPlans);
  });
}
