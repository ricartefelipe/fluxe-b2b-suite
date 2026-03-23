import { test, expect } from './fixtures';
import { loginWithQuickProfile } from './dev-login.helper';

/**
 * Dados vêm de `shop-orders-api-mock` (1 produto, Electronics, BRL).
 */
test.describe('Product Listing Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithQuickProfile(page, 'Viewer');
    await page.goto('/products');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('article.product-card').first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('should display at least one product card with price', async ({ page }) => {
    const card = page.locator('article.product-card').first();
    await expect(card.locator('h3.product-name')).toContainText(/E2E Product/i);
    await expect(card.locator('.product-price')).toContainText(/R\$\s*29/);
  });

  test('should filter products by category Electronics', async ({ page }) => {
    await page
      .locator('#sidebar-filters label.filter-checkbox')
      .filter({ hasText: 'Electronics' })
      .click();
    await expect(page.locator('article.product-card').first()).toBeVisible();
    await expect(
      page.locator('article.product-card .category-badge').first()
    ).toHaveText('Electronics');
  });

  test('should filter by search term', async ({ page }) => {
    const searchInput = page.locator('.search-input').first();
    await searchInput.fill('E2E');
    await expect(page.locator('article.product-card').first()).toBeVisible();
    await expect(page.locator('h3.product-name').first()).toContainText(/E2E/i);
  });

  test('should filter by in-stock only', async ({ page }) => {
    await page.locator('#sidebar-filters label.filter-toggle').click();
    await expect(page.locator('article.product-card')).toHaveCount(1);
  });

  test('should hide pagination when a single page of results', async ({ page }) => {
    await expect(page.locator('nav.pagination')).toHaveCount(0);
  });

  test('should show product count line', async ({ page }) => {
    await expect(
      page.getByText(/Mostrando|Showing/i).first()
    ).toBeVisible();
  });
});
