import { test, expect } from '@playwright/test';
import {
  type AuthToken,
  type TestTenant,
  TEST_ADMIN,
  TEST_OPERATOR,
  TEST_VIEWER,
  loginAs,
  loginViaUI,
  createTestTenant,
  deleteTenant,
  addPolicy,
  authHeaders,
  waitForEventPropagation,
} from '../helpers/test-setup';

const API_CORE = '/api/core';
const API_ORDERS = '/api/orders';

let adminToken: AuthToken;
let tenant: TestTenant;

test.describe('Authentication & Authorization — Cross-Service E2E', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    adminToken = await loginAs(request, TEST_ADMIN.email, TEST_ADMIN.password);
    tenant = await createTestTenant(request, adminToken);
  });

  test.afterAll(async ({ request }) => {
    if (tenant?.id) {
      await deleteTenant(request, adminToken, tenant.id).catch(() => {});
    }
  });

  // ─── Registration & Login ───────────────────────────────────────────────

  test('should register a new user and obtain JWT', async ({ request }) => {
    const suffix = Date.now().toString(36);
    const newUser = {
      email: `e2e-user-${suffix}@fluxe.test`,
      password: 'E2eTest!2026',
      name: `E2E User ${suffix}`,
    };

    const registerRes = await request.post(`${API_CORE}/v1/auth/register`, {
      data: newUser,
    });

    if (registerRes.status() === 201 || registerRes.status() === 200) {
      const token = await loginAs(request, newUser.email, newUser.password);
      expect(token.accessToken).toBeTruthy();
      expect(token.accessToken.split('.')).toHaveLength(3);
    } else {
      expect(registerRes.status()).toBe(409);
    }
  });

  test('should login via UI and be redirected to dashboard', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('form, mat-card')).toBeVisible();

    await page.getByLabel(/email/i).fill(TEST_OPERATOR.email);
    await page.getByLabel(/password|senha/i).fill(TEST_OPERATOR.password);
    await page.getByRole('button', { name: /sign in|login|entrar/i }).click();

    await page.waitForURL(/dashboard|orders/, { timeout: 15_000 });
    expect(page.url()).not.toContain('/login');
  });

  // ─── JWT on Protected Endpoints ─────────────────────────────────────────

  test('should access protected endpoints with valid JWT', async ({ request }) => {
    const token = await loginAs(request, TEST_OPERATOR.email, TEST_OPERATOR.password);

    const coreRes = await request.get(`${API_CORE}/v1/tenants`, {
      headers: authHeaders(token),
    });
    expect(coreRes.status()).toBeLessThan(400);

    const ordersRes = await request.get(`${API_ORDERS}/v1/orders`, {
      headers: { ...authHeaders(token), 'X-Tenant-Id': tenant.id },
    });
    expect(ordersRes.status()).toBeLessThan(400);
  });

  test('should reject requests without JWT', async ({ request }) => {
    const coreRes = await request.get(`${API_CORE}/v1/tenants`);
    expect(coreRes.status()).toBeGreaterThanOrEqual(401);

    const ordersRes = await request.get(`${API_ORDERS}/v1/orders`);
    expect(ordersRes.status()).toBeGreaterThanOrEqual(401);
  });

  test('should reject requests with an expired/invalid JWT', async ({ request }) => {
    const fakeToken = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJmYWtlIn0.invalid';

    const res = await request.get(`${API_CORE}/v1/tenants`, {
      headers: { Authorization: `Bearer ${fakeToken}` },
    });

    expect(res.status()).toBeGreaterThanOrEqual(401);
  });

  // ─── Token Expiry Handling ──────────────────────────────────────────────

  test('should handle token expiry gracefully in UI', async ({ page, context }) => {
    await loginViaUI(page, TEST_OPERATOR.email, TEST_OPERATOR.password);

    await context.addCookies([]);
    await page.evaluate(() => {
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
    });

    await page.goto('/orders');
    await page.waitForURL(/login/, { timeout: 15_000 });
    expect(page.url()).toContain('login');
  });

  // ─── ABAC: Permission Denied ───────────────────────────────────────────

  test('should return 403 when user lacks permission (ABAC)', async ({ request }) => {
    await addPolicy(request, adminToken, tenant.id, {
      resource: 'orders',
      action: 'delete',
      effect: 'DENY',
    });
    await waitForEventPropagation();

    const viewerToken = await loginAs(request, TEST_VIEWER.email, TEST_VIEWER.password);

    const deleteRes = await request.delete(`${API_ORDERS}/v1/orders/nonexistent-id`, {
      headers: { ...authHeaders(viewerToken), 'X-Tenant-Id': tenant.id },
    });

    expect(deleteRes.status()).toBeGreaterThanOrEqual(403);
  });

  test('should deny admin-only actions to non-admin users', async ({ request }) => {
    const operatorToken = await loginAs(
      request,
      TEST_OPERATOR.email,
      TEST_OPERATOR.password,
    );

    const res = await request.post(`${API_CORE}/v1/tenants`, {
      headers: authHeaders(operatorToken),
      data: { name: 'Unauthorized Tenant', slug: 'unauth', plan: 'starter', region: 'us-east-1' },
    });

    expect(res.status()).toBeGreaterThanOrEqual(403);
  });

  // ─── Role-Based Menu Visibility ─────────────────────────────────────────

  test('should show admin menu items only for admin users', async ({ page }) => {
    await loginViaUI(page, TEST_ADMIN.email, TEST_ADMIN.password);

    const adminMenu = page.locator(
      'a[href*="tenants"], [data-testid="nav-tenants"], mat-list-item',
    ).filter({ hasText: /tenants|inquilinos/i });

    await expect(adminMenu).toBeVisible({ timeout: 10_000 });
  });

  test('should hide admin menu items from operator users', async ({ page }) => {
    await loginViaUI(page, TEST_OPERATOR.email, TEST_OPERATOR.password);

    const adminMenu = page.locator(
      'a[href*="tenants"], [data-testid="nav-tenants"]',
    ).filter({ hasText: /tenants|inquilinos/i });

    const isVisible = await adminMenu.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(isVisible).toBeFalsy();
  });

  test('should show limited navigation for viewer role', async ({ page }) => {
    await loginViaUI(page, TEST_VIEWER.email, TEST_VIEWER.password);

    const navItems = page.locator('mat-nav-list a, nav a, [data-testid^="nav-"]');
    const count = await navItems.count();

    expect(count).toBeGreaterThan(0);

    const createOrderBtn = page.getByRole('button', { name: /new order|criar pedido/i });
    const canCreate = await createOrderBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(canCreate).toBeFalsy();
  });
});
