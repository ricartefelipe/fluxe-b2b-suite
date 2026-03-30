import { test, expect } from './fixtures';
import { loginWithQuickProfile } from './dev-login.helper';

test.describe('Governança: políticas, auditoria, flags', () => {
  test('políticas — título e área carregam', async ({ page }) => {
    await loginWithQuickProfile(page, 'Super Admin');
    await page.goto('/policies');
    await expect(
      page.getByRole('heading', { name: /Políticas|Policies|\(ABAC/i }),
    ).toBeVisible({ timeout: 15000 });
  });

  test('auditoria — título e área carregam', async ({ page }) => {
    await loginWithQuickProfile(page, 'Super Admin');
    await page.goto('/audit');
    await expect(page.getByRole('heading', { name: /Auditoria|Audit|Log/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test('feature flags — título e área carregam', async ({ page }) => {
    await loginWithQuickProfile(page, 'Super Admin');
    await page.goto('/flags');
    await expect(
      page.getByRole('heading', { name: /Feature Flags|Flags/i }),
    ).toBeVisible({ timeout: 15000 });
  });
});
