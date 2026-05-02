import { Order } from '@saas-suite/data-access/orders';
import type { PaymentIntent, PaymentStatus } from '@saas-suite/data-access/payments';

const REVENUE_ORDER_STATUSES = new Set(['CONFIRMED', 'PAID', 'SHIPPED', 'DELIVERED']);

/** Pagamentos cujo valor entra em receita em risco (mesma regra que o KPI do dashboard). */
export const RISK_PAYMENT_STATUSES = new Set<PaymentStatus>(['FAILED', 'PENDING', 'AUTHORIZED']);

export interface ExecutiveMetrics {
  revenueLast7Days: number;
  revenueLast7DaysTotals: CurrencyTotal[];
  revenuePrevious7Days: number;
  revenueTrendPct: number;
  averageOrderValueLast7Days: number;
  averageOrderValueLast7DaysTotals: CurrencyTotal[];
  failedPayments: number;
  paymentFailureRatePct: number;
  revenueAtRisk: number;
  revenueAtRiskTotals: CurrencyTotal[];
}

export interface CurrencyTotal {
  currency: string;
  amount: number;
}

export function buildExecutiveMetrics(
  orders: readonly Order[],
  payments: readonly PaymentIntent[],
  now = new Date(),
): ExecutiveMetrics {
  const currentStart = startOfUtcDay(daysAgo(now, 6));
  const previousStart = startOfUtcDay(daysAgo(now, 13));
  const previousEnd = endOfUtcDay(daysAgo(now, 7));
  const currentOrders = revenueOrdersInRange(orders, currentStart, endOfUtcDay(now));
  const previousOrders = revenueOrdersInRange(orders, previousStart, previousEnd);
  const revenueLast7DaysTotals = summarizeOrdersByCurrency(currentOrders);
  const revenuePrevious7DaysTotals = summarizeOrdersByCurrency(previousOrders);
  const averageOrderValueLast7DaysTotals = averageOrdersByCurrency(currentOrders);
  const primaryCurrency = revenueLast7DaysTotals[0]?.currency ?? revenuePrevious7DaysTotals[0]?.currency ?? 'BRL';
  const revenueLast7Days = totalForCurrency(revenueLast7DaysTotals, primaryCurrency);
  const revenuePrevious7Days = totalForCurrency(revenuePrevious7DaysTotals, primaryCurrency);
  const failedPayments = payments.filter(payment => payment.status === 'FAILED').length;
  const revenueAtRiskTotals = summarizePaymentsByCurrency(payments.filter(payment => RISK_PAYMENT_STATUSES.has(payment.status)));
  return {
    revenueLast7Days,
    revenueLast7DaysTotals,
    revenuePrevious7Days,
    revenueTrendPct: percentChange(revenueLast7Days, revenuePrevious7Days),
    averageOrderValueLast7Days: totalForCurrency(averageOrderValueLast7DaysTotals, primaryCurrency),
    averageOrderValueLast7DaysTotals,
    failedPayments,
    paymentFailureRatePct: payments.length ? (failedPayments / payments.length) * 100 : 0,
    revenueAtRisk: totalForCurrency(revenueAtRiskTotals, primaryCurrency),
    revenueAtRiskTotals,
  };
}

function revenueOrdersInRange(orders: readonly Order[], from: Date, to: Date): Order[] {
  const fromMs = from.getTime();
  const toMs = to.getTime();
  return orders.filter(order => {
    if (!REVENUE_ORDER_STATUSES.has(order.status)) return false;
    const createdAt = new Date(order.createdAt).getTime();
    return Number.isFinite(createdAt) && createdAt >= fromMs && createdAt <= toMs;
  });
}

function summarizeOrdersByCurrency(orders: readonly Order[]): CurrencyTotal[] {
  return sortTotals(
    orders.reduce((totals, order) => {
      const currency = normalizeCurrency(order.currency);
      totals.set(currency, (totals.get(currency) ?? 0) + safeNumber(order.totalAmount));
      return totals;
    }, new Map<string, number>()),
  );
}

function averageOrdersByCurrency(orders: readonly Order[]): CurrencyTotal[] {
  const grouped = orders.reduce((totals, order) => {
    const currency = normalizeCurrency(order.currency);
    const current = totals.get(currency) ?? { amount: 0, count: 0 };
    totals.set(currency, {
      amount: current.amount + safeNumber(order.totalAmount),
      count: current.count + 1,
    });
    return totals;
  }, new Map<string, { amount: number; count: number }>());

  return [...grouped.entries()]
    .map(([currency, total]) => ({ currency, amount: total.count ? total.amount / total.count : 0 }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

function summarizePaymentsByCurrency(payments: readonly PaymentIntent[]): CurrencyTotal[] {
  return sortTotals(
    payments.reduce((totals, payment) => {
      const currency = normalizeCurrency(payment.currency);
      totals.set(currency, (totals.get(currency) ?? 0) + safeNumber(payment.amount));
      return totals;
    }, new Map<string, number>()),
  );
}

function sortTotals(totals: ReadonlyMap<string, number>): CurrencyTotal[] {
  return [...totals.entries()]
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

function totalForCurrency(totals: readonly CurrencyTotal[], currency: string): number {
  return totals.find(total => total.currency === currency)?.amount ?? 0;
}

function normalizeCurrency(currency: string | null | undefined): string {
  return (currency || 'BRL').toUpperCase();
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function safeNumber(value: unknown): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function daysAgo(now: Date, days: number): Date {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function startOfUtcDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfUtcDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}
