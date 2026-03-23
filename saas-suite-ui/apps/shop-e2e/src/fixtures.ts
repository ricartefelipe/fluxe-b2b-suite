import { test as base, expect } from '@playwright/test';
import { installShopOrdersApiMocks } from './shop-orders-api-mock';

/**
 * Instala mocks de API (core dev token + orders products) antes de cada teste,
 * para E2E sem spring-saas-core (:8080) nem node-b2b-orders (:3000).
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await installShopOrdersApiMocks(page);
    await use(page);
  },
});

export { expect };
