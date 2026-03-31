import { test, expect } from './fixtures';
import { loginWithQuickProfile } from './dev-login.helper';

test.describe('Detalhe do tenant', () => {
  test('carrega tenant por id (mock Core)', async ({ page }) => {
    await loginWithQuickProfile(page, 'Super Admin');
    await page.goto('/tenants/e2e-detail-0001-0002-0003-0004-0005');
    await expect(page.getByRole('heading', { name: 'Tenant E2E' })).toBeVisible({ timeout: 15000 });
  });
});
