import type { Page } from '@playwright/test';

export async function dismissCookieBanner(page: Page): Promise<void> {
  await page
    .getByRole('button', { name: /Entendi/i })
    .click({ timeout: 3000 })
    .catch(() => undefined);
}

const DEV_LOGIN_E2E: Record<
  'Super Admin' | 'Ops User' | 'Viewer',
  { email: string; password: string }
> = {
  Viewer: { email: 'viewer@e2e.local', password: 'e2e' },
  'Ops User': { email: 'ops@e2e.local', password: 'e2e' },
  'Super Admin': { email: 'admin@e2e.local', password: 'e2e' },
};

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
  await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 30000 });
}
