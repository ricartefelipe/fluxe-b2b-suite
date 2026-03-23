import type { Page } from '@playwright/test';

export async function dismissCookieBanner(page: Page): Promise<void> {
  await page
    .getByRole('button', { name: /Entendi/i })
    .click({ timeout: 3000 })
    .catch(() => undefined);
}

/**
 * Login via aba "Perfis Rápidos" (modo dev do lib-dev-login).
 * Usa JWT local se a API /v1/dev/token não estiver disponível.
 */
export async function loginWithQuickProfile(
  page: Page,
  profileLabel: 'Super Admin' | 'Ops User' | 'Viewer'
): Promise<void> {
  await page.goto('/login');
  await dismissCookieBanner(page);
  await page.getByRole('tab', { name: /Perfis Rápidos/i }).click();
  await page.locator('button.profile-card').filter({ hasText: profileLabel }).click();
  await page.getByRole('button', { name: /^Entrar$/i }).click();
  // O shop redireciona para /products após sessão válida; evita falso positivo em `/` antes do guard.
  await page.waitForURL(/\/products/, { timeout: 30000 });
}
