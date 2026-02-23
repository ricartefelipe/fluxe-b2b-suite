import { test, expect } from '@playwright/test';

test.describe('Shop Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main header and navigation', async ({ page }) => {
    const header = page.locator('h1').first();
    await expect(header).toContainText('Union Solutions B2B Suite');

    const productsLink = page.locator('nav a:has-text("Products")');
    await expect(productsLink).toBeVisible();
    await expect(productsLink).toHaveAttribute('href', '/products');
  });

  test('should display footer with copyright information', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toContainText('© 2026 Union Solutions');
    await expect(footer).toContainText(
      'Plataforma B2B para gestão empresarial'
    );
  });

  test('should redirect to products page by default', async ({ page }) => {
    await page.waitForURL('**/products');
    expect(page.url()).toContain('/products');

    const productsHeading = page.locator('h1:has-text("Our Products")');
    await expect(productsHeading).toBeVisible();
  });

  test('should have proper page title and meta', async ({ page }) => {
    await expect(page).toHaveTitle(/shop/i);

    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();
  });
});
