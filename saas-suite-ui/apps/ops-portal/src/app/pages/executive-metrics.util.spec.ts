import { describe, expect, it } from 'vitest';
import { buildExecutiveMetrics } from '@saas-suite/domains/ops';
import { Order } from '@saas-suite/data-access/orders';
import { PaymentIntent } from '@saas-suite/data-access/payments';

function order(partial: Partial<Order>): Order {
  return {
    id: partial.id ?? 'order-1',
    tenantId: 'tenant-1',
    customerId: partial.customerId ?? 'customer-1',
    status: partial.status ?? 'CONFIRMED',
    items: [],
    totalAmount: partial.totalAmount ?? 0,
    currency: partial.currency ?? 'BRL',
    createdAt: partial.createdAt ?? '2026-04-20T12:00:00Z',
    updatedAt: partial.updatedAt ?? '2026-04-20T12:00:00Z',
  };
}

function payment(partial: Partial<PaymentIntent>): PaymentIntent {
  return {
    id: partial.id ?? 'payment-1',
    amount: partial.amount ?? '0',
    currency: partial.currency ?? 'BRL',
    status: partial.status ?? 'SETTLED',
    customer_ref: partial.customer_ref ?? 'customer-1',
    gateway_ref: partial.gateway_ref ?? null,
    created_at: partial.created_at ?? '2026-04-20T12:00:00Z',
    updated_at: partial.updated_at ?? '2026-04-20T12:00:00Z',
  };
}

describe('buildExecutiveMetrics', () => {
  it('calculates revenue, average order value and revenue trend for executive view', () => {
    const metrics = buildExecutiveMetrics(
      [
        order({ id: 'current-1', status: 'PAID', totalAmount: 100, createdAt: '2026-04-25T12:00:00Z' }),
        order({ id: 'current-2', status: 'DELIVERED', totalAmount: 300, createdAt: '2026-04-23T12:00:00Z' }),
        order({ id: 'previous', status: 'PAID', totalAmount: 200, createdAt: '2026-04-15T12:00:00Z' }),
        order({ id: 'cancelled', status: 'CANCELLED', totalAmount: 999, createdAt: '2026-04-25T12:00:00Z' }),
      ],
      [],
      new Date('2026-04-26T12:00:00Z'),
    );

    expect(metrics.revenueLast7Days).toBe(400);
    expect(metrics.averageOrderValueLast7Days).toBe(200);
    expect(metrics.revenueTrendPct).toBe(100);
  });

  it('calculates payment failure rate and revenue at risk', () => {
    const metrics = buildExecutiveMetrics(
      [],
      [
        payment({ status: 'FAILED', amount: '50' }),
        payment({ status: 'PENDING', amount: '25' }),
        payment({ status: 'AUTHORIZED', amount: '100' }),
        payment({ status: 'SETTLED', amount: '200' }),
      ],
      new Date('2026-04-26T12:00:00Z'),
    );

    expect(metrics.failedPayments).toBe(1);
    expect(metrics.paymentFailureRatePct).toBe(25);
    expect(metrics.revenueAtRisk).toBe(175);
  });

  it('keeps monetary executive totals separated by currency', () => {
    const metrics = buildExecutiveMetrics(
      [
        order({ id: 'brl', status: 'PAID', totalAmount: 100, currency: 'BRL', createdAt: '2026-04-25T12:00:00Z' }),
        order({ id: 'usd', status: 'PAID', totalAmount: 40, currency: 'USD', createdAt: '2026-04-25T12:00:00Z' }),
      ],
      [
        payment({ status: 'PENDING', amount: '25', currency: 'BRL' }),
        payment({ status: 'PENDING', amount: '10', currency: 'USD' }),
      ],
      new Date('2026-04-26T12:00:00Z'),
    );

    expect(metrics.revenueLast7DaysTotals).toEqual([
      { currency: 'BRL', amount: 100 },
      { currency: 'USD', amount: 40 },
    ]);
    expect(metrics.averageOrderValueLast7DaysTotals).toEqual([
      { currency: 'BRL', amount: 100 },
      { currency: 'USD', amount: 40 },
    ]);
    expect(metrics.revenueAtRiskTotals).toEqual([
      { currency: 'BRL', amount: 25 },
      { currency: 'USD', amount: 10 },
    ]);
  });
});
