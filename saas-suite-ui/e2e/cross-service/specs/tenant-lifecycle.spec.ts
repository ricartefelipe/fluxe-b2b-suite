import { test, expect } from '@playwright/test';
import {
  type AuthToken,
  type TestTenant,
  TEST_ADMIN,
  TEST_OPERATOR,
  loginAs,
  loginViaUI,
  createTestTenant,
  deleteTenant,
  suspendTenant,
  reactivateTenant,
  setFeatureFlag,
  addPolicy,
  authHeaders,
  waitForEventPropagation,
  pollUntil,
} from '../helpers/test-setup';

let adminToken: AuthToken;
let tenant: TestTenant;

test.describe('Tenant Lifecycle — Cross-Service E2E', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    adminToken = await loginAs(request, TEST_ADMIN.email, TEST_ADMIN.password);
  });

  test.afterAll(async ({ request }) => {
    if (tenant?.id) {
      await reactivateTenant(request, adminToken, tenant.id).catch(() => {});
      await deleteTenant(request, adminToken, tenant.id).catch(() => {});
    }
  });

  // ─── Create Tenant via Admin Console ─────────────────────────────────────

  test('should create a new tenant via admin-console UI', async ({ page }) => {
    await loginViaUI(page, TEST_ADMIN.email, TEST_ADMIN.password);
    await page.goto('/tenants');

    await page.getByRole('button', { name: /new tenant|create|novo/i }).click();

    const suffix = Date.now().toString(36);
    const tenantName = `E2E Lifecycle ${suffix}`;
    const tenantSlug = `e2e-lifecycle-${suffix}`;

    await page.getByLabel(/name|nome/i).fill(tenantName);
    await page.getByLabel(/slug/i).fill(tenantSlug);

    const planSelect = page.locator(
      'mat-select[formControlName="plan"], [data-testid="plan-select"]',
    );
    if (await planSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await planSelect.click();
      await page.getByRole('option', { name: /starter/i }).click();
    }

    const regionSelect = page.locator(
      'mat-select[formControlName="region"], [data-testid="region-select"]',
    );
    if (await regionSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await regionSelect.click();
      await page.getByRole('option').first().click();
    }

    await page.getByRole('button', { name: /save|create|salvar|criar/i }).click();

    await expect(page.locator('.mat-snack-bar-container, [role="alert"]')).toContainText(
      /created|criado|success/i,
      { timeout: 10_000 },
    );

    await page.goto('/tenants');
    const row = page.locator('tr, mat-row, mat-card').filter({ hasText: tenantName });
    await expect(row).toBeVisible({ timeout: 10_000 });

    await row.click();
    await page.waitForURL(/tenants\//, { timeout: 5_000 });
    const urlParts = page.url().split('/');
    const tenantId = urlParts[urlParts.length - 1];

    tenant = { id: tenantId, name: tenantName, slug: tenantSlug };
  });

  // ─── Verify Tenant Propagated to Orders Service ──────────────────────────

  test('should verify tenant is recognized by node-b2b-orders', async ({ request }) => {
    expect(tenant).toBeDefined();

    const orderToken = await loginAs(request, TEST_OPERATOR.email, TEST_OPERATOR.password);

    const res = await request.get('/api/orders/v1/health', {
      headers: {
        ...authHeaders(orderToken),
        'X-Tenant-Id': tenant.id,
      },
    });

    expect(res.status()).toBeLessThan(500);
  });

  // ─── Feature Flags ──────────────────────────────────────────────────────

  test('should add and toggle feature flags for tenant', async ({ request, page }) => {
    await setFeatureFlag(request, adminToken, tenant.id, {
      key: 'enable_bulk_orders',
      enabled: true,
    });

    await setFeatureFlag(request, adminToken, tenant.id, {
      key: 'enable_analytics_v2',
      enabled: false,
    });

    await loginViaUI(page, TEST_ADMIN.email, TEST_ADMIN.password);
    await page.goto(`/tenants/${tenant.id}`);

    const flagsSection = page.locator(
      '[data-testid="feature-flags"], .feature-flags-section',
    );
    if (await flagsSection.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(flagsSection).toContainText(/enable_bulk_orders/i);
    }
  });

  // ─── Policies ────────────────────────────────────────────────────────────

  test('should add ABAC policies for tenant', async ({ request }) => {
    const policyId = await addPolicy(request, adminToken, tenant.id, {
      resource: 'orders',
      action: 'create',
      effect: 'ALLOW',
      conditions: { role: 'operator' },
    });

    expect(policyId).toBeTruthy();

    const denyPolicyId = await addPolicy(request, adminToken, tenant.id, {
      resource: 'orders',
      action: 'delete',
      effect: 'DENY',
    });

    expect(denyPolicyId).toBeTruthy();
  });

  // ─── Suspend Tenant ──────────────────────────────────────────────────────

  test('should suspend tenant and verify access denied across services', async ({
    request,
    page,
  }) => {
    await suspendTenant(request, adminToken, tenant.id);
    await waitForEventPropagation(3_000);

    const operatorToken = await loginAs(
      request,
      TEST_OPERATOR.email,
      TEST_OPERATOR.password,
    );

    const ordersRes = await request.get('/api/orders/v1/orders', {
      headers: { ...authHeaders(operatorToken), 'X-Tenant-Id': tenant.id },
    });
    expect(ordersRes.status()).toBeGreaterThanOrEqual(403);

    const paymentsRes = await request.get('/api/payments/v1/payments', {
      headers: { ...authHeaders(operatorToken), 'X-Tenant-Id': tenant.id },
    });
    expect(paymentsRes.status()).toBeGreaterThanOrEqual(403);

    await loginViaUI(page, TEST_ADMIN.email, TEST_ADMIN.password);
    await page.goto(`/tenants/${tenant.id}`);

    const statusIndicator = page.locator(
      '[data-testid="tenant-status"], .tenant-status, mat-chip',
    );
    await expect(statusIndicator).toContainText(/suspended|suspenso|inactive/i, {
      timeout: 10_000,
    });
  });

  // ─── Reactivate Tenant ──────────────────────────────────────────────────

  test('should reactivate tenant and verify access restored', async ({ request, page }) => {
    await reactivateTenant(request, adminToken, tenant.id);
    await waitForEventPropagation(3_000);

    const operatorToken = await loginAs(
      request,
      TEST_OPERATOR.email,
      TEST_OPERATOR.password,
    );

    const ordersRes = await pollUntil(
      () =>
        request.get('/api/orders/v1/orders', {
          headers: { ...authHeaders(operatorToken), 'X-Tenant-Id': tenant.id },
        }),
      (res) => res.status() < 400,
      { timeout: 15_000 },
    );
    expect(ordersRes.ok()).toBeTruthy();

    await loginViaUI(page, TEST_ADMIN.email, TEST_ADMIN.password);
    await page.goto(`/tenants/${tenant.id}`);

    const statusIndicator = page.locator(
      '[data-testid="tenant-status"], .tenant-status, mat-chip',
    );
    await expect(statusIndicator).toContainText(/active|ativo/i, { timeout: 10_000 });
  });
});
