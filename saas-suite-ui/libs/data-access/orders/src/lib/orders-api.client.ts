import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { IDEMPOTENCY_KEY } from '@saas-suite/shared/util';
import { KeysetListResponse, toParams } from '@saas-suite/shared/http';
import { Order, CreateOrderRequest, OrderListParams } from './models/order.model';
import { InventoryItem, InventoryAdjustment, CreateAdjustmentRequest, AdjustmentListParams } from './models/inventory.model';

@Injectable({ providedIn: 'root' })
export class OrdersApiClient {
  private http = inject(HttpClient);
  private config = inject(RuntimeConfigService);

  private get base(): string { return this.config.get('ordersApiBaseUrl'); }

  listOrders(p?: OrderListParams): Observable<KeysetListResponse<Order>> {
    return this.http.get<KeysetListResponse<Order>>(`${this.base}/v1/orders`, { params: toParams(p as Record<string, unknown>) });
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
  listInventory(sku?: string): Observable<KeysetListResponse<InventoryItem>> {
    return this.http.get<KeysetListResponse<InventoryItem>>(`${this.base}/v1/inventory`, { params: toParams(sku != null ? { sku } : undefined) });
  }
  createAdjustment(req: CreateAdjustmentRequest, idempotencyKey: string): Observable<InventoryAdjustment> {
    return this.http.post<InventoryAdjustment>(`${this.base}/v1/inventory/adjustments`, req, {
      context: new HttpContext().set(IDEMPOTENCY_KEY, idempotencyKey),
    });
  }
  listAdjustments(p?: AdjustmentListParams): Observable<KeysetListResponse<InventoryAdjustment>> {
    return this.http.get<KeysetListResponse<InventoryAdjustment>>(`${this.base}/v1/inventory/adjustments`, { params: toParams(p as Record<string, unknown>) });
  }
}
