import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdersFacade } from '@saas-suite/data-access/orders';
import { TenantContextService } from '@saas-suite/shared/http';
import { formatDateTime } from '@saas-suite/shared/util';
import { StatusChipComponent } from '@saas-suite/shared/ui';

const DEMO_TENANTS = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Tenant A' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Tenant B' },
];

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CurrencyPipe, StatusChipComponent],
  template: `
    <div class="orders-page">
      <div class="header">
        <h1>Meus Pedidos</h1>
        <a routerLink="/products" class="btn-link">← Voltar aos produtos</a>
      </div>

      <div class="filters">
        <label for="tenant-select-orders">Tenant</label>
        <select id="tenant-select-orders" [(ngModel)]="selectedTenantId" (ngModelChange)="loadOrders()">
          @for (t of demoTenants; track t.id) {
            <option [value]="t.id">{{ t.name }}</option>
          }
        </select>
      </div>

      @if (facade.loading()) {
        <p>Carregando...</p>
      } @else if (facade.orders().length === 0) {
        <div class="empty">
          <p>Nenhum pedido encontrado.</p>
          <a routerLink="/products" class="btn-primary">Ver produtos</a>
        </div>
      } @else {
        <div class="orders-list">
          @for (o of facade.orders(); track o.id) {
            <div class="order-card">
              <div class="order-header">
                <span class="id">{{ o.id }}</span>
                <saas-status-chip [status]="o.status" />
              </div>
              <div class="order-body">
                <p>{{ o.items.length }} item(ns) · {{ o.totalAmount | currency }}</p>
                <p class="date">{{ fmtDate(o.createdAt) }}</p>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .orders-page {
        max-width: 800px;
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
      .btn-link {
        color: #3498db;
        text-decoration: none;
      }
      .btn-link:hover {
        text-decoration: underline;
      }
      .filters {
        margin-bottom: 24px;
      }
      .filters label {
        display: block;
        margin-bottom: 4px;
      }
      .filters select {
        padding: 8px 12px;
        min-width: 200px;
      }
      .empty {
        text-align: center;
        padding: 48px;
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
      .orders-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .order-card {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 16px;
      }
      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .order-header .id {
        font-family: monospace;
        font-size: 12px;
      }
      .order-body p {
        margin: 4px 0;
        color: #666;
      }
      .order-body .date {
        font-size: 12px;
      }
    `,
  ],
})
export class OrdersComponent implements OnInit {
  protected facade = inject(OrdersFacade);
  private tenantCtx = inject(TenantContextService);

  demoTenants = DEMO_TENANTS;
  selectedTenantId = DEMO_TENANTS[0].id;

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.tenantCtx.setActiveTenantId(this.selectedTenantId);
    this.facade.loadOrders({});
  }

  fmtDate(d: string): string {
    return formatDateTime(d);
  }
}
