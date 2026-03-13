import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { Product, PaginatedResponse, ProductFilter } from '@union.solutions/models';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { PageResponse, toParams } from '@saas-suite/shared/http';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigService);

  private get base(): string {
    return this.config.get('ordersApiBaseUrl');
  }

  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  getProducts(
    filter?: ProductFilter,
    page = 1,
    pageSize = 12
  ): Observable<PaginatedResponse<Product>> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const paramObj: Record<string, unknown> = { page, pageSize };
    if (filter) {
      if (filter.category) paramObj['category'] = filter.category;
      if (filter.minPrice !== undefined) paramObj['minPrice'] = filter.minPrice;
      if (filter.maxPrice !== undefined) paramObj['maxPrice'] = filter.maxPrice;
      if (filter.inStock !== undefined) paramObj['inStock'] = filter.inStock;
      if (filter.searchTerm) paramObj['searchTerm'] = filter.searchTerm;
      if (filter.sortBy && filter.sortBy !== 'relevance') paramObj['sortBy'] = filter.sortBy;
      if (filter.sortOrder) paramObj['sortOrder'] = filter.sortOrder;
    }

    return this.http
      .get<PageResponse<Product>>(`${this.base}/v1/products`, {
        params: toParams(paramObj),
      })
      .pipe(
        map((res) => {
          this.loadingSignal.set(false);
          const items = res.data ?? [];
          const total = res.total ?? items.length;
          const pg = res.page ?? page;
          const ps = res.pageSize ?? pageSize;
          return {
            items,
            total,
            page: pg,
            pageSize: ps,
            totalPages: ps > 0 ? Math.ceil(total / ps) : 1,
          };
        }),
        catchError((error) => {
          this.loadingSignal.set(false);
          this.errorSignal.set(
            error.message || 'An error occurred while loading products'
          );
          console.error('Error loading products:', error);
          return of({
            items: [],
            total: 0,
            page: 1,
            pageSize: 12,
            totalPages: 0,
          });
        })
      );
  }

  getProductById(id: string): Observable<Product | null> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .get<Product>(`${this.base}/v1/products/${id}`)
      .pipe(
        map((product) => {
          this.loadingSignal.set(false);
          return product;
        }),
        catchError((error) => {
          this.loadingSignal.set(false);
          this.errorSignal.set(
            error.message || 'An error occurred while loading the product'
          );
          console.error('Error loading product:', error);
          return of(null);
        })
      );
  }

  getCategories(): Observable<string[]> {
    return this.http
      .get<string[]>(`${this.base}/v1/products/metadata/categories`)
      .pipe(
        catchError((error) => {
          console.error('Error loading categories:', error);
          return of([]);
        })
      );
  }

  getPriceRange(): Observable<{ min: number; max: number }> {
    return this.http
      .get<{ min: number; max: number }>(
        `${this.base}/v1/products/metadata/price-range`
      )
      .pipe(
        catchError((error) => {
          console.error('Error loading price range:', error);
          return of({ min: 0, max: 1000 });
        })
      );
  }
}