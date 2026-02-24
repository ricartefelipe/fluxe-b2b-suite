import { test, expect } from '@playwright/test';

test.describe('Orders History', () => {
  test('should display orders page', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/orders/);
    await expect(page.locator('body')).not.toContainText('Error');
  });

  test('should show order cards or empty state', async ({ page }) => {
    await page.goto('/orders');

    const hasOrders = await page
      .locator('.order-card, mat-card')
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .locator('.empty-state, [role="status"]')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasOrders || hasEmpty).toBeTruthy();
  });
});
