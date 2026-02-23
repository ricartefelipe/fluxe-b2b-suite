import { Injectable, signal, computed } from '@angular/core';
import { Product } from '@union.solutions/models';
import { OrderItem } from '@saas-suite/data-access/orders';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>([]);

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
  }

  removeItem(productId: string): void {
    this._items.set(this._items().filter((i) => i.product.id !== productId));
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
  }

  clear(): void {
    this._items.set([]);
  }

  toOrderItems(): OrderItem[] {
    return this._items().map((i) => ({
      sku: i.product.id,
      quantity: i.quantity,
      unitPrice: i.product.price,
      description: i.product.name,
    }));
  }
}
