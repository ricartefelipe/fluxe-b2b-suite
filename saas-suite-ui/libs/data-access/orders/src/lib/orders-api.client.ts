import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { IDEMPOTENCY_KEY } from '@saas-suite/shared/util';
import { Order, CreateOrderRequest, OrderListParams } from './models/order.model';
import { InventoryItem, InventoryAdjustment, CreateAdjustmentRequest, AdjustmentListParams } from './models/inventory.model';

export interface PageResponse<T> { data: T[]; total: number; page: number; pageSize: number; }

@Injectable({ providedIn: 'root' })
export class OrdersApiClient {
  private http = inject(HttpClient);
  private config = inject(RuntimeConfigService);

  private get base(): string { return this.config.get('ordersApiBaseUrl'); }

  private toParams(obj?: Record<string, unknown>): HttpParams {
    let params = new HttpParams();
    if (!obj) return params;
    Object.entries(obj).forEach(([k, v]) => { if (v != null && v !== '') params = params.set(k, String(v)); });
    return params;
  }

  listOrders(p?: OrderListParams): Observable<PageResponse<Order>> {
    return this.http.get<PageResponse<Order>>(`${this.base}/v1/orders`, { params: this.toParams(p as Record<string, unknown>) });
  }
  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.base}/v1/orders/${id}`);
  }
  createOrder(req: CreateOrderRequest, idempotencyKey: string): Observable<Order> {
    return this.http.post<Order>(`${this.base}/v1/orders`, req, {
      context: new HttpContext().set(IDEMPOTENCY_KEY, idempotencyKey),
    });
  }
  confirmOrder(id: string, idempotencyKey: string): Observable<Order> {
    return this.http.post<Order>(`${this.base}/v1/orders/${id}/confirm`, {}, {
      context: new HttpContext().set(IDEMPOTENCY_KEY, idempotencyKey),
    });
  }
  cancelOrder(id: string): Observable<Order> {
    return this.http.post<Order>(`${this.base}/v1/orders/${id}/cancel`, {});
  }
  listInventory(sku?: string): Observable<InventoryItem[]> {
    let params = new HttpParams();
    if (sku) params = params.set('sku', sku);
    return this.http.get<InventoryItem[]>(`${this.base}/v1/inventory`, { params });
  }
  createAdjustment(req: CreateAdjustmentRequest, idempotencyKey: string): Observable<InventoryAdjustment> {
    return this.http.post<InventoryAdjustment>(`${this.base}/v1/inventory/adjustments`, req, {
      context: new HttpContext().set(IDEMPOTENCY_KEY, idempotencyKey),
    });
  }
  listAdjustments(p?: AdjustmentListParams): Observable<PageResponse<InventoryAdjustment>> {
    return this.http.get<PageResponse<InventoryAdjustment>>(`${this.base}/v1/inventory/adjustments`, { params: this.toParams(p as Record<string, unknown>) });
  }
}
