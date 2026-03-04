import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product } from '@union.solutions/models';
import { OrderItem } from '@saas-suite/data-access/orders';
import { TenantContextService } from '@saas-suite/shared/http';

export interface CartItem {
  product: Product;
  quantity: number;
}

const STORAGE_PREFIX = 'fluxe-cart-';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly tenantCtx = inject(TenantContextService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly _items = signal<CartItem[]>(this.restoreFromStorage());

  readonly items = this._items.asReadonly();
  readonly totalItems = computed(() =>
    this._items().reduce((sum, i) => sum + i.quantity, 0)
  );
  readonly totalAmount = computed(() =>
    this._items().reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  );

  addItem(product: Product, quantity = 1): void {
    const current = this._items();
    const existing = current.find((i) => i.product.id === product.id);
    if (existing) {
      this._items.set(
        current.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      );
    } else {
      this._items.set([...current, { product, quantity }]);
    }
    this.persist();
  }

  removeItem(productId: string): void {
    this._items.set(this._items().filter((i) => i.product.id !== productId));
    this.persist();
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    this._items.set(
      this._items().map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      )
    );
    this.persist();
  }

  clear(): void {
    this._items.set([]);
    this.persist();
  }

  toOrderItems(): OrderItem[] {
    return this._items().map((i) => ({
      sku: i.product.sku ?? i.product.id,
      qty: i.quantity,
      price: Number(i.product.price),
    }));
  }

  private storageKey(): string {
    const tenantId = this.tenantCtx.getActiveTenantId() ?? 'default';
    return `${STORAGE_PREFIX}${tenantId}`;
  }

  private persist(): void {
    if (!this.isBrowser) return;
    try {
      const serializable = this._items().map((i) => ({
        product: i.product,
        quantity: i.quantity,
      }));
      localStorage.setItem(this.storageKey(), JSON.stringify(serializable));
    } catch { /* quota exceeded – silently ignore */ }
  }

  private restoreFromStorage(): CartItem[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(this.storageKey());
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CartItem[];
      return Array.isArray(parsed) ? parsed.filter((i) => i.product && i.quantity > 0) : [];
    } catch {
      return [];
    }
  }
}
