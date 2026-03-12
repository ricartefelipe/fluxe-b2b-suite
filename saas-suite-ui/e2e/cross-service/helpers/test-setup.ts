import { type APIRequestContext, type Page, expect } from '@playwright/test';

const API_CORE = '/api/core';
const API_ORDERS = '/api/orders';
const API_PAYMENTS = '/api/payments';

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthToken {
  accessToken: string;
  expiresIn: number;
}

export async function loginAs(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<AuthToken> {
  const res = await request.post(`${API_CORE}/v1/auth/login`, {
    data: { email, password },
  });
  expect(res.ok(), `Login failed for ${email}: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  return { accessToken: body.access_token ?? body.accessToken, expiresIn: body.expires_in ?? 3600 };
}

export async function loginViaUI(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password|senha/i).fill(password);
  await page.getByRole('button', { name: /sign in|login|entrar/i }).click();
  await page.waitForURL(/dashboard|tenants|orders/, { timeout: 15_000 });
}

export function authHeaders(token: AuthToken): Record<string, string> {
  return { Authorization: `Bearer ${token.accessToken}` };
}

// ─── Tenant ──────────────────────────────────────────────────────────────────

export interface TestTenant {
  id: string;
  name: string;
  slug: string;
}

export async function createTestTenant(
  request: APIRequestContext,
  token: AuthToken,
  overrides: Partial<{ name: string; slug: string; plan: string; region: string }> = {},
): Promise<TestTenant> {
  const suffix = Date.now().toString(36);
  const name = overrides.name ?? `e2e-tenant-${suffix}`;
  const slug = overrides.slug ?? `e2e-${suffix}`;

  const res = await request.post(`${API_CORE}/v1/tenants`, {
    headers: authHeaders(token),
    data: {
      name,
      slug,
      plan: overrides.plan ?? 'starter',
      region: overrides.region ?? 'us-east-1',
    },
  });
  expect(res.ok(), `Create tenant failed: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  return { id: body.id, name, slug };
}

export async function deleteTenant(
  request: APIRequestContext,
  token: AuthToken,
  tenantId: string,
): Promise<void> {
  await request.delete(`${API_CORE}/v1/tenants/${tenantId}`, {
    headers: authHeaders(token),
  });
}

export async function suspendTenant(
  request: APIRequestContext,
  token: AuthToken,
  tenantId: string,
): Promise<void> {
  const res = await request.patch(`${API_CORE}/v1/tenants/${tenantId}/suspend`, {
    headers: authHeaders(token),
  });
  expect(res.ok(), `Suspend tenant failed: ${res.status()}`).toBeTruthy();
}

export async function reactivateTenant(
  request: APIRequestContext,
  token: AuthToken,
  tenantId: string,
): Promise<void> {
  const res = await request.patch(`${API_CORE}/v1/tenants/${tenantId}/reactivate`, {
    headers: authHeaders(token),
  });
  expect(res.ok(), `Reactivate tenant failed: ${res.status()}`).toBeTruthy();
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface TestOrder {
  id: string;
  status: string;
  totalAmount: number;
}

export async function createOrder(
  request: APIRequestContext,
  token: AuthToken,
  tenantId: string,
  items: OrderItem[],
): Promise<TestOrder> {
  const res = await request.post(`${API_ORDERS}/v1/orders`, {
    headers: {
      ...authHeaders(token),
      'X-Tenant-Id': tenantId,
    },
    data: { items },
  });
  expect(res.ok(), `Create order failed: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  return {
    id: body.id,
    status: body.status,
    totalAmount: body.totalAmount ?? body.total_amount,
  };
}

export async function getOrder(
  request: APIRequestContext,
  token: AuthToken,
  tenantId: string,
  orderId: string,
): Promise<TestOrder> {
  const res = await request.get(`${API_ORDERS}/v1/orders/${orderId}`, {
    headers: {
      ...authHeaders(token),
      'X-Tenant-Id': tenantId,
    },
  });
  expect(res.ok(), `Get order failed: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  return { id: body.id, status: body.status, totalAmount: body.totalAmount ?? body.total_amount };
}

export async function confirmOrder(
  request: APIRequestContext,
  token: AuthToken,
  tenantId: string,
  orderId: string,
): Promise<void> {
  const res = await request.patch(`${API_ORDERS}/v1/orders/${orderId}/confirm`, {
    headers: { ...authHeaders(token), 'X-Tenant-Id': tenantId },
  });
  expect(res.ok(), `Confirm order failed: ${res.status()}`).toBeTruthy();
}

export async function cancelOrder(
  request: APIRequestContext,
  token: AuthToken,
  tenantId: string,
  orderId: string,
): Promise<void> {
  const res = await request.patch(`${API_ORDERS}/v1/orders/${orderId}/cancel`, {
    headers: { ...authHeaders(token), 'X-Tenant-Id': tenantId },
  });
  expect(res.ok(), `Cancel order failed: ${res.status()}`).toBeTruthy();
}

export async function shipOrder(
  request: APIRequestContext,
  token: AuthToken,
  tenantId: string,
  orderId: string,
  trackingCode: string,
): Promise<void> {
  const res = await request.patch(`${API_ORDERS}/v1/orders/${orderId}/ship`, {
    headers: { ...authHeaders(token), 'X-Tenant-Id': tenantId },
    data: { trackingCode },
  });
  expect(res.ok(), `Ship order failed: ${res.status()}`).toBeTruthy();
}

export async function deliverOrder(
  request: APIRequestContext,
  token: AuthToken,
  tenantId: string,
  orderId: string,
): Promise<void> {
  const res = await request.patch(`${API_ORDERS}/v1/orders/${orderId}/deliver`, {
    headers: { ...authHeaders(token), 'X-Tenant-Id': tenantId },
  });
  expect(res.ok(), `Deliver order failed: ${res.status()}`).toBeTruthy();
}

// ─── Products / Inventory ────────────────────────────────────────────────────

export interface TestProduct {
  id: string;
  name: string;
  sku: string;
}

export async function createProduct(
  request: APIRequestContext,
  token: AuthToken,
  tenantId: string,
  product: { name: string; sku: string; price: number; category?: string },
): Promise<TestProduct> {
  const res = await request.post(`${API_ORDERS}/v1/products`, {
    headers: { ...authHeaders(token), 'X-Tenant-Id': tenantId },
    data: product,
  });
  expect(res.ok(), `Create product failed: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  return { id: body.id, name: body.name, sku: body.sku };
}

export async function addInventory(
  request: APIRequestContext,
  token: AuthToken,
  tenantId: string,
  productId: string,
  quantity: number,
): Promise<void> {
  const res = await request.post(`${API_ORDERS}/v1/products/${productId}/inventory`, {
    headers: { ...authHeaders(token), 'X-Tenant-Id': tenantId },
    data: { quantity },
  });
  expect(res.ok(), `Add inventory failed: ${res.status()}`).toBeTruthy();
}

export async function getInventory(
  request: APIRequestContext,
  token: AuthToken,
  tenantId: string,
  productId: string,
): Promise<number> {
  const res = await request.get(`${API_ORDERS}/v1/products/${productId}/inventory`, {
    headers: { ...authHeaders(token), 'X-Tenant-Id': tenantId },
  });
  expect(res.ok(), `Get inventory failed: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  return body.quantity ?? body.available;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export interface TestPayment {
  id: string;
  orderId: string;
  status: string;
  amount: number;
}

export async function getPaymentByOrder(
  request: APIRequestContext,
  token: AuthToken,
  tenantId: string,
  orderId: string,
): Promise<TestPayment | null> {
  const res = await request.get(`${API_PAYMENTS}/v1/payments`, {
    headers: { ...authHeaders(token), 'X-Tenant-Id': tenantId },
    params: { orderId },
  });
  if (!res.ok()) return null;
  const body = await res.json();
  const payments = Array.isArray(body) ? body : body.items ?? body.data ?? [];
  const match = payments.find(
    (p: Record<string, unknown>) => p.orderId === orderId || p.order_id === orderId,
  );
  return match
    ? { id: match.id, orderId, status: match.status, amount: match.amount }
    : null;
}

// ─── Feature Flags & Policies ────────────────────────────────────────────────

export async function setFeatureFlag(
  request: APIRequestContext,
  token: AuthToken,
  tenantId: string,
  flag: { key: string; enabled: boolean },
): Promise<void> {
  const res = await request.put(`${API_CORE}/v1/tenants/${tenantId}/flags/${flag.key}`, {
    headers: authHeaders(token),
    data: { enabled: flag.enabled },
  });
  expect(res.ok(), `Set flag ${flag.key} failed: ${res.status()}`).toBeTruthy();
}

export async function addPolicy(
  request: APIRequestContext,
  token: AuthToken,
  tenantId: string,
  policy: { resource: string; action: string; effect: 'ALLOW' | 'DENY'; conditions?: Record<string, unknown> },
): Promise<string> {
  const res = await request.post(`${API_CORE}/v1/tenants/${tenantId}/policies`, {
    headers: authHeaders(token),
    data: policy,
  });
  expect(res.ok(), `Add policy failed: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  return body.id;
}

// ─── Timing ──────────────────────────────────────────────────────────────────

export async function waitForEventPropagation(ms = 2_000): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pollUntil<T>(
  fn: () => Promise<T>,
  predicate: (result: T) => boolean,
  { interval = 1_000, timeout = 15_000 } = {},
): Promise<T> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = await fn();
    if (predicate(result)) return result;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(`pollUntil timed out after ${timeout}ms`);
}

// ─── Test Credentials ────────────────────────────────────────────────────────

export const TEST_ADMIN = {
  email: process.env['E2E_ADMIN_EMAIL'] ?? 'admin@fluxe.test',
  password: process.env['E2E_ADMIN_PASSWORD'] ?? 'admin123',
};

export const TEST_OPERATOR = {
  email: process.env['E2E_OPERATOR_EMAIL'] ?? 'operator@fluxe.test',
  password: process.env['E2E_OPERATOR_PASSWORD'] ?? 'operator123',
};

export const TEST_VIEWER = {
  email: process.env['E2E_VIEWER_EMAIL'] ?? 'viewer@fluxe.test',
  password: process.env['E2E_VIEWER_PASSWORD'] ?? 'viewer123',
};
