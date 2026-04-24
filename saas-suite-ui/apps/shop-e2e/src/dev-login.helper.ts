import type { Page } from '@playwright/test';

export async function dismissCookieBanner(page: Page): Promise<void> {
  await page
    .getByRole('button', { name: /Entendi/i })
    .click({ timeout: 3000 })
    .catch(() => undefined);
}

/** E2E: mock em `installShopOrdersApiMocks` devolve o JWT consoante o e-mail. */
const DEV_LOGIN_E2E: Record<
  'Super Admin' | 'Ops User' | 'Viewer',
  { email: string; password: string }
> = {
  Viewer: { email: 'viewer@e2e.local', password: 'e2e' },
  'Ops User': { email: 'ops@e2e.local', password: 'e2e' },
  'Super Admin': { email: 'admin@e2e.local', password: 'e2e' },
};

/**
 * Login no ecrã de dev (e-mail + senha). Em CI os POST /v1/auth/login são
 * intercetados pelos mocks E2E (sem Core em :8080).
 */
export async function loginWithQuickProfile(
  page: Page,
  profileLabel: 'Super Admin' | 'Ops User' | 'Viewer'
): Promise<void> {
  const { email, password } = DEV_LOGIN_E2E[profileLabel];
  await page.goto('/login');
  await dismissCookieBanner(page);
  await page.getByLabel(/Email/i).fill(email);
  await page.getByLabel(/Senha/i).fill(password);
  await page.getByRole('button', { name: /Acessar/i }).click();
  await page.waitForURL(/\/products/, { timeout: 30000 });
}
