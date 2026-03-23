import { test, expect } from './fixtures';
import { loginWithQuickProfile } from './dev-login.helper';

test.describe('Orders History', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithQuickProfile(page, 'Viewer');
  });

  test('should display orders page', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/orders/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should show order cards or empty state', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('.order-card, .empty-state').first()).toBeVisible({
      timeout: 20000,
    });
  });
});
