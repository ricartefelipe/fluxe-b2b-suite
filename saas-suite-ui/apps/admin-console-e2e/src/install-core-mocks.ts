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

  /** Utilizadores e subscrição — chamados após login (header / billing). */
  await page.route('**/api/core/v1/users**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await fulfillJson(route, [] as Array<{ id: string }>);
  });

  await page.route('**/api/core/v1/subscriptions/current**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await fulfillJson(route, mockSubscriptionCurrent);
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
