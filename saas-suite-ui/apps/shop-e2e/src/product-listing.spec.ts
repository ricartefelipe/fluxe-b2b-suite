import { test, expect } from '@playwright/test';

test.describe('Product Listing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display products grid with at least one product', async ({ page }) => {
    const productCards = page.locator('[class*="product-card"]');
    const count = await productCards.count();
    expect(count).toBeGreaterThan(0);

    const firstProduct = productCards.first();
    await expect(firstProduct).toBeVisible();

    const productImage = firstProduct.locator('img');
    await expect(productImage).toBeVisible();

    const productName = firstProduct.locator('h3');
    await expect(productName).toBeVisible();

    const productPrice = firstProduct.locator('text=/\\$\\d+\\.\\d{2}/');
    await expect(productPrice).toBeVisible();
  });

  test('should filter products by category', async ({ page }) => {
    const categoryDropdown = page.locator('select');
    await categoryDropdown.selectOption('Electronics');

    await page.waitForFunction(() => document.querySelectorAll('[class*="product-card"]').length > 0);

    const productCategories = page.locator('[class*="product-card"] p:first-of-type');
    const count = await productCategories.count();

    for (let i = 0; i < count; i++) {
      const category = productCategories.nth(i);
      await expect(category).toHaveText('Electronics');
    }
  });

  test('should filter products by search term', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Product 1');

    await page.waitForFunction(() => document.querySelectorAll('[class*="product-card"]').length > 0);

    const productNames = page.locator('[class*="product-card"] h3');
    const count = await productNames.count();

    for (let i = 0; i < count; i++) {
      const name = await productNames.nth(i).textContent();
      expect(name?.toLowerCase()).toContain('product 1');
    }
  });

  test('should filter by in-stock products only', async ({ page }) => {
    const resultsInfo = page.locator('text=/Showing \\d+ of \\d+ products/');
    const initialText = await resultsInfo.textContent();

    const inStockCheckbox = page.locator('input[type="checkbox"]');
    await inStockCheckbox.check();

    await page.waitForFunction(
      (initialText) => {
        const resultsElement = document.querySelector('[class*="results-info"]');
        return resultsElement && resultsElement.textContent !== initialText;
      },
      initialText,
      { timeout: 5000 }
    );

    await page.waitForTimeout(500);

    const outOfStockBadges = page.locator('text="Out of Stock"');
    const count = await outOfStockBadges.count();
    expect(count).toBe(0);
  });

  test('should handle pagination', async ({ page }) => {
    const paginationSection = page.locator('[class*="pagination"]');
    await expect(paginationSection).toBeVisible();

    const prevButton = page.locator('button:has-text("Previous")');
    const nextButton = page.locator('button:has-text("Next")');
    const pageInfo = page.locator('text=/Page \\d+ of \\d+/');

    await expect(prevButton).toBeDisabled();
    await expect(nextButton).toBeEnabled();
    await expect(pageInfo).toBeVisible();

    await nextButton.click();

    await page.waitForFunction(() => document.querySelectorAll('[class*="product-card"]').length > 0);

    const newPageInfo = await pageInfo.textContent();
    expect(newPageInfo).toContain('Page 2');

    await expect(prevButton).toBeEnabled();
  });

  test('should show correct product count', async ({ page }) => {
    const resultsInfo = page.locator('text=/Showing \\d+ of \\d+ products/');
    await expect(resultsInfo).toBeVisible();

    const text = await resultsInfo.textContent();
    const match = text?.match(/Showing (\d+) of (\d+)/);

    if (!match) {
      return;
    }

    const showing = parseInt(match[1]);
    const total = parseInt(match[2]);

    expect(showing).toBeGreaterThan(0);
    expect(showing).toBeLessThanOrEqual(12);
    expect(total).toBeGreaterThan(0);

    const productCards = page.locator('[class*="product-card"]');
    const actualCount = await productCards.count();
    expect(actualCount).toBe(showing);
  });
});
