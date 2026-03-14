import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { OrdersFacade, Order, OrderStatus } from '@saas-suite/data-access/orders';
import { I18nService } from '@saas-suite/shared/i18n';

interface TimelineStep {
  label: string;
  icon: string;
  status: OrderStatus;
  active: boolean;
  timestamp?: string;
}

const STATUS_ORDER: OrderStatus[] = ['DRAFT', 'RESERVED', 'CONFIRMED', 'PAID'];

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
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  template: `
    <div class="order-detail-container">
      @if (facade.loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40" />
        </div>
      } @else if (facade.selectedOrder(); as order) {
        <a routerLink="/orders" class="back-link">
          <mat-icon>arrow_back</mat-icon>
          {{ i18n.messages().shop.backToOrders }}
        </a>

        <!-- Order Header -->
        <div class="order-header">
          <div class="order-header-left">
            <h1>{{ i18n.messages().shop.orderId }}: <code>{{ order.id }}</code></h1>
            <p class="order-date">{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
          </div>
          <div class="order-header-right">
            <span class="status-chip large" [class]="getStatusClass(order.status)">
              {{ i18n.messages().statuses[order.status] ?? order.status }}
            </span>
            <button
              mat-icon-button
              (click)="copyOrderId(order.id)"
              [matTooltip]="i18n.messages().shop.copyOrderId"
            >
              <mat-icon>content_copy</mat-icon>
            </button>
          </div>
        </div>

        <div class="detail-layout">
          <!-- Items -->
          <mat-card appearance="outlined" class="detail-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>receipt_long</mat-icon>
              <mat-card-title>{{ i18n.messages().shop.items }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="items-list">
                @for (item of order.items; track $index) {
                  <div class="detail-item">
                    <div class="detail-item-info">
                      <span class="detail-item-name">{{ item.sku }}</span>
                      <span class="detail-item-sku">SKU: {{ item.sku }}</span>
                    </div>
                    <div class="detail-item-qty">× {{ item.qty }}</div>
                    <div class="detail-item-price">{{ item.price | currency:(order.currency || 'BRL'):'symbol':'1.2-2' }}</div>
                    <div class="detail-item-total">{{ item.price * item.qty | currency:(order.currency || 'BRL'):'symbol':'1.2-2' }}</div>
                  </div>
                }
              </div>

              <mat-divider />

              <div class="totals-section">
                <div class="total-line">
                  <span>{{ i18n.messages().shop.subtotal }}</span>
                  <span>{{ order.totalAmount | currency:(order.currency || 'BRL'):'symbol':'1.2-2' }}</span>
                </div>
                <div class="total-line">
                  <span>{{ i18n.messages().shop.shipping }}</span>
                  <span class="tbd">{{ i18n.messages().shop.shippingToCalculate }}</span>
                </div>
                <mat-divider />
                <div class="total-line grand-total">
                  <strong>{{ i18n.messages().shop.total }}</strong>
                  <strong>{{ order.totalAmount | currency:(order.currency || 'BRL'):'symbol':'1.2-2' }}</strong>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Timeline -->
          <mat-card appearance="outlined" class="detail-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>timeline</mat-icon>
              <mat-card-title>{{ i18n.messages().shop.orderTimeline }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="timeline">
                @for (step of getTimeline(order); track step.status) {
                  <div class="timeline-step" [class.active]="step.active" [class.cancelled]="order.status === 'CANCELLED' && step.status === 'CANCELLED'">
                    <div class="timeline-dot">
                      <mat-icon>{{ step.icon }}</mat-icon>
                    </div>
                    <div class="timeline-content">
                      <span class="timeline-label">{{ step.label }}</span>
                      @if (step.timestamp) {
                        <span class="timeline-time">{{ step.timestamp | date:'dd/MM/yyyy HH:mm' }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Actions -->
        @if (canCancel(order)) {
          <div class="actions-bar">
            <button
              mat-stroked-button
              color="warn"
              (click)="cancelOrder(order.id)"
              [disabled]="cancelling()"
            >
              <mat-icon>cancel</mat-icon>
              {{ i18n.messages().shop.cancelOrder }}
            </button>
          </div>
        }
      } @else {
        <div class="empty-state">
          <mat-icon class="empty-icon">search_off</mat-icon>
          <h2>{{ i18n.messages().shop.orderNotFound }}</h2>
          <a mat-flat-button routerLink="/orders">
            {{ i18n.messages().shop.backToOrders }}
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    .order-detail-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: 80px 0;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--shop-primary);
      text-decoration: none;
      font-size: 14px;
      margin-bottom: 20px;
    }

    .back-link:hover { text-decoration: underline; }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .order-header h1 {
      font-size: 20px;
      margin: 0;
    }

    .order-header h1 code {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 14px;
      background: var(--shop-code-bg);
      padding: 2px 8px;
      border-radius: 4px;
      color: var(--shop-primary);
    }

    .order-date {
      color: var(--shop-text-secondary);
      font-size: 14px;
      margin: 4px 0 0;
    }

    .order-header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-chip {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-chip.large {
      padding: 6px 16px;
      font-size: 13px;
    }

    .status-success { background: var(--shop-success-bg); color: var(--shop-success); }
    .status-error { background: var(--shop-error-bg); color: var(--shop-error); }
    .status-pending { background: #fff3e0; color: #e65100; }

    .detail-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
      align-items: start;
    }

    .detail-card { margin-bottom: 0; }
    .detail-card mat-card-content { padding-top: 12px; }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }

    .detail-item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .detail-item-name {
      font-weight: 500;
      font-size: 14px;
    }

    .detail-item-sku {
      font-size: 12px;
      color: var(--shop-text-secondary);
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
    }

    .detail-item-qty {
      font-size: 14px;
      color: var(--shop-text-secondary);
      min-width: 40px;
    }

    .detail-item-price {
      font-size: 14px;
      color: var(--shop-text-secondary);
      min-width: 80px;
      text-align: right;
    }

    .detail-item-total {
      font-size: 14px;
      font-weight: 600;
      min-width: 90px;
      text-align: right;
    }

    .totals-section { padding-top: 12px; }

    .total-line {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
    }

    .tbd { font-style: italic; color: var(--shop-text-secondary); }

    .grand-total {
      font-size: 18px;
      padding-top: 12px;
    }

    .grand-total strong { color: var(--shop-primary); }

    /* Timeline */
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding: 8px 0;
    }

    .timeline-step {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      position: relative;
      opacity: 0.4;
    }

    .timeline-step.active { opacity: 1; }

    .timeline-step:not(:last-child)::after {
      content: '';
      position: absolute;
      left: 15px;
      top: 42px;
      bottom: -12px;
      width: 2px;
      background: var(--shop-border);
    }

    .timeline-step.active:not(:last-child)::after {
      background: var(--shop-primary);
    }

    .timeline-dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--shop-code-bg);
      flex-shrink: 0;
    }

    .timeline-step.active .timeline-dot {
      background: var(--shop-primary);
      color: white;
    }

    .timeline-step.cancelled .timeline-dot {
      background: var(--shop-error);
      color: white;
    }

    .timeline-dot mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .timeline-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding-top: 4px;
    }

    .timeline-label { font-weight: 500; font-size: 14px; }

    .timeline-time {
      font-size: 12px;
      color: var(--shop-text-secondary);
    }

    .actions-bar {
      margin-top: 24px;
      display: flex;
      justify-content: flex-end;
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

    @media (max-width: 768px) {
      .detail-layout { grid-template-columns: 1fr; }
      .detail-item { flex-wrap: wrap; }
      .order-header { flex-direction: column; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailComponent implements OnInit {
  protected readonly facade = inject(OrdersFacade);
  protected readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly cancelling = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.loadOrder(id);
    }
  }

  getStatusClass(status: OrderStatus): string {
    return STATUS_CLASSES[status];
  }

  getTimeline(order: Order): TimelineStep[] {
    const msgs = this.i18n.messages().shop;
    const statusIndex = STATUS_ORDER.indexOf(order.status);
    const isCancelled = order.status === 'CANCELLED';

    const steps: TimelineStep[] = [
      { label: msgs.orderCreated, icon: 'add_circle', status: 'DRAFT', active: true, timestamp: order.createdAt },
      { label: msgs.orderReserved, icon: 'inventory_2', status: 'RESERVED', active: statusIndex >= 1 || isCancelled },
      { label: msgs.orderConfirmed, icon: 'check_circle', status: 'CONFIRMED', active: statusIndex >= 2 },
      { label: msgs.orderPaid, icon: 'payments', status: 'PAID', active: statusIndex >= 3 },
    ];

    if (isCancelled) {
      steps.push({
        label: msgs.orderCancelled,
        icon: 'cancel',
        status: 'CANCELLED',
        active: true,
        timestamp: order.updatedAt,
      });
    }

    return steps;
  }

  canCancel(order: Order): boolean {
    return order.status === 'DRAFT' || order.status === 'RESERVED';
  }

  async cancelOrder(orderId: string): Promise<void> {
    const msgs = this.i18n.messages().shop;
    if (!confirm(msgs.cancelOrderConfirm)) return;

    this.cancelling.set(true);
    try {
      await this.facade.cancelOrder(orderId);
    } finally {
      this.cancelling.set(false);
    }
  }

  copyOrderId(id: string): void {
    navigator.clipboard.writeText(id);
    this.snackBar.open(this.i18n.messages().shop.copiedToClipboard, '', { duration: 2000 });
  }
}
