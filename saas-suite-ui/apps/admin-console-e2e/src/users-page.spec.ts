import { test, expect } from './fixtures';
import { loginWithQuickProfile } from './dev-login.helper';

test.describe('Usuários', () => {
  test('lista utilizadores após login dev', async ({ page }) => {
    await loginWithQuickProfile(page, 'Super Admin');
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: /Usuários|Users/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/e2e\.user@mock\.local/i)).toBeVisible({ timeout: 10000 });
  });
});
