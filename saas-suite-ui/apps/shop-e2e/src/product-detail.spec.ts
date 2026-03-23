import { test, expect } from './fixtures';
import { loginWithQuickProfile } from './dev-login.helper';

test.describe('Product Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithQuickProfile(page, 'Viewer');
  });

  test('should navigate to product detail when clicking a product', async ({ page }) => {
    await page.goto('/products');
    await page.locator('article.product-card h3.product-name').first().click();
    await page.waitForURL(/\/product\/prod-e2e-1/);
    await expect(page.locator('h1.product-name')).toContainText('E2E Product');
  });

  test('should display complete product information', async ({ page }) => {
    await page.goto('/product/prod-e2e-1');
    await expect(page.locator('h1.product-name')).toContainText('E2E Product');
    await expect(page.locator('.product-detail .product-price')).toContainText(/R\$\s*29/);
    await expect(page.locator('.breadcrumb a[href="/products"]')).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: /Descrição|Description/i })).toBeVisible();
  });

  test('should show add-to-cart for in-stock product', async ({ page }) => {
    await page.goto('/product/prod-e2e-1');
    const btn = page.locator('.add-to-cart-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('should navigate back to products via breadcrumb', async ({ page }) => {
    await page.goto('/product/prod-e2e-1');
    await page.locator('.breadcrumb a[href="/products"]').click();
    await page.waitForURL(/\/products/, { timeout: 15000 });
    await expect(page.locator('article.product-card').first()).toBeVisible();
  });
});
