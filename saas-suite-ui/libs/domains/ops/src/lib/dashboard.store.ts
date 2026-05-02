import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { OrdersApiClient } from '@saas-suite/data-access/orders';
import { PaymentsApiClient } from '@saas-suite/data-access/payments';
import { InventoryAdjustment, InventoryItem, Order, ORDER_LIST_MAX_LIMIT, OrderStatus } from '@saas-suite/data-access/orders';
import { PaymentIntent } from '@saas-suite/data-access/payments';
import { LoggerService } from '@saas-suite/shared/telemetry';
import { buildExecutiveMetrics, RISK_PAYMENT_STATUSES } from './executive-metrics.util';

const VALID_STATUSES: OrderStatus[] = ['DRAFT', 'CREATED', 'RESERVED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'PAID'];

/** Normaliza ordem vinda da API (status em maiúsculas, datas como string, totalAmount como número). */
function normalizeOrder(o: Record<string, unknown>): Order {
  const statusRaw = (o['status'] != null ? String(o['status']) : 'CREATED').toUpperCase();
  const status: OrderStatus = VALID_STATUSES.includes(statusRaw as OrderStatus) ? (statusRaw as OrderStatus) : 'CREATED';
  const createdAt = o['createdAt'] != null
    ? (typeof o['createdAt'] === 'string' ? o['createdAt'] : new Date(o['createdAt'] as Date).toISOString())
    : new Date().toISOString();
  const totalAmount = typeof o['totalAmount'] === 'number' ? o['totalAmount'] : Number(o['totalAmount']) || 0;
  const items = Array.isArray(o['items']) ? (o['items'] as Order['items']) : [];
  return {
    id: String(o['id'] ?? ''),
    tenantId: String(o['tenantId'] ?? ''),
    customerId: String(o['customerId'] ?? ''),
    status,
    items,
    totalAmount,
    currency: o['currency'] != null ? String(o['currency']) : undefined,
    correlationId: o['correlationId'] != null ? String(o['correlationId']) : undefined,
    createdAt,
    updatedAt: o['updatedAt'] != null
      ? (typeof o['updatedAt'] === 'string' ? o['updatedAt'] : new Date(o['updatedAt'] as Date).toISOString())
      : createdAt,
  };
}

export interface DailyRevenue {
  date: string;
  label: string;
  amount: number;
}

export interface OrderStatusCount {
  status: OrderStatus;
  count: number;
  color: string;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  DRAFT: '#78909c',
  CREATED: '#90a4ae',
  RESERVED: '#ff9800',
  CONFIRMED: '#4caf50',
  SHIPPED: '#1e88e5',
  DELIVERED: '#00897b',
  CANCELLED: '#ef5350',
  PAID: '#2e7d32',
};

const ALL_STATUSES: OrderStatus[] = ['DRAFT', 'CREATED', 'RESERVED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'PAID'];

/** Status que entram na receita (gráfico e KPI). */
const REVENUE_STATUSES: Set<string> = new Set(['CONFIRMED', 'PAID', 'SHIPPED', 'DELIVERED']);

function getOrderDateStr(created: string | number | Date): string {
  if (typeof created === 'string' && created.length >= 10 && created[4] === '-' && created[7] === '-') {
    return created.slice(0, 10);
  }
  return new Date(typeof created === 'number' ? created : created).toISOString().slice(0, 10);
}

/** YYYY-MM-DD em UTC — alinha buckets do gráfico com datas ISO dos pedidos. */
function utcCalendarDayStr(dateUtc: Date): string {
  const y = dateUtc.getUTCFullYear();
  const m = String(dateUtc.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateUtc.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const PAYMENT_STATUSES = [
  'CREATED',
  'PENDING',
  'AUTHORIZED',
  'CONFIRMED',
  'SETTLED',
  'FAILED',
  'CANCELLED',
  'VOIDED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
] as const;

function normalizePayment(raw: Record<string, unknown>): PaymentIntent {
  const statusRaw = String(raw['status'] ?? 'CREATED').toUpperCase();
  const status = PAYMENT_STATUSES.includes(statusRaw as (typeof PAYMENT_STATUSES)[number])
    ? (statusRaw as PaymentIntent['status'])
    : 'CREATED';
  return {
    id: String(raw['id'] ?? ''),
    amount: raw['amount'] != null ? String(raw['amount']) : '0',
    currency: raw['currency'] != null ? String(raw['currency']) : 'BRL',
    status,
    customer_ref: String(raw['customer_ref'] ?? raw['customerRef'] ?? ''),
    gateway_ref: raw['gateway_ref'] != null ? String(raw['gateway_ref']) : raw['gatewayRef'] != null ? String(raw['gatewayRef']) : null,
    created_at:
      typeof raw['created_at'] === 'string'
        ? raw['created_at']
        : typeof raw['createdAt'] === 'string'
          ? raw['createdAt']
          : new Date().toISOString(),
    updated_at:
      typeof raw['updated_at'] === 'string'
        ? raw['updated_at']
        : typeof raw['updatedAt'] === 'string'
          ? raw['updatedAt']
          : new Date().toISOString(),
  };
}

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private ordersApi = inject(OrdersApiClient);
  private paymentsApi = inject(PaymentsApiClient);
  private logger = inject(LoggerService);

  private readonly _orders = signal<Order[]>([]);
  private readonly _payments = signal<PaymentIntent[]>([]);
  private readonly _inventoryItems = signal<InventoryItem[]>([]);
  private readonly _adjustments = signal<InventoryAdjustment[]>([]);
  private readonly _loading = signal(false);
  private readonly _loadError = signal(false);

  readonly loading = this._loading.asReadonly();
  readonly loadError = this._loadError.asReadonly();

  readonly totalOrders = computed(() => this._orders().length);

  readonly totalRevenue = computed(() =>
    this._orders()
      .filter(o => ['CONFIRMED', 'PAID', 'SHIPPED', 'DELIVERED'].includes(o.status))
      .reduce((sum, o) => sum + o.totalAmount, 0),
  );

  readonly activeInventoryItems = computed(() =>
    this._inventoryItems().filter(i => i.availableQty > 0).length,
  );

  /** Mesmos status que somam «receita em risco» em buildExecutiveMetrics (pendente, autorizado ou falho). */
  readonly paymentsAtRiskCount = computed(() =>
    this._payments().filter(p => RISK_PAYMENT_STATUSES.has(p.status)).length,
  );

  readonly currency = computed(() => this._orders()[0]?.currency ?? 'BRL');

  readonly executiveMetrics = computed(() => buildExecutiveMetrics(this._orders(), this._payments()));

  readonly dailyRevenue = computed<DailyRevenue[]>(() => {
    const orders = this._orders();
    const days: DailyRevenue[] = [];
    const now = new Date();
    const anchorUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    for (let i = 6; i >= 0; i--) {
      const d = new Date(anchorUtc - i * 86_400_000);
      const dateStr = utcCalendarDayStr(d);
      const amount = orders
        .filter(o => {
          const created = o?.createdAt;
          if (created == null) return false;
          const orderDate = getOrderDateStr(created);
          return orderDate === dateStr && REVENUE_STATUSES.has(o.status);
        })
        .reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
      const label = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' }).format(d).replace('.', '');
      days.push({
        date: dateStr,
        label,
        amount,
      });
    }
    return days;
  });

  readonly maxDailyRevenue = computed(() =>
    Math.max(...this.dailyRevenue().map(d => d.amount), 1),
  );

  readonly ordersByStatus = computed<OrderStatusCount[]>(() => {
    const orders = this._orders();
    return ALL_STATUSES.map(s => ({
      status: s,
      count: orders.filter(o => o.status === s).length,
      color: STATUS_COLORS[s],
    }));
  });

  /** Denominator for chart percentages — at least 1 to avoid division by zero */
  readonly totalOrdersForChart = computed(() =>
    this.ordersByStatus().reduce((s, x) => s + x.count, 0) || 1,
  );

  readonly recentOrders = computed(() =>
    [...this._orders()]
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      .slice(0, 5),
  );

  readonly lowStockItems = computed(() =>
    this._inventoryItems().filter(i => i.availableQty > 0 && i.availableQty < 10),
  );

  readonly recentAdjustments = computed(() =>
    [...this._adjustments()]
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      .slice(0, 5),
  );

  async loadAll(): Promise<void> {
    this._loading.set(true);
    this._loadError.set(false);
    const results = await Promise.allSettled([
      this.loadAllOrders(),
      this.loadAllPayments(),
      firstValueFrom(this.ordersApi.listInventory()),
      firstValueFrom(this.ordersApi.listAdjustments({ limit: 50 })),
    ]);

    if (results[0].status === 'fulfilled') {
      this._orders.set(results[0].value);
    } else {
      this.logger.error('loadOrders failed', results[0].reason);
    }

    if (results[1].status === 'fulfilled') {
      this._payments.set(results[1].value);
    } else {
      this.logger.error('loadPayments failed', results[1].reason);
    }

    if (results[2].status === 'fulfilled') {
      const inv = results[2].value;
      this._inventoryItems.set(inv.data ?? []);
    } else {
      this.logger.error('loadInventory failed', results[2].reason);
    }

    if (results[3].status === 'fulfilled') {
      const adjRaw = results[3].value as { data?: InventoryAdjustment[] } | InventoryAdjustment[];
      this._adjustments.set(Array.isArray(adjRaw) ? adjRaw : (adjRaw?.data ?? []));
    } else {
      this.logger.error('loadAdjustments failed', results[3].reason);
    }

    const hasError = results.some(r => r.status === 'rejected');
    this._loadError.set(hasError);
    this._loading.set(false);
  }

  private async loadAllOrders(): Promise<Order[]> {
    const orders: Order[] = [];
    let cursor: string | undefined;
    do {
      const page = await firstValueFrom(this.ordersApi.listOrders({ cursor, limit: ORDER_LIST_MAX_LIMIT }));
      orders.push(...page.data.map(order => normalizeOrder(order as unknown as Record<string, unknown>)));
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
    return orders;
  }

  private async loadAllPayments(): Promise<PaymentIntent[]> {
    const payments: PaymentIntent[] = [];
    let pageNumber = 1;
    let total = Number.POSITIVE_INFINITY;
    while (payments.length < total) {
      const page = await firstValueFrom(this.paymentsApi.listPayments({ page: pageNumber, pageSize: 500 }));
      payments.push(...page.data.map(p => normalizePayment(p as unknown as Record<string, unknown>)));
      total = page.total;
      if (page.data.length === 0) break;
      pageNumber += 1;
    }
    return payments;
  }
}
