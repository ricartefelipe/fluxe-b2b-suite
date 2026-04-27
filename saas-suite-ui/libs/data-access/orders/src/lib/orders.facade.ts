import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { OrdersApiClient } from './orders-api.client';
import { Order, CreateOrderRequest, ORDER_LIST_MAX_LIMIT, OrderListParams } from './models/order.model';
import { LoggerService } from '@saas-suite/shared/telemetry';
import { generateIdempotencyKey } from '@saas-suite/shared/util';

@Injectable({ providedIn: 'root' })
export class OrdersFacade {
  private api = inject(OrdersApiClient);
  private logger = inject(LoggerService);

  private readonly _orders = signal<Order[]>([]);
  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _selected = signal<Order | null>(null);

  readonly orders = this._orders.asReadonly();
  readonly total = this._total.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly selectedOrder = this._selected.asReadonly();

  async loadOrders(params?: OrderListParams): Promise<void> {
    this._loading.set(true);
    try {
      const r = await firstValueFrom(this.api.listOrders(params));
      this._orders.set(r.data); this._total.set(r.data.length);
    } catch (e) { this.logger.error('loadOrders failed', e); }
    finally { this._loading.set(false); }
  }

  async loadAllOrders(params?: OrderListParams): Promise<Order[]> {
    this._loading.set(true);
    try {
      const orders: Order[] = [];
      let cursor = params?.cursor;
      const limit = Math.min(params?.limit ?? ORDER_LIST_MAX_LIMIT, ORDER_LIST_MAX_LIMIT);
      do {
        const r = await firstValueFrom(this.api.listOrders({ ...params, cursor, limit }));
        orders.push(...r.data);
        cursor = r.nextCursor ?? undefined;
      } while (cursor);
      this._orders.set(orders); this._total.set(orders.length);
      return orders;
    } catch (e) {
      this.logger.error('loadAllOrders failed', e);
      return [];
    } finally { this._loading.set(false); }
  }

  async loadOrder(id: string): Promise<void> {
    this._loading.set(true);
    try {
      const o = await firstValueFrom(this.api.getOrder(id));
      this._selected.set(o);
    } catch (e) { this.logger.error('loadOrder failed', e); }
    finally { this._loading.set(false); }
  }

  async createOrder(req: CreateOrderRequest): Promise<Order | null> {
    const key = generateIdempotencyKey('order');
    try {
      const o = await firstValueFrom(this.api.createOrder(req, key));
      this._orders.update(list => [o, ...list]); return o;
    } catch (e) { this.logger.error('createOrder failed', e); return null; }
  }

  async confirmOrder(id: string): Promise<Order | null> {
    const key = generateIdempotencyKey('confirm');
    try {
      const o = await firstValueFrom(this.api.confirmOrder(id, key));
      this._selected.set(o); this._orders.update(list => list.map(x => x.id === id ? o : x)); return o;
    } catch (e) { this.logger.error('confirmOrder failed', e); return null; }
  }

  async cancelOrder(id: string): Promise<Order | null> {
    try {
      const o = await firstValueFrom(this.api.cancelOrder(id));
      this._selected.set(o); this._orders.update(list => list.map(x => x.id === id ? o : x)); return o;
    } catch (e) { this.logger.error('cancelOrder failed', e); return null; }
  }
}
