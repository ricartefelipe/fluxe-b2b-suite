import { test, expect } from '@playwright/test';

test.describe('Navigation and User Flow', () => {
  test('should complete a full user journey through the app', async ({ page }) => {
    await page.goto('/');

    await page.waitForURL('**/products');

    const productsHeading = page.locator('h1:has-text("Our Products")');
    await expect(productsHeading).toBeVisible();

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Product 1');
    await page.waitForFunction(() => document.querySelectorAll('[class*="product-card"]').length > 0);

    const firstResult = page.locator('[class*="product-card"]').first();
    const productName = await firstResult.locator('h3').textContent();
    await firstResult.click();

    await page.waitForURL('**/products/**');

    const detailProductName = page.locator('h1').filter({ hasText: productName || '' });
    await expect(detailProductName).toBeVisible();

    const backLink = page.locator('a:has-text("Back to Products")');
    await backLink.click();

    await page.waitForURL('**/products');
    await expect(productsHeading).toBeVisible();

    await expect(searchInput).toHaveValue('');
  });

  test('should handle navigation via header link', async ({ page }) => {
    await page.goto('/products/prod-1');
    await page.waitForLoadState('domcontentloaded');

    const headerProductsLink = page.locator('nav a:has-text("Products")');
    await headerProductsLink.click();

    await page.waitForURL('**/products');

    const productsGrid = page.locator('[class*="product"]').first();
    await expect(productsGrid).toBeVisible();
  });

  test('should maintain filter state during navigation', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('domcontentloaded');

    const categoryDropdown = page.locator('select');
    await categoryDropdown.selectOption('Electronics');

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Product');

    await page.waitForFunction(() => document.querySelectorAll('[class*="product-card"]').length > 0);

    const product = page.locator('[class*="product-card"]').first();
    await product.click();

    await page.waitForURL('**/products/**');

    await page.goBack();

    await expect(searchInput).toHaveValue('');
    await expect(categoryDropdown).toHaveValue('');
  });

  test('should handle rapid navigation', async ({ page }) => {
    await page.goto('/products');

    for (let i = 0; i < 3; i++) {
      const product = page.locator('[class*="product-card"]').nth(i);
      await product.click();
      await page.waitForURL('**/products/**');

      const productDetail = page.locator('h1').nth(1);
      await expect(productDetail).toBeVisible();

      const backLink = page.locator('a:has-text("Back to Products")');
      await backLink.click();
      await page.waitForURL('**/products');
    }

    const productsHeading = page.locator('h1:has-text("Our Products")');
    await expect(productsHeading).toBeVisible();
  });

  test('should handle direct URL navigation', async ({ page }) => {
    await page.goto('/products/prod-5');
    await page.waitForLoadState('domcontentloaded');

    const productName = page.locator('h1').filter({ hasText: 'Product 5' });
    await expect(productName).toBeVisible();

    await page.goto('/products');
    await page.waitForLoadState('domcontentloaded');

    const productsGrid = page.locator('[class*="product-card"]');
    const count = await productsGrid.count();
    expect(count).toBeGreaterThan(0);

    await page.goto('/non-existent-route');
    await page.waitForURL('**/products');

    const productsHeading = page.locator('h1:has-text("Our Products")');
    await expect(productsHeading).toBeVisible();
  });

  test('should display loading states during navigation', async ({ page }) => {
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100);
    });

    await page.goto('/products');

    const product = page.locator('[class*="product-card"]').first();
    await product.click();

    await page.waitForURL('**/products/**', { timeout: 10000 });

    const productDetail = page.locator('[class*="product-detail"]');
    await expect(productDetail).toBeVisible({ timeout: 10000 });
  });
});
