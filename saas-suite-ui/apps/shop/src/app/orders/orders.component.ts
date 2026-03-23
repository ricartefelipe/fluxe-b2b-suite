import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrdersFacade, OrderStatus } from '@saas-suite/data-access/orders';
import { TenantContextService } from '@saas-suite/shared/http';
import { AuthStore } from '@saas-suite/shared/auth';
import { I18nService } from '@saas-suite/shared/i18n';

type StatusFilter = OrderStatus | 'ALL';

const STATUS_CLASSES: Record<OrderStatus, string> = {
  DRAFT: 'status-pending',
  CREATED: 'status-pending',
  RESERVED: 'status-pending',
  CONFIRMED: 'status-success',
  SHIPPED: 'status-info',
  DELIVERED: 'status-success',
  PAID: 'status-success',
  CANCELLED: 'status-error',
};

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
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="orders-container">
      <div class="page-header">
        <div>
          <h1>{{ i18n.messages().shop.myOrders }}</h1>
          <p class="subtitle">
            {{ i18n.messages().shop.trackOrderHistory }}
            @if (facade.orders().length > 0) {
              <span class="order-count">({{ facade.orders().length }})</span>
            }
          </p>
        </div>
        <a mat-stroked-button routerLink="/products">
          <mat-icon>storefront</mat-icon>
          {{ i18n.messages().shop.browseProducts }}
        </a>
      </div>

      <!-- Filters Bar -->
      <div class="filters-bar">
        <div class="status-chips">
          @for (s of statusOptions; track s) {
            <button
              class="status-filter-chip"
              [class.active]="selectedStatus() === s"
              (click)="setStatusFilter(s)"
            >
              {{ getStatusLabel(s) }}
            </button>
          }
        </div>

        <div class="filters-row">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>{{ i18n.messages().shop.searchByOrderId }}</mat-label>
            <input matInput [(ngModel)]="searchQuery" (ngModelChange)="applyFilters()" />
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="date-field">
            <mat-label>{{ i18n.messages().shop.dateFrom }}</mat-label>
            <input matInput [matDatepicker]="pickerFrom" [(ngModel)]="dateFrom" (dateChange)="applyFilters()" />
            <mat-datepicker-toggle matSuffix [for]="pickerFrom" />
            <mat-datepicker #pickerFrom />
          </mat-form-field>

          <mat-form-field appearance="outline" class="date-field">
            <mat-label>{{ i18n.messages().shop.dateTo }}</mat-label>
            <input matInput [matDatepicker]="pickerTo" [(ngModel)]="dateTo" (dateChange)="applyFilters()" />
            <mat-datepicker-toggle matSuffix [for]="pickerTo" />
            <mat-datepicker #pickerTo />
          </mat-form-field>
        </div>
      </div>

      @if (facade.loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40" />
          <p>{{ i18n.messages().shop.loadingOrders }}</p>
        </div>
      } @else if (filteredOrders().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">receipt_long</mat-icon>
          <h2>{{ i18n.messages().shop.noOrdersYet }}</h2>
          <p>{{ i18n.messages().shop.noOrdersMessage }}</p>
          <a mat-flat-button routerLink="/products">
            <mat-icon>storefront</mat-icon>
            {{ i18n.messages().shop.browseProducts }}
          </a>
        </div>
      } @else {
        <!-- Desktop Table -->
        <div class="orders-table-wrapper desktop-only">
          <table class="orders-table">
            <thead>
              <tr>
                <th>{{ i18n.messages().shop.orderId }}</th>
                <th>{{ i18n.messages().shop.orderDate }}</th>
                <th>{{ i18n.messages().shop.status }}</th>
                <th>{{ i18n.messages().shop.items }}</th>
                <th>{{ i18n.messages().shop.total }}</th>
                <th>{{ i18n.messages().shop.orderActions }}</th>
              </tr>
            </thead>
            <tbody>
              @for (order of filteredOrders(); track order.id) {
                <tr>
                  <td>
                    <div class="order-id-cell">
                      <code class="order-id">{{ order.id | slice:0:8 }}...</code>
                      <button
                        mat-icon-button
                        class="copy-btn"
                        (click)="copyOrderId(order.id)"
                        [matTooltip]="i18n.messages().shop.copyOrderId"
                      >
                        <mat-icon>content_copy</mat-icon>
                      </button>
                    </div>
                  </td>
                  <td>{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>
                    <span class="status-chip" [class]="getStatusClass(order.status)">
                      {{ i18n.messages().statuses[order.status] }}
                    </span>
                  </td>
                  <td>{{ order.items.length }}</td>
                  <td class="total-cell">{{ order.totalAmount | currency:(order.currency || 'BRL'):'symbol':'1.2-2' }}</td>
                  <td>
                    <a mat-icon-button [routerLink]="['/orders', order.id]" [matTooltip]="i18n.messages().shop.viewDetails">
                      <mat-icon>visibility</mat-icon>
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="orders-grid mobile-only">
          @for (order of filteredOrders(); track order.id) {
            <mat-card appearance="outlined" class="order-card" [routerLink]="['/orders', order.id]">
              <mat-card-content>
                <div class="card-header-row">
                  <code class="order-id">{{ order.id | slice:0:8 }}...</code>
                  <span class="status-chip" [class]="getStatusClass(order.status)">
                    {{ i18n.messages().statuses[order.status] }}
                  </span>
                </div>
                <div class="card-detail-row">
                  <span class="card-label">{{ i18n.messages().shop.orderDate }}</span>
                  <span>{{ order.createdAt | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="card-detail-row">
                  <span class="card-label">{{ i18n.messages().shop.items }}</span>
                  <span>{{ order.items.length }}</span>
                </div>
                <mat-divider />
                <div class="card-detail-row card-total">
                  <span class="card-label">{{ i18n.messages().shop.total }}</span>
                  <strong>{{ order.totalAmount | currency:(order.currency || 'BRL'):'symbol':'1.2-2' }}</strong>
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
      max-width: 1100px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .page-header h1 { font-size: 24px; }
    .subtitle { color: var(--shop-text-secondary); margin: 4px 0 0; }
    .order-count { font-weight: 600; }

    .filters-bar { margin-bottom: 24px; }

    .status-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }

    .status-filter-chip {
      padding: 6px 16px;
      border-radius: 20px;
      border: 1px solid var(--shop-border);
      background: transparent;
      color: var(--shop-text-secondary);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .status-filter-chip:hover { background: var(--shop-hover); }

    .status-filter-chip.active {
      background: var(--shop-primary);
      color: white;
      border-color: var(--shop-primary);
    }

    .filters-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .search-field { flex: 1; min-width: 200px; }
    .date-field { width: 160px; }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 0;
      gap: 16px;
      color: var(--shop-text-secondary);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 80px 24px;
      text-align: center;
      gap: 12px;
    }

    .empty-icon { font-size: 64px; width: 64px; height: 64px; color: #b0bec5; }
    .empty-state h2 { margin-top: 8px; }
    .empty-state p { color: var(--shop-text-secondary); margin-bottom: 12px; }

    /* Desktop Table */
    .orders-table-wrapper {
      overflow-x: auto;
      border: 1px solid var(--shop-border);
      border-radius: 12px;
      background: var(--shop-surface);
    }

    .orders-table {
      width: 100%;
      border-collapse: collapse;
    }

    .orders-table th {
      text-align: left;
      padding: 12px 16px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--shop-text-secondary);
      border-bottom: 1px solid var(--shop-border);
      background: var(--shop-code-bg);
    }

    .orders-table td {
      padding: 12px 16px;
      font-size: 14px;
      border-bottom: 1px solid var(--shop-border);
      color: var(--shop-text);
    }

    .orders-table tbody tr:last-child td { border-bottom: none; }

    .orders-table tbody tr:hover { background: var(--shop-hover); }

    .order-id-cell {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .order-id {
      background: var(--shop-code-bg);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 13px;
      color: var(--shop-primary);
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
    }

    .copy-btn {
      width: 24px !important;
      height: 24px !important;
      line-height: 24px !important;
    }

    .copy-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .total-cell { font-weight: 600; }

    .status-chip {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-success { background: var(--shop-success-bg); color: var(--shop-success); }
    .status-error { background: var(--shop-error-bg); color: var(--shop-error); }
    .status-pending { background: #fff3e0; color: #e65100; }

    /* Mobile Cards */
    .orders-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .order-card {
      cursor: pointer;
      border-radius: 12px !important;
      transition: box-shadow 0.2s;
    }

    .order-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }

    .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .card-detail-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 14px;
    }

    .card-label { color: var(--shop-text-secondary); font-size: 13px; }

    .card-total { padding-top: 12px; font-size: 16px; }

    .desktop-only { display: block; }
    .mobile-only { display: none; }

    @media (max-width: 768px) {
      .desktop-only { display: none; }
      .mobile-only { display: flex; }
      .page-header { flex-direction: column; gap: 16px; }
      .filters-row { flex-direction: column; }
      .date-field { width: 100%; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersComponent implements OnInit {
  protected readonly facade = inject(OrdersFacade);
  protected readonly i18n = inject(I18nService);
  private readonly tenantCtx = inject(TenantContextService);
  private readonly authStore = inject(AuthStore);
  private readonly snackBar = inject(MatSnackBar);

  readonly statusOptions: StatusFilter[] = ['ALL', 'DRAFT', 'RESERVED', 'CONFIRMED', 'PAID', 'CANCELLED'];
  readonly selectedStatus = signal<StatusFilter>('ALL');
  searchQuery = '';
  dateFrom: Date | null = null;
  dateTo: Date | null = null;

  readonly filteredOrders = computed(() => {
    let orders = this.facade.orders();
    const status = this.selectedStatus();
    if (status !== 'ALL') {
      orders = orders.filter(o => o.status === status);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      orders = orders.filter(o => o.id.toLowerCase().includes(q));
    }
    if (this.dateFrom) {
      const from = this.dateFrom.getTime();
      orders = orders.filter(o => new Date(o.createdAt).getTime() >= from);
    }
    if (this.dateTo) {
      const to = this.dateTo.getTime() + 86400000;
      orders = orders.filter(o => new Date(o.createdAt).getTime() <= to);
    }
    return orders;
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    const tenantId = this.tenantCtx.getActiveTenantId();
    if (tenantId) {
      this.tenantCtx.setActiveTenantId(tenantId);
    }
    this.facade.loadOrders({});
  }

  setStatusFilter(status: StatusFilter): void {
    this.selectedStatus.set(status);
  }

  applyFilters(): void {
    this.selectedStatus.update(s => s);
  }

  getStatusLabel(status: StatusFilter): string {
    if (status === 'ALL') return this.i18n.messages().shop.allStatuses;
    const msgs = this.i18n.messages();
    const map: Record<OrderStatus, string> = {
      DRAFT: msgs.orders.draft,
      CREATED: msgs.statuses['CREATED'],
      RESERVED: msgs.orders.reserved,
      CONFIRMED: msgs.orders.confirmed,
      SHIPPED: msgs.statuses['SHIPPED'],
      DELIVERED: msgs.statuses['DELIVERED'],
      PAID: msgs.orders.paid,
      CANCELLED: msgs.orders.cancelled,
    };
    return map[status];
  }

  getStatusClass(status: OrderStatus): string {
    return STATUS_CLASSES[status];
  }

  copyOrderId(id: string): void {
    navigator.clipboard.writeText(id);
    this.snackBar.open(this.i18n.messages().shop.copiedToClipboard, '', { duration: 2000 });
  }
}
