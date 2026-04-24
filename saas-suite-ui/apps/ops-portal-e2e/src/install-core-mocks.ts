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

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

const emptyKeysetList = { data: [] as unknown[], nextCursor: null, hasMore: false };
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
    await fulfillJson(route, emptyKeysetList);
  });

  await page.route('**/api/orders/v1/inventory**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await fulfillJson(route, emptyKeysetList);
  });

  await page.route('**/api/orders/v1/orders**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await fulfillJson(route, emptyKeysetList);
  });

  await page.route('**/api/payments/v1/payment-intents**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await fulfillJson(route, pageEmpty);
  });
}
