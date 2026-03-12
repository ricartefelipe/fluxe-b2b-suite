import { test, expect } from '@playwright/test';
import {
  type AuthToken,
  type TestTenant,
  type TestProduct,
  type TestOrder,
  TEST_ADMIN,
  TEST_OPERATOR,
  loginAs,
  loginViaUI,
  createTestTenant,
  deleteTenant,
  createProduct,
  addInventory,
  getInventory,
  createOrder,
  getOrder,
  confirmOrder,
  cancelOrder,
  shipOrder,
  deliverOrder,
  getPaymentByOrder,
  authHeaders,
  waitForEventPropagation,
  pollUntil,
} from '../helpers/test-setup';

let adminToken: AuthToken;
let operatorToken: AuthToken;
let tenant: TestTenant;
let productA: TestProduct;
let productB: TestProduct;

const INITIAL_STOCK = 50;

test.describe('Order Saga — Cross-Service E2E', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    adminToken = await loginAs(request, TEST_ADMIN.email, TEST_ADMIN.password);
    operatorToken = await loginAs(request, TEST_OPERATOR.email, TEST_OPERATOR.password);

    tenant = await createTestTenant(request, adminToken);

    productA = await createProduct(request, operatorToken, tenant.id, {
      name: 'Widget Alpha',
      sku: `WA-${Date.now()}`,
      price: 29.99,
      category: 'widgets',
    });

    productB = await createProduct(request, operatorToken, tenant.id, {
      name: 'Gadget Beta',
      sku: `GB-${Date.now()}`,
      price: 49.99,
      category: 'gadgets',
    });

    await addInventory(request, operatorToken, tenant.id, productA.id, INITIAL_STOCK);
    await addInventory(request, operatorToken, tenant.id, productB.id, INITIAL_STOCK);
  });

  test.afterAll(async ({ request }) => {
    if (tenant?.id) {
      await deleteTenant(request, adminToken, tenant.id).catch(() => {});
    }
  });

  // ─── Test 1: Create → Confirm → Verify Payment ──────────────────────────

  let orderForPayment: TestOrder;

  test('should create an order via ops-portal UI', async ({ page }) => {
    await loginViaUI(page, TEST_OPERATOR.email, TEST_OPERATOR.password);
    await page.goto('/orders/new');

    await expect(page.locator('form, mat-form-field').first()).toBeVisible();

    const tenantSelector = page.locator(
      '[data-testid="tenant-select"], mat-select[formControlName="tenantId"]',
    );
    if (await tenantSelector.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await tenantSelector.click();
      await page.getByRole('option', { name: new RegExp(tenant.name, 'i') }).click();
    }

    const addItemBtn = page.getByRole('button', { name: /add item|adicionar/i });
    await addItemBtn.click();

    const productInput = page
      .locator('[data-testid="product-select"], mat-select[formControlName="productId"]')
      .last();
    await productInput.click();
    await page.getByRole('option', { name: /widget alpha/i }).click();

    const qtyInput = page
      .locator('input[formControlName="quantity"], [data-testid="quantity-input"]')
      .last();
    await qtyInput.fill('3');

    await page.getByRole('button', { name: /submit|create|criar/i }).click();

    await expect(page.locator('[data-testid="order-id"], .order-id')).toBeVisible({
      timeout: 10_000,
    });
    const orderId = await page
      .locator('[data-testid="order-id"], .order-id')
      .textContent();
    expect(orderId).toBeTruthy();
  });

  test('should verify created order appears in orders list', async ({ page, request }) => {
    orderForPayment = await createOrder(request, operatorToken, tenant.id, [
      { productId: productA.id, quantity: 2, unitPrice: 29.99 },
      { productId: productB.id, quantity: 1, unitPrice: 49.99 },
    ]);

    await loginViaUI(page, TEST_OPERATOR.email, TEST_OPERATOR.password);
    await page.goto('/orders');

    await expect(page.locator('table, mat-table').first()).toBeVisible({ timeout: 10_000 });

    const orderRow = page.locator('tr, mat-row').filter({ hasText: orderForPayment.id });
    await expect(orderRow).toBeVisible({ timeout: 10_000 });
  });

  test('should confirm order and verify payment is created', async ({ request }) => {
    await confirmOrder(request, operatorToken, tenant.id, orderForPayment.id);
    await waitForEventPropagation(3_000);

    const payment = await pollUntil(
      () => getPaymentByOrder(request, operatorToken, tenant.id, orderForPayment.id),
      (p) => p !== null,
      { timeout: 15_000 },
    );

    expect(payment).not.toBeNull();
    expect(payment!.orderId).toBe(orderForPayment.id);
    expect(payment!.status).toMatch(/pending|created|authorized/i);
  });

  // ─── Test 2: Ship → Track → Deliver ─────────────────────────────────────

  let orderForShipping: TestOrder;

  test('should ship order and verify tracking info', async ({ request, page }) => {
    orderForShipping = await createOrder(request, operatorToken, tenant.id, [
      { productId: productA.id, quantity: 1, unitPrice: 29.99 },
    ]);
    await confirmOrder(request, operatorToken, tenant.id, orderForShipping.id);
    await waitForEventPropagation();

    const trackingCode = `TRACK-${Date.now()}`;
    await shipOrder(request, operatorToken, tenant.id, orderForShipping.id, trackingCode);

    const updated = await getOrder(request, operatorToken, tenant.id, orderForShipping.id);
    expect(updated.status).toMatch(/shipped|in_transit/i);

    await loginViaUI(page, TEST_OPERATOR.email, TEST_OPERATOR.password);
    await page.goto(`/orders/${orderForShipping.id}`);

    await expect(
      page.locator('[data-testid="tracking-code"], .tracking-code'),
    ).toContainText(trackingCode, { timeout: 10_000 });
  });

  test('should deliver order and verify final status', async ({ request, page }) => {
    await deliverOrder(request, operatorToken, tenant.id, orderForShipping.id);

    const delivered = await getOrder(request, operatorToken, tenant.id, orderForShipping.id);
    expect(delivered.status).toMatch(/delivered|completed/i);

    await loginViaUI(page, TEST_OPERATOR.email, TEST_OPERATOR.password);
    await page.goto(`/orders/${orderForShipping.id}`);

    const statusBadge = page.locator(
      '[data-testid="order-status"], .order-status, mat-chip',
    );
    await expect(statusBadge).toContainText(/delivered|entregue|completed/i, {
      timeout: 10_000,
    });
  });

  // ─── Test 3: Cancel → Verify Inventory Restored → Payment Voided ────────

  test('should cancel order and verify inventory restoration and payment void', async ({
    request,
  }) => {
    const stockBefore = await getInventory(
      request,
      operatorToken,
      tenant.id,
      productA.id,
    );

    const orderToCancel = await createOrder(request, operatorToken, tenant.id, [
      { productId: productA.id, quantity: 5, unitPrice: 29.99 },
    ]);
    await confirmOrder(request, operatorToken, tenant.id, orderToCancel.id);
    await waitForEventPropagation();

    const stockAfterConfirm = await getInventory(
      request,
      operatorToken,
      tenant.id,
      productA.id,
    );
    expect(stockAfterConfirm).toBeLessThan(stockBefore);

    await cancelOrder(request, operatorToken, tenant.id, orderToCancel.id);
    await waitForEventPropagation(3_000);

    const stockAfterCancel = await pollUntil(
      () => getInventory(request, operatorToken, tenant.id, productA.id),
      (qty) => qty >= stockBefore,
      { timeout: 15_000 },
    );
    expect(stockAfterCancel).toBeGreaterThanOrEqual(stockBefore);

    const payment = await getPaymentByOrder(
      request,
      operatorToken,
      tenant.id,
      orderToCancel.id,
    );
    if (payment) {
      expect(payment.status).toMatch(/voided|cancelled|refunded/i);
    }
  });
});
