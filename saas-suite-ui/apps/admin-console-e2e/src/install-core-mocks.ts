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

const E2E_TENANT_DEMO = '00000000-0000-0000-0000-000000000002';
const E2E_TENANT_PLATFORM = '00000000-0000-0000-0000-000000000001';

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

/**
 * Mock do core (dev token) para E2E sem spring-saas-core em :8080.
 */
const emptyPage = { data: [] as unknown[], total: 0, page: 0, pageSize: 0 };

/** Alinhado a `Subscription` em libs/data-access/core (billing.model). */
const mockSubscriptionCurrent = {
  id: 'sub-e2e-mock',
  tenantId: '00000000-0000-0000-0000-000000000001',
  planSlug: 'starter',
  status: 'ACTIVE',
  currentPeriodStart: '2025-01-01T00:00:00.000Z',
  currentPeriodEnd: '2030-12-31T23:59:59.000Z',
  createdAt: '2025-01-01T00:00:00.000Z',
};

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

const mockUsersList = [
  {
    id: 'user-e2e-1',
    tenantId: '00000000-0000-0000-0000-000000000001',
    name: 'Utilizador E2E',
    email: 'e2e.user@mock.local',
    roles: ['admin'],
    status: 'ACTIVE',
    createdAt: '2025-01-15T12:00:00.000Z',
    updatedAt: '2025-01-15T12:00:00.000Z',
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

  await page.route(/\/v1\/auth\/login$/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    let email = 'admin@e2e.local';
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

  /**
   * Tenants: CRUD parcial, health, export, flags (CRUD) — onboarding e detalhe.
   */
  await page.route('**/api/core/v1/tenants**', async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname.replace(/\/$/, '');
    const method = route.request().method();
    const parts = pathname.split('/').filter(Boolean);
    const ti = parts.indexOf('tenants');
    const tail = ti >= 0 ? parts.slice(ti + 1) : [];

    if (method === 'GET' && tail.length === 0) {
      await fulfillJson(route, emptyPage);
      return;
    }
    if (method === 'POST' && tail.length === 0) {
      let body: Record<string, unknown> = {};
      try {
        const raw = route.request().postData();
        if (raw) body = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        body = {};
      }
      const id = `e2e-tenant-${Date.now()}`;
      await fulfillJson(route, {
        id,
        name: String(body['name'] ?? 'E2E Tenant'),
        plan: (body['plan'] as string) ?? 'starter',
        region: String(body['region'] ?? 'us-east-1'),
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return;
    }
    if (method === 'PATCH' && tail.length === 1) {
      let body: Record<string, unknown> = {};
      try {
        const raw = route.request().postData();
        if (raw) body = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        body = {};
      }
      const id = tail[0];
      await fulfillJson(route, {
        id,
        name: String(body['name'] ?? 'Tenant E2E'),
        plan: (body['plan'] as string) ?? 'starter',
        region: 'us-east-1',
        status: 'ACTIVE',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
      });
      return;
    }
    if (method === 'GET' && tail.length === 2 && tail[1] === 'health') {
      await fulfillJson(route, {
        tenantId: tail[0],
        lastActivityAt: null,
        activeUsersCount: 0,
      });
      return;
    }
    if (method === 'GET' && tail.length === 2 && tail[1] === 'export') {
      await fulfillJson(route, { mock: 'e2e-tenant-export' });
      return;
    }
    if (tail.length >= 2 && tail[1] === 'flags') {
      const tenantId = tail[0];
      if (method === 'GET' && tail.length === 2) {
        await fulfillJson(route, []);
        return;
      }
      if (method === 'POST' && tail.length === 2) {
        let body: Record<string, unknown> = {};
        try {
          const raw = route.request().postData();
          if (raw) body = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          body = {};
        }
        const name = String(body['name'] ?? 'e2e_flag');
        await fulfillJson(route, {
          id: 'flag-e2e-id',
          tenantId,
          name,
          enabled: Boolean(body['enabled'] ?? true),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return;
      }
      if (method === 'PATCH' && tail.length === 3) {
        await fulfillJson(route, {
          id: 'flag-e2e-id',
          tenantId,
          name: tail[2],
          enabled: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: new Date().toISOString(),
        });
        return;
      }
      if (method === 'DELETE' && tail.length === 3) {
        await route.fulfill({ status: 204 });
        return;
      }
      await route.continue();
      return;
    }
    if (method === 'GET' && tail.length === 1) {
      const id = tail[0];
      await fulfillJson(route, {
        id,
        name: 'Tenant E2E',
        plan: 'starter',
        region: 'us-east-1',
        status: 'ACTIVE',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      return;
    }
    await route.continue();
  });

  await page.route('**/api/core/v1/policies**', async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname.replace(/\/$/, '');
    const method = route.request().method();
    const parts = pathname.split('/').filter(Boolean);
    const pi = parts.indexOf('policies');
    const tail = pi >= 0 ? parts.slice(pi + 1) : [];

    if (method === 'GET' && tail.length === 0) {
      await fulfillJson(route, emptyPage);
      return;
    }
    if (method === 'GET' && tail.length === 1) {
      await fulfillJson(route, {
        id: tail[0],
        permissionCode: 'e2e:read',
        effect: 'ALLOW',
        enabled: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      return;
    }
    if (method === 'POST' && tail.length === 0) {
      let body: Record<string, unknown> = {};
      try {
        const raw = route.request().postData();
        if (raw) body = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        body = {};
      }
      await fulfillJson(route, {
        id: `pol-e2e-${Date.now()}`,
        permissionCode: String(body['permissionCode'] ?? 'e2e:mock'),
        effect: (body['effect'] as string) === 'DENY' ? 'DENY' : 'ALLOW',
        enabled: Boolean(body['enabled'] ?? true),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return;
    }
    if (method === 'PATCH' && tail.length === 1) {
      let body: Record<string, unknown> = {};
      try {
        const raw = route.request().postData();
        if (raw) body = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        body = {};
      }
      await fulfillJson(route, {
        id: tail[0],
        permissionCode: 'e2e:read',
        effect: 'ALLOW',
        enabled: body['enabled'] !== false,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
      });
      return;
    }
    if (method === 'DELETE' && tail.length === 1) {
      await route.fulfill({ status: 204 });
      return;
    }
    await route.continue();
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

  /** Utilizadores: lista, convite, edição, reenvio, remoção. */
  await page.route('**/api/core/v1/users**', async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname.replace(/\/$/, '');
    const method = route.request().method();
    const parts = pathname.split('/').filter(Boolean);
    const ui = parts.indexOf('users');
    const tail = ui >= 0 ? parts.slice(ui + 1) : [];

    if (method === 'GET' && tail.length === 0) {
      await fulfillJson(route, mockUsersList);
      return;
    }
    if (method === 'POST' && tail.length === 1 && tail[0] === 'invite') {
      let body: Record<string, unknown> = {};
      try {
        const raw = route.request().postData();
        if (raw) body = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        body = {};
      }
      await fulfillJson(route, {
        id: `user-e2e-${Date.now()}`,
        tenantId: '00000000-0000-0000-0000-000000000001',
        name: String(body['name'] ?? 'E2E'),
        email: String(body['email'] ?? 'invite@mock.local'),
        roles: Array.isArray(body['roles']) ? body['roles'] : ['member'],
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        temporaryPassword: null,
      });
      return;
    }
    if (method === 'PATCH' && tail.length === 1) {
      let body: Record<string, unknown> = {};
      try {
        const raw = route.request().postData();
        if (raw) body = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        body = {};
      }
      await fulfillJson(route, {
        id: tail[0],
        tenantId: '00000000-0000-0000-0000-000000000001',
        name: String(body['name'] ?? 'Atualizado E2E'),
        email: 'e2e.user@mock.local',
        roles: Array.isArray(body['roles']) ? body['roles'] : ['admin'],
        status: String(body['status'] ?? 'ACTIVE'),
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
      });
      return;
    }
    if (method === 'POST' && tail.length === 2 && tail[1] === 'resend-invite') {
      await fulfillJson(route, {});
      return;
    }
    if (method === 'DELETE' && tail.length === 1) {
      await route.fulfill({ status: 204 });
      return;
    }
    await route.continue();
  });

  await page.route('**/api/core/v1/subscriptions/current**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await fulfillJson(route, mockSubscriptionCurrent);
  });

  await page.route('**/api/core/v1/billing/portal-session**', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await fulfillJson(route, { url: '/billing' });
  });

  await page.route('**/api/core/v1/subscriptions/trial**', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await fulfillJson(route, {
      ...mockSubscriptionCurrent,
      status: 'TRIAL',
      trialEndsAt: '2030-12-31T23:59:59.000Z',
    });
  });

  await page.route('**/api/core/v1/subscriptions/schedule-cancel**', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await fulfillJson(route, { ...mockSubscriptionCurrent, cancelAtPeriodEnd: true });
  });

  await page.route('**/api/core/v1/subscriptions/undo-schedule-cancel**', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await fulfillJson(route, { ...mockSubscriptionCurrent, cancelAtPeriodEnd: false });
  });

  /** Assistente IA — sem Core real, evita falhas e permite smoke E2E. */
  await page.route('**/api/core/v1/ai/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (url.includes('/v1/ai/status') && method === 'GET') {
      await fulfillJson(route, {
        engine: 'rule-engine',
        provider: 'built-in',
        model: 'rule-based-v1',
        capabilities: [
          'audit-analysis',
          'governance-recommendations',
          'chat-assistant',
          'system-insights',
          'anomaly-detection',
        ],
        aiEnabledProperty: false,
        openaiKeyConfigured: true,
      });
      return;
    }
    if (url.includes('/v1/ai/chat') && method === 'POST') {
      await fulfillJson(route, {
        answer: 'Resposta mock E2E — Core não está em execução.',
        intent: 'rule-engine',
        suggestions: [] as string[],
      });
      return;
    }
    if (url.includes('/v1/ai/analyze-audit') && method === 'POST') {
      await fulfillJson(route, {
        engine: 'rule-engine',
        content: '## Análise de auditoria (mock E2E)\nMotor de regras.',
        context: {} as Record<string, unknown>,
      });
      return;
    }
    if (url.includes('/v1/ai/recommendations') && method === 'POST') {
      await fulfillJson(route, {
        engine: 'rule-engine',
        content: '## Recomendações (mock E2E)',
        context: {} as Record<string, unknown>,
      });
      return;
    }
    if (url.includes('/v1/ai/insights') && method === 'GET') {
      await fulfillJson(route, {
        engine: 'rule-engine',
        content: null,
        context: {
          insights: [
            {
              severity: 'info',
              title: 'Mock E2E',
              description: 'Insight de teste sem spring-saas-core.',
            },
          ],
          generatedAt: new Date().toISOString(),
        },
      });
      return;
    }
    await route.continue();
  });
}
