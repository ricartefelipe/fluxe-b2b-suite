import { test, expect } from '@playwright/test';

test.describe('Product Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should navigate to product detail when clicking a product', async ({ page }) => {
    const firstProduct = page.locator('[class*="product-card"]').first();
    await firstProduct.click();

    await page.waitForURL('**/products/**');

    expect(page.url()).toMatch(/\/products\/prod-\d+/);

    const backLink = page.locator('a:has-text("Back to Products")');
    await expect(backLink).toBeVisible();
  });

  test('should display complete product information', async ({ page }) => {
    await page.goto('/products/prod-1');
    await page.waitForLoadState('domcontentloaded');

    const productName = page.locator('h1').filter({ hasText: /Product \d+/ });
    await expect(productName).toBeVisible();

    const productImage = page.locator('[class*="product-detail"] img');
    await expect(productImage).toBeVisible();
    await expect(productImage).toHaveAttribute('alt', /Product/);

    const category = page.locator('text=/Home & Garden|Electronics|Clothing|Sports|Books/');
    await expect(category.first()).toBeVisible();

    const ratingSection = page.locator('[class*="product-rating"]');
    await expect(ratingSection).toBeVisible();
    const stars = ratingSection.locator('[class*="stars"]');
    await expect(stars).toBeVisible();

    const price = page.locator('text=/\\$\\d+\\.\\d{2}/').first();
    await expect(price).toBeVisible();

    const descriptionHeading = page.locator('h2:has-text("Description")');
    await expect(descriptionHeading).toBeVisible();
    const description = page.locator('p').filter({ hasText: /high-quality/ });
    await expect(description).toBeVisible();

    const productInfoHeading = page.locator('h3:has-text("Product Information")');
    await expect(productInfoHeading).toBeVisible();

    const productId = page.locator('text=/prod-\\d+/');
    await expect(productId).toBeVisible();

    const availability = page.locator('dd').filter({ hasText: /In Stock|Out of Stock/ });
    await expect(availability).toBeVisible();
  });

  test('should show action buttons for in-stock products', async ({ page }) => {
    await page.goto('/products');

    const inStockProduct = page.locator('[class*="product-card"]').filter({ hasNot: page.locator('text="Out of Stock"') }).first();
    await inStockProduct.click();

    await page.waitForURL('**/products/**');

    const addToCartButton = page.locator('button:has-text("Add to Cart")');
    await expect(addToCartButton).toBeVisible();
    await expect(addToCartButton).toBeEnabled();

    const addToWishlistButton = page.locator('button:has-text("Add to Wishlist")');
    await expect(addToWishlistButton).toBeVisible();
    await expect(addToWishlistButton).toBeEnabled();

    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Product added to cart');
      dialog.accept();
    });
    await addToCartButton.click();
  });

  test('should show disabled button for out-of-stock products', async ({ page }) => {
    await page.goto('/products');

    const outOfStockProduct = page.locator('[class*="product-card"]').filter({ has: page.locator('text="Out of Stock"') }).first();

    const hasOutOfStock = await outOfStockProduct.count() > 0;

    if (!hasOutOfStock) {
      return;
    }

    await outOfStockProduct.click();

    await page.waitForURL('**/products/**');

    const outOfStockBadge = page.locator('.out-of-stock-badge').filter({ hasText: 'Out of Stock' });
    await expect(outOfStockBadge).toBeVisible();

    const unavailableButton = page.locator('button:has-text("Currently Unavailable")');
    await expect(unavailableButton).toBeVisible();
    await expect(unavailableButton).toBeDisabled();

    const addToCartButton = page.locator('button:has-text("Add to Cart")');
    await expect(addToCartButton).toBeHidden();
  });

  test('should navigate back to products list', async ({ page }) => {
    await page.goto('/products/prod-1');
    await page.waitForLoadState('domcontentloaded');

    const backLink = page.locator('a:has-text("Back to Products")');
    await backLink.click();

    await page.waitForURL('**/products');
    expect(page.url()).toContain('/products');

    const productsGrid = page.locator('[class*="product-grid"], [class*="products"]');
    await expect(productsGrid).toBeVisible();
  });
});
