import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, forkJoin, of } from 'rxjs';
import { catchError, debounceTime, map, switchMap } from 'rxjs/operators';

import { CoreApiClient, Tenant, AuditLog } from '@saas-suite/data-access/core';
import { OrdersApiClient, Order, InventoryItem } from '@saas-suite/data-access/orders';
import { PaymentsApiClient, PaymentIntent } from '@saas-suite/data-access/payments';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { KeysetListResponse, PageResponse, toParams } from '@saas-suite/shared/http';
import { Product } from '@union.solutions/models';

import { SearchResult, SearchConfig } from './search.model';
import { SEARCH_CONFIG, DEFAULT_SEARCH_CONFIG } from './provide-search';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private readonly coreApi = inject(CoreApiClient);
  private readonly ordersApi = inject(OrdersApiClient);
  private readonly paymentsApi = inject(PaymentsApiClient);
  private readonly config: SearchConfig =
    inject(SEARCH_CONFIG, { optional: true }) ?? DEFAULT_SEARCH_CONFIG;

  private readonly searchSubject = new Subject<string>();

  readonly results = signal<SearchResult[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly query = signal('');

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(this.config.debounceMs),
        switchMap(q =>
          this.executeSearch(q).pipe(
            catchError(err => {
              this.error.set(err.message ?? 'Search failed');
              this.loading.set(false);
              return of([] as SearchResult[]);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(results => {
        this.results.set(results);
        this.loading.set(false);
      });
  }

  search(query: string): void {
    this.query.set(query);
    if (!query.trim()) {
      this.results.set([]);
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.searchSubject.next(query.trim());
  }

  clear(): void {
    this.query.set('');
    this.results.set([]);
    this.loading.set(false);
    this.error.set(null);
  }

  private executeSearch(query: string): Observable<SearchResult[]> {
    const q = query.toLowerCase();
    const enabled = this.config.enabledEntities;
    const max = this.config.maxResultsPerEntity;
    const searches: Observable<SearchResult[]>[] = [];

    if (enabled.includes('tenant')) {
      searches.push(
        this.coreApi.listTenants({ name: query, limit: max }).pipe(
          map(res => res.data.map(t => this.mapTenant(t, q))),
          catchError(() => of([])),
        ),
      );
    }

    if (enabled.includes('order')) {
      searches.push(
        this.ordersApi.listOrders({ limit: max * 3 }).pipe(
          map(res =>
            res.data
              .filter(o => this.matchesOrder(o, q))
              .slice(0, max)
              .map(o => this.mapOrder(o, q)),
          ),
          catchError(() => of([])),
        ),
      );
    }

    if (enabled.includes('payment')) {
      searches.push(
        this.paymentsApi.listPayments({ limit: max * 3 }).pipe(
          map(res =>
            res.data
              .filter(p => this.matchesPayment(p, q))
              .slice(0, max)
              .map(p => this.mapPayment(p, q)),
          ),
          catchError(() => of([])),
        ),
      );
    }

    if (enabled.includes('product')) {
      searches.push(
        this.fetchProductsBySearchTerm(query, max).pipe(
          map((items) => items.map((p) => this.mapProduct(p, q))),
          catchError(() => of([])),
        ),
      );
    }

    if (enabled.includes('inventory')) {
      searches.push(
        this.ordersApi.listInventory(query).pipe(
          map((res: KeysetListResponse<InventoryItem>) =>
            res.data.slice(0, max).map(i => this.mapInventory(i, q)),
          ),
          catchError(() => of([])),
        ),
      );
    }

    if (enabled.includes('audit')) {
      searches.push(
        this.coreApi.listAuditLogs({ action: query, limit: max }).pipe(
          map(res => res.data.map(a => this.mapAudit(a, q))),
          catchError(() => of([])),
        ),
      );
    }

    if (searches.length === 0) return of([]);

    return forkJoin(searches).pipe(
      map(groups => groups.flat().sort((a, b) => b.score - a.score)),
    );
  }

  private fetchProductsBySearchTerm(query: string, max: number): Observable<Product[]> {
    const base = this.runtimeConfig.get('ordersApiBaseUrl');
    const paramObj: Record<string, unknown> = { limit: max, searchTerm: query };
    return this.http
      .get<PageResponse<Product>>(`${base}/v1/products`, {
        params: toParams(paramObj),
      })
      .pipe(
        map((res) => res.data ?? []),
        catchError(() => of([])),
      );
  }

  private calculateScore(text: string, query: string): number {
    const lower = text.toLowerCase();
    if (lower === query) return 100;
    if (lower.startsWith(query)) return 75;
    if (lower.includes(query)) return 50;
    return 25;
  }

  private matchesOrder(order: Order, query: string): boolean {
    return (
      order.id.toLowerCase().includes(query) ||
      order.status.toLowerCase().includes(query) ||
      order.customerId.toLowerCase().includes(query) ||
      (order.currency ?? '').toLowerCase().includes(query)
    );
  }

  private matchesPayment(payment: PaymentIntent, query: string): boolean {
    return (
      payment.id.toLowerCase().includes(query) ||
      payment.status.toLowerCase().includes(query) ||
      payment.customer_ref.toLowerCase().includes(query) ||
      payment.currency.toLowerCase().includes(query)
    );
  }

  private mapTenant(tenant: Tenant, query: string): SearchResult {
    return {
      id: tenant.id,
      entityType: 'tenant',
      title: tenant.name,
      subtitle: `${tenant.plan} - ${tenant.region}`,
      icon: 'business',
      url: `/tenants/${tenant.id}`,
      score: this.calculateScore(tenant.name, query),
    };
  }

  private mapOrder(order: Order, query: string): SearchResult {
    return {
      id: order.id,
      entityType: 'order',
      title: `Order #${order.id.slice(0, 8)}`,
      subtitle: `${order.status} - ${order.currency || 'BRL'} ${order.totalAmount}`,
      icon: 'receipt_long',
      url: `/orders/${order.id}`,
      score: this.calculateScore(order.id, query),
    };
  }

  private mapPayment(payment: PaymentIntent, query: string): SearchResult {
    return {
      id: payment.id,
      entityType: 'payment',
      title: `Payment #${payment.id.slice(0, 8)}`,
      subtitle: `${payment.status} - ${payment.currency} ${payment.amount}`,
      icon: 'payment',
      url: '/payments',
      score: this.calculateScore(payment.id, query),
    };
  }

  private mapProduct(product: Product, query: string): SearchResult {
    return {
      id: product.id,
      entityType: 'product',
      title: product.name,
      subtitle: `${product.category} - ${product.currency ?? 'BRL'} ${product.price}`,
      icon: 'inventory_2',
      url: `/product/${product.id}`,
      score: this.calculateScore(product.name, query),
    };
  }

  private mapInventory(item: InventoryItem, query: string): SearchResult {
    return {
      id: item.sku,
      entityType: 'inventory',
      title: `SKU: ${item.sku}`,
      subtitle: `Qty: ${item.qty} (${item.availableQty} available)`,
      icon: 'warehouse',
      url: '/inventory',
      score: this.calculateScore(item.sku, query),
    };
  }

  private mapAudit(audit: AuditLog, query: string): SearchResult {
    return {
      id: audit.id,
      entityType: 'audit',
      title: audit.action,
      subtitle: `${audit.statusCode != null ? (audit.statusCode >= 500 ? 'ERROR' : audit.statusCode >= 400 ? 'DENIED' : 'SUCCESS') : 'N/A'} - ${audit.resourceType ?? 'N/A'}`,
      icon: 'history',
      url: '/audit',
      score: this.calculateScore(audit.action, query),
    };
  }
}
