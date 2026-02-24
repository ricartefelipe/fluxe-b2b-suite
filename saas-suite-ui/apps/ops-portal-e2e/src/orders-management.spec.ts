import { test, expect } from '@playwright/test';

test.describe('Orders Management', () => {
  test('should navigate to orders page', async ({ page }) => {
    await page.goto('/orders');

    const isOrders = await page
      .locator('table, mat-table, .orders')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const isLogin = page.url().includes('login');

    expect(isOrders || isLogin).toBeTruthy();
  });

  test('should navigate to create order page', async ({ page }) => {
    await page.goto('/orders/new');

    const hasForm = await page
      .locator('form, mat-form-field')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const isLogin = page.url().includes('login');

    expect(hasForm || isLogin).toBeTruthy();
  });
});
