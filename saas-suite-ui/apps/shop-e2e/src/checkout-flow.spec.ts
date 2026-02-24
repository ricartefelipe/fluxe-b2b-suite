import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('should navigate from products to checkout', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('h1, h2').first()).toBeVisible();

    await page.locator('[data-testid="add-to-cart"]').first().click();

    await page
      .locator('[data-testid="cart-icon"], a[href="/checkout"]')
      .first()
      .click();
    await expect(page).toHaveURL(/checkout/);
  });

  test('should display cart items in checkout', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.locator('mat-stepper, .checkout-stepper')).toBeVisible();
  });

  test('should complete checkout flow steps', async ({ page }) => {
    await page.goto('/products');

    const addButton = page
      .locator('button')
      .filter({ hasText: /add|cart/i })
      .first();
    if (await addButton.isVisible()) {
      await addButton.click();
    }

    await page.goto('/checkout');

    await expect(
      page.locator('.mat-step-header, mat-step-header')
    ).toHaveCount({ minimum: 2 });
  });
});
