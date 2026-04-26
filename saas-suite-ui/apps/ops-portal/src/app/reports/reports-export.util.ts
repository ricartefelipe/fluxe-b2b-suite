import { Order } from '@saas-suite/data-access/orders';
import { LedgerEntryRow, PaymentIntent } from '@saas-suite/data-access/payments';

export interface DateRangeFilter {
  from?: Date | null;
  to?: Date | null;
}

export function buildCsv(headers: readonly string[], rows: readonly (readonly unknown[])[]): string {
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map(row => row.map(escapeCsvCell).join(',')),
  ];
  return `\uFEFF${lines.join('\n')}`;
}

export function summarizeAmounts(rows: readonly { amount: unknown }[]): number {
  return rows.reduce((total, row) => {
    const value = typeof row.amount === 'number' ? row.amount : Number(row.amount);
    return Number.isFinite(value) ? total + value : total;
  }, 0);
}

export interface CurrencyTotal {
  currency: string;
  amount: number;
}

export function summarizeAmountsByCurrency<T>(
  rows: readonly T[],
  getCurrency: (row: T) => string | null | undefined,
  getAmount: (row: T) => unknown,
): CurrencyTotal[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const currency = (getCurrency(row) || 'BRL').toUpperCase();
    const amount = typeof getAmount(row) === 'number' ? getAmount(row) as number : Number(getAmount(row));
    if (!Number.isFinite(amount)) continue;
    totals.set(currency, (totals.get(currency) || 0) + amount);
  }
  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, amount]) => ({ currency, amount }));
}

export function formatCurrencyTotals(totals: readonly CurrencyTotal[]): string {
  if (totals.length === 0) return '0.00';
  return totals.map(total => `${total.currency} ${total.amount.toFixed(2)}`).join(' · ');
}

export function buildDateRangeParams(filter: DateRangeFilter): Record<string, string> {
  const params: Record<string, string> = {};
  if (filter.from) params['from'] = toUtcIsoOffset(startOfDay(filter.from));
  if (filter.to) params['to'] = toUtcIsoOffset(endOfDay(filter.to));
  return params;
}

export function filterByDateRange<T>(
  rows: readonly T[],
  getDate: (row: T) => string,
  filter: DateRangeFilter,
): T[] {
  const from = filter.from ? startOfDay(filter.from).getTime() : Number.NEGATIVE_INFINITY;
  const to = filter.to ? endOfDay(filter.to).getTime() : Number.POSITIVE_INFINITY;
  return rows.filter(row => {
    const value = new Date(getDate(row)).getTime();
    return Number.isFinite(value) && value >= from && value <= to;
  });
}

export function buildOrderCsvRows(orders: readonly Order[]): unknown[][] {
  return orders.map(order => [
    order.id,
    order.customerId,
    order.status,
    order.currency || 'BRL',
    order.totalAmount,
    order.items.length,
    order.createdAt,
  ]);
}

export function buildPaymentCsvRows(payments: readonly PaymentIntent[]): unknown[][] {
  return payments.map(payment => [
    payment.id,
    payment.customer_ref,
    payment.status,
    payment.currency,
    payment.amount,
    payment.gateway_ref || '',
    payment.created_at,
  ]);
}

export function buildLedgerCsvRows(entries: readonly LedgerEntryRow[]): unknown[][] {
  return entries.map(entry => [
    entry.id,
    entry.postedAt,
    entry.side,
    entry.account,
    entry.currency,
    entry.amount,
    entry.paymentIntentId || '',
  ]);
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function reportFilename(prefix: string, date = new Date()): string {
  return `${prefix}-${toIsoDate(date)}.csv`;
}

function escapeCsvCell(value: unknown): string {
  const text = neutralizeSpreadsheetFormula(value == null ? '' : String(value));
  return `"${text.replace(/"/g, '""')}"`;
}

function neutralizeSpreadsheetFormula(value: string): string {
  return /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
}

function toIsoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function toUtcIsoOffset(date: Date): string {
  return date.toISOString().replace('Z', '+00:00');
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}
