import { test, expect } from './fixtures';
import { loginWithQuickProfile } from './dev-login.helper';

test.describe('Faturamento', () => {
  test('carrega Faturamento após login dev', async ({ page }) => {
    await loginWithQuickProfile(page, 'Super Admin');
    await page.goto('/billing');
    await expect(page.getByRole('heading', { name: /Faturamento|Billing/i })).toBeVisible({
      timeout: 15000,
    });
  });
});
