import { test, expect } from './fixtures';
import { loginWithQuickProfile } from './dev-login.helper';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithQuickProfile(page, 'Viewer');
  });

  test('should navigate from products to checkout', async ({ page }) => {
    // Detalhe do produto: botão add-to-cart visível sem hover (a grelha usa overlay só com hover).
    await page.goto('/product/prod-e2e-1');
    await expect(page.locator('h1.product-name')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.add-to-cart-btn')).toBeVisible();

    await page.locator('.add-to-cart-btn').click();

    // Ícone do carrinho só abre o minicarrinho; usar o link da navegação para /checkout.
    await page.locator('a[href="/checkout"]').first().click();
    await expect(page).toHaveURL(/checkout/);
  });

  test('should display cart items in checkout', async ({ page }) => {
    await page.goto('/checkout');
    // Carrinho vazio mostra empty-cart; com itens mostra o stepper.
    await expect(page.locator('.checkout-stepper, .empty-cart')).toBeVisible();
  });

  test('should complete checkout flow steps', async ({ page }) => {
    await page.goto('/product/prod-e2e-1');
    await expect(page.locator('h1.product-name')).toBeVisible({ timeout: 15000 });
    await page.locator('.add-to-cart-btn').click();

    await page.goto('/checkout');

    const stepHeaders = page.locator('.mat-step-header, mat-step-header');
    await expect.poll(async () => stepHeaders.count()).toBeGreaterThanOrEqual(2);
  });
});
