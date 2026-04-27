import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { OrdersApiClient } from '@saas-suite/data-access/orders';
import { PaymentIntent, PaymentsApiClient } from '@saas-suite/data-access/payments';
import { DashboardStore } from '@saas-suite/domains/ops';
import { LoggerService } from '@saas-suite/shared/telemetry';

function payment(id: string, status: PaymentIntent['status'], amount: string): PaymentIntent {
  return {
    id,
    status,
    amount,
    currency: 'BRL',
    customer_ref: 'customer-1',
    gateway_ref: null,
    created_at: '2026-04-20T12:00:00Z',
    updated_at: '2026-04-20T12:00:00Z',
  };
}

describe('DashboardStore pagination', () => {
  it('loads all payment pages using the API page/pageSize contract', async () => {
    const ordersApi = {
      listOrders: vi.fn().mockReturnValue(of({ data: [], nextCursor: null, hasMore: false })),
      listInventory: vi.fn().mockReturnValue(of({ data: [] })),
      listAdjustments: vi.fn().mockReturnValue(of({ data: [] })),
    };
    const paymentsApi = {
      listPayments: vi.fn(({ page }) =>
        of({
          data: page === 1 ? [payment('p1', 'FAILED', '10')] : [payment('p2', 'PENDING', '5')],
          total: 2,
          page,
          pageSize: 500,
        }),
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        { provide: OrdersApiClient, useValue: ordersApi },
        { provide: PaymentsApiClient, useValue: paymentsApi },
        { provide: LoggerService, useValue: { error: vi.fn() } },
      ],
    });

    const store = TestBed.inject(DashboardStore);
    await store.loadAll();

    expect(ordersApi.listOrders).toHaveBeenCalledWith({ cursor: undefined, limit: 100 });
    expect(paymentsApi.listPayments).toHaveBeenNthCalledWith(1, { page: 1, pageSize: 500 });
    expect(paymentsApi.listPayments).toHaveBeenNthCalledWith(2, { page: 2, pageSize: 500 });
    expect(store.executiveMetrics().failedPayments).toBe(1);
    expect(store.executiveMetrics().revenueAtRisk).toBe(15);
  });
});
