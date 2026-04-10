import type { Page, Route } from '@playwright/test';

/** JWT mínimo (alg:none) para E2E sem spring-saas-core em :8080. */
function buildMockDevAccessToken(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'viewer-e2e',
      email: 'viewer@e2e.local',
      tid: '00000000-0000-0000-0000-000000000002',
      roles: ['viewer'],
      perms: [],
      plan: 'starter',
      region: 'us-east-1',
      iat: now,
      exp: now + 86400,
    })
  ).toString('base64url');
  return `${header}.${payload}.e2e`;
}

/** Produto mínimo para listagem/detalhe quando o serviço de orders não está a correr. */
const MOCK_PRODUCT = {
  id: 'prod-e2e-1',
  tenantId: '00000000-0000-0000-0000-000000000002',
  sku: 'E2E-1',
  name: 'E2E Product',
  description: 'Produto para testes E2E',
  price: 29.99,
  currency: 'BRL',
  category: 'Electronics',
  imageUrl: 'https://placehold.co/300x300?text=E2E',
  inStock: true,
  rating: 4.5,
  reviewCount: 10,
  active: true,
};

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

/**
 * Intercepta chamadas ao orders API usadas pelo shop para E2E sem node-b2b-orders.
 * Cobre `/api/orders/v1/...` no dev server e pedidos diretos a `:3000/v1/...` se existirem.
 */
export async function installShopOrdersApiMocks(page: Page): Promise<void> {
  await page.route(/\/v1\/dev\/token$/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: buildMockDevAccessToken(),
        token_type: 'Bearer',
        expires_in: 86400,
      }),
    });
  });

  await page.route(/\/v1\/products/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path.includes('/metadata/categories')) {
      await fulfillJson(route, ['Electronics']);
      return;
    }
    if (path.includes('/metadata/price-range')) {
      await fulfillJson(route, { min: 10, max: 100 });
      return;
    }

    const detail = path.match(/\/v1\/products\/([^/]+)$/);
    if (detail && detail[1] !== 'metadata') {
      await fulfillJson(route, MOCK_PRODUCT);
      return;
    }

    if (/\/v1\/products$/.test(path)) {
      await fulfillJson(route, {
        data: [MOCK_PRODUCT],
        total: 1,
        page: 1,
        pageSize: 20,
      });
      return;
    }

    await route.continue();
  });
}
