import { test, expect } from './fixtures';
import { loginWithQuickProfile } from './dev-login.helper';

test.describe('Admin Console Login', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/login/);
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Bem-vindo de volta/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Acessar$/i })).toBeVisible();
  });

  test('should login with dev credentials', async ({ page }) => {
    await loginWithQuickProfile(page, 'Super Admin');
    await expect(page).toHaveURL(/(home|tenants|dashboard|onboarding)/, { timeout: 15000 });
  });
});
