import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { OrdersApiClient } from '@saas-suite/data-access/orders';
import { PaymentsApiClient } from '@saas-suite/data-access/payments';
import { Order, OrderStatus, InventoryItem, InventoryAdjustment } from '@saas-suite/data-access/orders';
import { PaymentIntent } from '@saas-suite/data-access/payments';
import { LoggerService } from '@saas-suite/shared/telemetry';

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
  RESERVED: '#ff9800',
  CONFIRMED: '#4caf50',
  CANCELLED: '#ef5350',
  PAID: '#2e7d32',
};

const ALL_STATUSES: OrderStatus[] = ['DRAFT', 'RESERVED', 'CONFIRMED', 'CANCELLED', 'PAID'];

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

  readonly loading = this._loading.asReadonly();

  readonly totalOrders = computed(() => this._orders().length);

  readonly totalRevenue = computed(() =>
    this._orders()
      .filter(o => o.status === 'CONFIRMED' || o.status === 'PAID')
      .reduce((sum, o) => sum + o.totalAmount, 0),
  );

  readonly activeInventoryItems = computed(() =>
    this._inventoryItems().filter(i => i.availableQuantity > 0).length,
  );

  readonly pendingPayments = computed(() =>
    this._payments().filter(p => p.status === 'PENDING').length,
  );

  readonly currency = computed(() => this._orders()[0]?.currency ?? 'BRL');

  readonly dailyRevenue = computed<DailyRevenue[]>(() => {
    const orders = this._orders();
    const days: DailyRevenue[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const amount = orders
        .filter(o => o.createdAt.slice(0, 10) === dateStr && (o.status === 'CONFIRMED' || o.status === 'PAID'))
        .reduce((s, o) => s + o.totalAmount, 0);
      days.push({
        date: dateStr,
        label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
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
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5),
  );

  readonly lowStockItems = computed(() =>
    this._inventoryItems().filter(i => i.availableQuantity > 0 && i.availableQuantity < 10),
  );

  readonly recentAdjustments = computed(() =>
    [...this._adjustments()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5),
  );

  async loadAll(): Promise<void> {
    this._loading.set(true);
    try {
      const [ordersRes, paymentsRes, inventory, adjustmentsRes] = await Promise.all([
        firstValueFrom(this.ordersApi.listOrders({ pageSize: 100 })),
        firstValueFrom(this.paymentsApi.listPayments({ pageSize: 100 })),
        firstValueFrom(this.ordersApi.listInventory()),
        firstValueFrom(this.ordersApi.listAdjustments({ pageSize: 50 })),
      ]);
      this._orders.set(ordersRes.data);
      this._payments.set(paymentsRes.data);
      this._inventoryItems.set(inventory);
      this._adjustments.set(adjustmentsRes.data);
    } catch (e) {
      this.logger.error('DashboardStore.loadAll failed', e);
    } finally {
      this._loading.set(false);
    }
  }
}
