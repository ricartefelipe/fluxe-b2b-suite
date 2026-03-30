import { test, expect } from './fixtures';
import { loginWithQuickProfile } from './dev-login.helper';

test.describe('Fluxos estendidos (smoke)', () => {
  test('novo tenant — formulário de criação', async ({ page }) => {
    await loginWithQuickProfile(page, 'Super Admin');
    await page.goto('/tenants/new');
    await expect(
      page.getByRole('heading', { name: /Novo Tenant|New Tenant/i }),
    ).toBeVisible({ timeout: 15000 });
  });

  test('ajuda — página carrega', async ({ page }) => {
    await loginWithQuickProfile(page, 'Super Admin');
    await page.goto('/help');
    await expect(page.getByRole('heading', { name: /Ajuda|Help/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test('políticas — criar policy (mock Core)', async ({ page }) => {
    await loginWithQuickProfile(page, 'Super Admin');
    await page.goto('/policies');
    await page.getByRole('button', { name: /Nova Policy|New Policy/i }).click();
    await page.getByLabel(/Permission Code/i).fill('e2e_smoke_policy');
    await page.locator('form.create-form').getByRole('button', { name: /Criar|Create/i }).click();
    await expect(page.getByText(/Policy criada|Policy created/i)).toBeVisible({ timeout: 10000 });
    await expect(page.locator('td').filter({ hasText: 'e2e_smoke_policy' })).toBeVisible();
  });

  test('flags — criar flag com tenant ativo (JWT + fallback)', async ({ page }) => {
    await loginWithQuickProfile(page, 'Super Admin');
    await page.goto('/flags');
    await expect(
      page.getByRole('status', { name: /Nenhuma flag encontrada|No flags found/i }),
    ).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /Nova Flag|New Flag/i }).click({ timeout: 15000 });
    const flagNameInput = page.locator('.create-form input[matInput]');
    await flagNameInput.fill('e2e_smoke_flag');
    await expect(flagNameInput).toHaveValue('e2e_smoke_flag');
    const postFlag = page.waitForResponse(
      (r) =>
        r.request().method() === 'POST' &&
        r.url().includes('/v1/tenants/') &&
        r.url().includes('/flags') &&
        r.status() === 200,
    );
    await page.locator('.create-form').getByRole('button', { name: /^(Criar|Create)$/i }).click();
    await postFlag;
    await expect(page.getByText(/Flag criada|Flag created/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: 'e2e_smoke_flag' })).toBeVisible({ timeout: 15000 });
  });
});
