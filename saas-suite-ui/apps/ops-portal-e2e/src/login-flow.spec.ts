import { test, expect } from './fixtures';
import { loginWithQuickProfile } from './dev-login.helper';

test.describe('Ops Portal Login', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/login/);
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Bem-vindo de volta/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Credenciais/i })).toBeVisible();
  });

  test('should login with dev credentials', async ({ page }) => {
    await loginWithQuickProfile(page, 'Ops User');
    await expect(page).toHaveURL(/(dashboard|orders)/, { timeout: 15000 });
  });
});
