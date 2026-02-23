import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '@union.solutions/shop/data';
import { OrdersFacade } from '@saas-suite/data-access/orders';
import { TenantContextService } from '@saas-suite/shared/http';

const DEMO_TENANTS = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Tenant A (Demo)' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Tenant B (Demo)' },
];

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CurrencyPipe],
  template: `
    <div class="checkout-page">
      <div class="header">
        <h1>Checkout</h1>
        <a routerLink="/products">← Continuar comprando</a>
      </div>

      @if (cart.items().length === 0) {
        <div class="empty">
          <p>Carrinho vazio.</p>
          <a routerLink="/products" class="btn-primary">Ver produtos</a>
        </div>
      } @else {
        <div class="form-section">
          <label for="tenant-select">Tenant (demo)</label>
          <select id="tenant-select" [(ngModel)]="selectedTenantId">
            @for (t of demoTenants; track t.id) {
              <option [value]="t.id">{{ t.name }}</option>
            }
          </select>
        </div>

        <div class="items">
          <h2>Itens</h2>
          @for (item of cart.items(); track item.product.id) {
            <div class="item-row">
              <span class="name">{{ item.product.name }}</span>
              <span class="qty">{{ item.quantity }} x</span>
              <span class="price">{{ item.product.price * item.quantity | currency }}</span>
            </div>
          }
          <div class="total">
            <strong>Total: {{ cart.totalAmount() | currency }}</strong>
          </div>
        </div>

        @if (error()) {
          <div class="error">{{ error() }}</div>
        }

        <div class="actions">
          <button class="btn-primary" [disabled]="placing()" (click)="placeOrder()">
            {{ placing() ? 'Criando...' : 'Finalizar pedido' }}
          </button>
          <button class="btn-secondary" (click)="cart.clear()">Limpar carrinho</button>
        </div>

        @if (lastOrder()) {
          <div class="success">
            <p>Pedido criado: {{ lastOrder()!.id }}</p>
            <p>Status: {{ lastOrder()!.status }}</p>
            <a routerLink="/orders" class="btn-primary">Ver meus pedidos</a>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .checkout-page {
        max-width: 600px;
        margin: 0 auto;
        padding: 24px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }
      .header h1 {
        margin: 0;
      }
      .empty {
        text-align: center;
        padding: 48px;
      }
      .form-section {
        margin-bottom: 24px;
      }
      .items {
        background: #f5f5f5;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 24px;
      }
      .item-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
      }
      .total {
        border-top: 1px solid #ddd;
        padding-top: 12px;
        margin-top: 12px;
      }
      .error {
        color: #c62828;
        padding: 12px;
        background: #ffebee;
        border-radius: 8px;
        margin-bottom: 16px;
      }
      .actions {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
      }
      .success {
        background: #e8f5e9;
        padding: 16px;
        border-radius: 8px;
      }
      .success p {
        margin: 0 0 8px;
      }
      .btn-primary {
        padding: 12px 24px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
      }
      .btn-primary:hover:not(:disabled) {
        background: #2980b9;
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .btn-secondary {
        padding: 12px 24px;
        background: transparent;
        color: #3498db;
        border: 2px solid #3498db;
        border-radius: 4px;
        cursor: pointer;
      }
      .form-section label {
        display: block;
        margin-bottom: 4px;
      }
      .form-section select {
        padding: 8px 12px;
        min-width: 200px;
      }
    `,
  ],
})
export class CheckoutComponent {
  protected cart: CartService = inject(CartService);
  private ordersFacade = inject(OrdersFacade);
  private tenantCtx = inject(TenantContextService);
  private router = inject(Router);

  demoTenants = DEMO_TENANTS;
  selectedTenantId = DEMO_TENANTS[0].id;
  placing = signal(false);
  error = signal<string | null>(null);
  lastOrder = signal<{ id: string; status: string } | null>(null);

  async placeOrder(): Promise<void> {
    this.error.set(null);
    this.lastOrder.set(null);
    this.tenantCtx.setActiveTenantId(this.selectedTenantId);
    this.placing.set(true);
    try {
      const order = await this.ordersFacade.createOrder({
        customerId: 'shop-guest',
        items: this.cart.toOrderItems(),
        currency: 'BRL',
      });
      if (order) {
        this.lastOrder.set({ id: order.id, status: order.status });
        this.cart.clear();
      } else {
        this.error.set('Não foi possível criar o pedido. Verifique se o backend está rodando.');
      }
    } catch (e) {
      this.error.set(
        e instanceof Error ? e.message : 'Erro ao criar pedido'
      );
    } finally {
      this.placing.set(false);
    }
  }
}
