import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { OrdersFacade, OrderStatus } from '@saas-suite/data-access/orders';
import { TenantContextService } from '@saas-suite/shared/http';
import { EmptyStateComponent } from '@saas-suite/shared/ui';

const DEMO_TENANTS = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Tenant A' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Tenant B' },
];

function statusColorClass(status: OrderStatus): string {
  switch (status) {
    case 'CONFIRMED':
    case 'PAID':
      return 'status-success';
    case 'CANCELLED':
      return 'status-error';
    case 'DRAFT':
    case 'RESERVED':
      return 'status-pending';
  }
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    SlicePipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    EmptyStateComponent,
  ],
  template: `
    <div class="orders-container">
      <div class="page-header">
        <div>
          <h1>My Orders</h1>
          <p class="subtitle">Track your order history and status</p>
        </div>
        <a mat-stroked-button routerLink="/products">
          <mat-icon>storefront</mat-icon>
          Browse Products
        </a>
      </div>

      <div class="filters-bar">
        <mat-form-field appearance="outline" class="tenant-select">
          <mat-label>Tenant</mat-label>
          <mat-select [(ngModel)]="selectedTenantId" (ngModelChange)="loadOrders()">
            @for (t of demoTenants; track t.id) {
              <mat-option [value]="t.id">{{ t.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      @if (facade.loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40" />
          <p>Loading orders...</p>
        </div>
      } @else if (facade.orders().length === 0) {
        <saas-empty-state
          icon="receipt_long"
          title="No orders yet"
          subtitle="Your order history will appear here once you place an order."
          actionLabel="Browse Products"
          actionRouterLink="/products"
          actionIcon="storefront"
        />
      } @else {
        <div class="orders-grid">
          @for (order of facade.orders(); track order.id) {
            <mat-card appearance="outlined" class="order-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>receipt</mat-icon>
                <mat-card-title>
                  <code class="order-id">{{ order.id | slice:0:8 }}...</code>
                </mat-card-title>
                <mat-card-subtitle>{{ order.createdAt | date:'medium' }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="order-details">
                  <div class="detail-row">
                    <span class="label">Status</span>
                    <span class="status-chip" [class]="getStatusClass(order.status)">
                      {{ order.status }}
                    </span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Items</span>
                    <span>{{ order.items.length }} item(s)</span>
                  </div>
                  <mat-divider />
                  <div class="detail-row total-row">
                    <span class="label">Total</span>
                    <strong>{{ order.totalAmount | currency }}</strong>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .orders-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .page-header h1 {
      font-size: 24px;
    }

    .subtitle {
      color: var(--shop-text-secondary);
      margin: 4px 0 0;
    }

    .filters-bar {
      margin-bottom: 24px;
    }

    .tenant-select {
      min-width: 220px;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 0;
      gap: 16px;
      color: var(--shop-text-secondary);
    }

    .orders-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
    }

    .order-card {
      border-radius: 12px !important;
    }

    .order-id {
      background: #eef2f7;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 13px;
      color: var(--shop-primary);
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
    }

    .order-details {
      padding-top: 8px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
    }

    .detail-row .label {
      color: var(--shop-text-secondary);
      font-size: 13px;
    }

    .total-row {
      padding-top: 12px;
      font-size: 16px;
    }

    .status-chip {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-success {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-error {
      background: #ffebee;
      color: #c62828;
    }

    .status-pending {
      background: #fff3e0;
      color: #e65100;
    }

    @media (max-width: 600px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
      }
      .orders-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class OrdersComponent implements OnInit {
  protected readonly facade = inject(OrdersFacade);
  private readonly tenantCtx = inject(TenantContextService);

  readonly demoTenants = DEMO_TENANTS;
  selectedTenantId = DEMO_TENANTS[0].id;

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.tenantCtx.setActiveTenantId(this.selectedTenantId);
    this.facade.loadOrders({});
  }

  getStatusClass(status: OrderStatus): string {
    return statusColorClass(status);
  }
}
