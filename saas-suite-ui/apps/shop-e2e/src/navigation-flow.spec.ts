import { test, expect } from './fixtures';
import { loginWithQuickProfile } from './dev-login.helper';

test.describe('Navigation and User Flow', () => {
  test('should complete catalog → detail → back via breadcrumb', async ({ page }) => {
    await loginWithQuickProfile(page, 'Viewer');
    await page.goto('/products');
    await expect(page.locator('.catalog-layout')).toBeVisible();

    await page.locator('.search-input').first().fill('E2E');
    await page.locator('article.product-card h3.product-name').first().click();
    await page.waitForURL(/\/product\/prod-e2e-1/);
    await expect(page.locator('h1.product-name')).toContainText('E2E Product');

    await page.locator('.breadcrumb a[href="/products"]').click();
    await page.waitForURL(/\/products/);
    await expect(page.locator('article.product-card').first()).toBeVisible();
  });

  test('should navigate to products from header', async ({ page }) => {
    await loginWithQuickProfile(page, 'Viewer');
    await page.goto('/product/prod-e2e-1');
    await page
      .getByRole('link', { name: /Todos os Produtos|All Products|Products/i })
      .first()
      .click();
    await page.waitForURL(/\/products/);
    await expect(page.locator('article.product-card').first()).toBeVisible();
  });

  test('should load product detail by direct URL', async ({ page }) => {
    await loginWithQuickProfile(page, 'Viewer');
    await page.goto('/product/prod-e2e-1');
    await expect(page.locator('h1.product-name')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.product-detail-container')).toBeVisible();
  });
});
