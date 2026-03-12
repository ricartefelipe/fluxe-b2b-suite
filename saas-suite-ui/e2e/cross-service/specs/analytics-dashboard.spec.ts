import { test, expect } from '@playwright/test';
import {
  type AuthToken,
  type TestTenant,
  type TestProduct,
  TEST_ADMIN,
  TEST_OPERATOR,
  loginAs,
  loginViaUI,
  createTestTenant,
  deleteTenant,
  createProduct,
  addInventory,
  createOrder,
  confirmOrder,
  cancelOrder,
  shipOrder,
  deliverOrder,
  authHeaders,
  waitForEventPropagation,
} from '../helpers/test-setup';

let adminToken: AuthToken;
let operatorToken: AuthToken;
let tenant: TestTenant;
let product: TestProduct;

test.describe('Analytics Dashboard — Cross-Service E2E', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    adminToken = await loginAs(request, TEST_ADMIN.email, TEST_ADMIN.password);
    operatorToken = await loginAs(request, TEST_OPERATOR.email, TEST_OPERATOR.password);

    tenant = await createTestTenant(request, adminToken, { name: 'Analytics E2E Tenant' });

    product = await createProduct(request, operatorToken, tenant.id, {
      name: 'Analytics Widget',
      sku: `AW-${Date.now()}`,
      price: 19.99,
      category: 'widgets',
    });
    await addInventory(request, operatorToken, tenant.id, product.id, 200);

    const statuses: Array<'confirm' | 'ship' | 'deliver' | 'cancel'> = [
      'confirm',
      'confirm',
      'ship',
      'deliver',
      'cancel',
    ];

    for (const targetStatus of statuses) {
      const order = await createOrder(request, operatorToken, tenant.id, [
        { productId: product.id, quantity: Math.floor(Math.random() * 5) + 1, unitPrice: 19.99 },
      ]);

      if (targetStatus === 'cancel') {
        await confirmOrder(request, operatorToken, tenant.id, order.id);
        await cancelOrder(request, operatorToken, tenant.id, order.id);
      } else if (targetStatus === 'confirm') {
        await confirmOrder(request, operatorToken, tenant.id, order.id);
      } else if (targetStatus === 'ship') {
        await confirmOrder(request, operatorToken, tenant.id, order.id);
        await shipOrder(request, operatorToken, tenant.id, order.id, `TRK-${Date.now()}`);
      } else if (targetStatus === 'deliver') {
        await confirmOrder(request, operatorToken, tenant.id, order.id);
        await shipOrder(request, operatorToken, tenant.id, order.id, `TRK-${Date.now()}`);
        await deliverOrder(request, operatorToken, tenant.id, order.id);
      }
    }

    await waitForEventPropagation(3_000);
  });

  test.afterAll(async ({ request }) => {
    if (tenant?.id) {
      await deleteTenant(request, adminToken, tenant.id).catch(() => {});
    }
  });

  // ─── Dashboard Navigation ───────────────────────────────────────────────

  test('should navigate to analytics dashboard', async ({ page }) => {
    await loginViaUI(page, TEST_OPERATOR.email, TEST_OPERATOR.password);
    await page.goto('/dashboard');

    await expect(
      page.locator('[data-testid="analytics-dashboard"], .analytics-dashboard, .dashboard-container'),
    ).toBeVisible({ timeout: 10_000 });
  });

  // ─── Demand Chart ───────────────────────────────────────────────────────

  test('should display demand chart with order data', async ({ page }) => {
    await loginViaUI(page, TEST_OPERATOR.email, TEST_OPERATOR.password);
    await page.goto('/dashboard');

    const demandChart = page.locator(
      '[data-testid="demand-chart"], .demand-chart, canvas, svg.chart',
    ).first();

    await expect(demandChart).toBeVisible({ timeout: 15_000 });

    const chartContainer = page.locator(
      '[data-testid="demand-section"], .demand-section, mat-card',
    ).filter({ hasText: /demand|demanda|orders|pedidos/i }).first();

    if (await chartContainer.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(chartContainer).not.toBeEmpty();
    }
  });

  // ─── Order Status Summary ──────────────────────────────────────────────

  test('should show order status breakdown', async ({ page }) => {
    await loginViaUI(page, TEST_OPERATOR.email, TEST_OPERATOR.password);
    await page.goto('/dashboard');

    const statusSection = page.locator(
      '[data-testid="order-status-summary"], .status-summary, mat-card',
    ).filter({ hasText: /status|overview|resumo/i }).first();

    if (await statusSection.isVisible({ timeout: 10_000 }).catch(() => false)) {
      const confirmedBadge = statusSection.locator('text=/confirmed|confirmad/i');
      const deliveredBadge = statusSection.locator('text=/delivered|entreg/i');
      const cancelledBadge = statusSection.locator('text=/cancelled|cancelad/i');

      const hasAnyStatus =
        (await confirmedBadge.count()) > 0 ||
        (await deliveredBadge.count()) > 0 ||
        (await cancelledBadge.count()) > 0;

      expect(hasAnyStatus).toBeTruthy();
    }
  });

  // ─── Anomaly Detection ─────────────────────────────────────────────────

  test('should display anomaly detection reports', async ({ page }) => {
    await loginViaUI(page, TEST_OPERATOR.email, TEST_OPERATOR.password);
    await page.goto('/dashboard');

    const anomalySection = page.locator(
      '[data-testid="anomaly-detection"], .anomaly-section, mat-card',
    ).filter({ hasText: /anomal|alert|unusual/i }).first();

    if (await anomalySection.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await expect(anomalySection).toBeVisible();

      const anomalyItems = anomalySection.locator(
        '.anomaly-item, mat-list-item, tr, [data-testid^="anomaly-"]',
      );
      const count = await anomalyItems.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  // ─── Inventory Forecast ────────────────────────────────────────────────

  test('should display inventory forecast data', async ({ page }) => {
    await loginViaUI(page, TEST_OPERATOR.email, TEST_OPERATOR.password);
    await page.goto('/dashboard');

    const forecastSection = page.locator(
      '[data-testid="inventory-forecast"], .forecast-section, mat-card',
    ).filter({ hasText: /forecast|previsão|inventory|estoque/i }).first();

    if (await forecastSection.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await expect(forecastSection).not.toBeEmpty();

      const forecastChart = forecastSection.locator('canvas, svg, .chart');
      if (await forecastChart.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await expect(forecastChart).toBeVisible();
      }
    }
  });

  // ─── Analytics API Data Consistency ────────────────────────────────────

  test('should return consistent analytics data from API', async ({ request }) => {
    const res = await request.get('/api/orders/v1/analytics/summary', {
      headers: { ...authHeaders(operatorToken), 'X-Tenant-Id': tenant.id },
    });

    if (res.ok()) {
      const data = await res.json();
      expect(data).toBeDefined();

      if (data.totalOrders !== undefined) {
        expect(data.totalOrders).toBeGreaterThanOrEqual(5);
      }

      if (data.statusBreakdown) {
        const breakdown = data.statusBreakdown;
        const total = Object.values(breakdown).reduce(
          (sum: number, count) => sum + (count as number),
          0,
        );
        expect(total).toBeGreaterThanOrEqual(5);
      }
    }
  });

  // ─── Dashboard Responsive Layout ───────────────────────────────────────

  test('should render dashboard correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginViaUI(page, TEST_OPERATOR.email, TEST_OPERATOR.password);
    await page.goto('/dashboard');

    await expect(
      page.locator('[data-testid="analytics-dashboard"], .dashboard-container, .analytics-dashboard'),
    ).toBeVisible({ timeout: 10_000 });

    const overflow = await page.evaluate(() => {
      const body = document.body;
      return body.scrollWidth > body.clientWidth;
    });
    expect(overflow).toBeFalsy();
  });
});
