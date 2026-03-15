import { Component, inject, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe, SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StatusChipComponent } from '@saas-suite/shared/ui';
import { I18nService } from '@saas-suite/shared/i18n';
import { DashboardStore } from '@saas-suite/domains/ops';
import { formatDateTime } from '@saas-suite/shared/util';

const DONUT_RADIUS = 70;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const BAR_MAX_HEIGHT = 170;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CurrencyPipe, SlicePipe, RouterLink,
    MatCardModule, MatTableModule, MatIconModule, MatProgressBarModule,
    MatButtonModule, MatListModule, MatTooltipModule,
    StatusChipComponent,
  ],
  template: `
    <div class="dashboard">
      @if (store.loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (store.loadError()) {
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon class="error-icon">error_outline</mat-icon>
            <p class="error-message">{{ i18n.messages().dashboard.loadError }}</p>
            <button mat-raised-button color="primary" (click)="retryLoad()">{{ i18n.messages().dashboard.loadErrorAction }}</button>
          </mat-card-content>
        </mat-card>
      } @else {
      <h1 class="page-title">{{ i18n.messages().dashboard.title }}</h1>

      <!-- KPI Cards -->
      <div class="kpi-row">
        <mat-card class="kpi-card">
          <mat-card-content class="kpi-content">
            <div class="kpi-icon kpi-icon--blue"><mat-icon>receipt_long</mat-icon></div>
            <div class="kpi-data">
              <span class="kpi-value">{{ store.totalOrders() }}</span>
              <span class="kpi-label">{{ i18n.messages().dashboard.totalOrders }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card">
          <mat-card-content class="kpi-content">
            <div class="kpi-icon kpi-icon--green"><mat-icon>trending_up</mat-icon></div>
            <div class="kpi-data">
              <span class="kpi-value">{{ store.totalRevenue() | currency:store.currency():'symbol':'1.2-2' }}</span>
              <span class="kpi-label">{{ i18n.messages().dashboard.totalRevenue }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card">
          <mat-card-content class="kpi-content">
            <div class="kpi-icon kpi-icon--amber"><mat-icon>inventory_2</mat-icon></div>
            <div class="kpi-data">
              <span class="kpi-value">{{ store.activeInventoryItems() }}</span>
              <span class="kpi-label">{{ i18n.messages().dashboard.activeInventory }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card">
          <mat-card-content class="kpi-content">
            <div class="kpi-icon kpi-icon--orange"><mat-icon>payments</mat-icon></div>
            <div class="kpi-data">
              <span class="kpi-value">{{ store.pendingPayments() }}</span>
              <span class="kpi-label">{{ i18n.messages().dashboard.pendingPayments }}</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
      <!-- Charts: SVG por opção (sem dependência de lib de gráficos). -->
        <!-- Revenue Bar Chart -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>{{ i18n.messages().dashboard.revenueLast7Days }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <svg viewBox="-5 0 495 230" class="bar-chart" overflow="visible" role="img" aria-label="Gráfico de receita dos últimos 7 dias">
              @for (tick of yAxisTicks(); track tick.label) {
                <line x1="20" [attr.y1]="tick.y" x2="480" [attr.y2]="tick.y" class="grid-line" />
                <text x="16" [attr.y]="tick.y + 3" text-anchor="end" class="axis-label">{{ tick.label }}</text>
              }
              <text x="16" y="193" text-anchor="end" class="axis-label">0</text>

              <line x1="20" y1="10" x2="20" y2="190" class="axis" />
              <line x1="20" y1="190" x2="480" y2="190" class="axis" />

              @for (day of store.dailyRevenue(); track day.date; let i = $index) {
                <rect
                  [attr.x]="i * 64 + 36"
                  [attr.y]="190 - barHeight(day.amount)"
                  width="44"
                  [attr.height]="barHeight(day.amount)"
                  rx="4"
                  class="bar"
                  [class.bar--zero]="day.amount === 0"
                  [style.animation-delay]="i * 80 + 'ms'"
                  [matTooltip]="day.label + ': ' + formatCurrency(day.amount)"
                />
                <text
                  [attr.x]="i * 64 + 58"
                  y="210"
                  text-anchor="middle"
                  class="bar-label"
                >{{ day.label }}</text>
                @if (day.amount > 0) {
                  <text
                    [attr.x]="i * 64 + 58"
                    [attr.y]="190 - barHeight(day.amount) - 6"
                    text-anchor="middle"
                    class="bar-value"
                  >{{ shortCurrency(day.amount) }}</text>
                }
              }
            </svg>
          </mat-card-content>
        </mat-card>

        <!-- Orders by Status Donut -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>{{ i18n.messages().dashboard.ordersByStatus }}</mat-card-title>
          </mat-card-header>
          <mat-card-content class="donut-layout">
            <svg viewBox="0 0 200 200" class="donut-chart" role="img" aria-label="Gráfico de pedidos por status">
              <g transform="rotate(-90 100 100)">
                @for (seg of donutSegments(); track seg.status; let i = $index) {
                  @if (seg.count > 0) {
                    <circle
                      cx="100" cy="100" r="70"
                      fill="none"
                      [attr.stroke]="seg.color"
                      stroke-width="28"
                      [attr.stroke-dasharray]="seg.dashArray"
                      [attr.stroke-dashoffset]="seg.dashOffset"
                      [matTooltip]="translateStatus(seg.status) + ': ' + seg.count + ' (' + seg.pct + '%)'"
                      class="donut-segment"
                      [style.animation-delay]="i * 120 + 'ms'"
                    />
                  }
                }
              </g>
              <text x="100" y="96" text-anchor="middle" class="donut-total">{{ store.totalOrders() }}</text>
              <text x="100" y="114" text-anchor="middle" class="donut-total-label">{{ i18n.messages().dashboard.ordersLabel }}</text>
            </svg>
            <div class="legend">
              @for (seg of donutSegments(); track seg.status) {
                <div class="legend-item">
                  <span class="legend-dot" [style.background]="seg.color"></span>
                  <span class="legend-status">{{ translateStatus(seg.status) }}</span>
                  <span class="legend-count">{{ seg.count }} ({{ seg.pct }}%)</span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Bottom Row -->
      <div class="bottom-row">
        <!-- Recent Orders Table -->
        <mat-card class="table-card">
          <mat-card-header>
            <mat-card-title>{{ i18n.messages().dashboard.recentOrders }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (store.recentOrders().length > 0) {
              <table mat-table [dataSource]="store.recentOrders()" class="full-width">
                <ng-container matColumnDef="id">
                  <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.id }}</th>
                  <td mat-cell *matCellDef="let o">
                    <a [routerLink]="['/orders', o.id]" class="order-link">{{ o.id | slice:0:8 }}…</a>
                  </td>
                </ng-container>
                <ng-container matColumnDef="customerId">
                  <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().orders.customer }}</th>
                  <td mat-cell *matCellDef="let o">{{ o.customerId | slice:0:8 }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.status }}</th>
                  <td mat-cell *matCellDef="let o"><saas-status-chip [status]="o.status" /></td>
                </ng-container>
                <ng-container matColumnDef="totalAmount">
                  <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.amount }}</th>
                  <td mat-cell *matCellDef="let o">{{ o.totalAmount | currency:(o.currency || 'BRL'):'symbol':'1.2-2' }}</td>
                </ng-container>
                <ng-container matColumnDef="createdAt">
                  <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.date }}</th>
                  <td mat-cell *matCellDef="let o">{{ fmtDate(o.createdAt) }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="orderColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: orderColumns;"></tr>
              </table>
            } @else {
              <p class="empty-hint">{{ i18n.messages().orders.noOrdersFound }}</p>
            }
          </mat-card-content>
        </mat-card>

        <!-- Inventory Alerts -->
        <mat-card class="alerts-card">
          <mat-card-header>
            <mat-card-title>{{ i18n.messages().dashboard.inventoryAlerts }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (store.lowStockItems().length > 0) {
              <h3 class="section-subtitle">{{ i18n.messages().dashboard.lowStock }}</h3>
              <mat-list>
                @for (item of store.lowStockItems(); track item.sku) {
                  <mat-list-item>
                    <mat-icon matListItemIcon class="warning-icon">warning</mat-icon>
                    <span matListItemTitle>{{ item.sku }}</span>
                    <span matListItemLine>{{ i18n.messages().dashboard.availableQty }}: {{ item.availableQty }}</span>
                  </mat-list-item>
                }
              </mat-list>
            } @else {
              <p class="empty-hint">{{ i18n.messages().dashboard.noLowStock }}</p>
            }

            @if (store.recentAdjustments().length > 0) {
              <h3 class="section-subtitle">{{ i18n.messages().dashboard.recentAdjustments }}</h3>
              <mat-list>
                @for (adj of store.recentAdjustments(); track adj.id) {
                  <mat-list-item>
                    <mat-icon matListItemIcon>
                      @switch (adj.type) {
                        @case ('IN') { add_circle }
                        @case ('OUT') { remove_circle }
                        @default { swap_horiz }
                      }
                    </mat-icon>
                    <span matListItemTitle>{{ adj.sku }} — {{ translateStatus(adj.type) }} {{ adj.qty }}</span>
                    <span matListItemLine>{{ adj.reason }} · {{ fmtDate(adj.createdAt) }}</span>
                  </mat-list-item>
                }
              </mat-list>
            }
          </mat-card-content>
        </mat-card>
      </div>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 8px 0;
    }

    .error-card {
      margin-bottom: 24px;
      border-radius: 12px;
      text-align: center;
      padding: 32px;
    }
    .error-card mat-card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .error-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--app-chip-warn-text);
    }
    .error-message {
      margin: 0;
      font-size: 15px;
      color: var(--app-text-secondary);
      max-width: 480px;
    }

    .page-title {
      margin: 0 0 24px;
      font-size: 24px;
      font-weight: 500;
      color: var(--app-text);
    }

    /* ── KPI Cards ────────────────────────────────────── */

    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      border-radius: 12px;
    }

    .kpi-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px 0 !important;
    }

    .kpi-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      flex-shrink: 0;
    }

    .kpi-icon mat-icon {
      color: var(--app-surface);
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .kpi-icon--blue  { background: var(--app-primary-light); }
    .kpi-icon--green { background: var(--app-chip-allow-text); }
    .kpi-icon--amber { background: var(--app-chip-warn-text); }
    .kpi-icon--orange { background: var(--app-chip-warn-text); }

    .kpi-data {
      display: flex;
      flex-direction: column;
    }

    .kpi-value {
      font-size: 22px;
      font-weight: 600;
      color: var(--app-text);
      line-height: 1.2;
    }

    .kpi-label {
      font-size: 13px;
      color: var(--app-text-secondary);
      margin-top: 2px;
    }

    /* ── Charts ───────────────────────────────────────── */

    .charts-row {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 16px;
      margin-bottom: 24px;
    }

    .chart-card {
      border-radius: 12px;
    }

    .bar-chart {
      width: 100%;
      height: auto;
      display: block;
    }

    .grid-line {
      stroke: var(--app-border);
      stroke-width: 0.5;
      stroke-dasharray: 4 3;
      opacity: 0.5;
    }

    .axis-label {
      font-size: 9px;
      fill: var(--app-text-secondary);
    }

    .bar {
      fill: var(--app-primary);
      transform-box: fill-box;
      transform-origin: bottom center;
      animation: bar-grow 0.5s ease-out both;
      cursor: pointer;
    }

    .bar:hover {
      opacity: 1;
      filter: brightness(1.15);
    }

    .bar--zero {
      opacity: 0.35;
    }

    @keyframes bar-grow {
      from {
        transform: scaleY(0);
        opacity: 0;
      }
      to {
        transform: scaleY(1);
        opacity: 0.85;
      }
    }

    .axis {
      stroke: var(--app-border);
      stroke-width: 1;
    }

    .bar-label {
      font-size: 11px;
      fill: var(--app-text-secondary);
    }

    .bar-value {
      font-size: 9px;
      fill: var(--app-text-secondary);
      font-weight: 500;
    }

    /* ── Donut ────────────────────────────────────────── */

    .donut-layout {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .donut-chart {
      width: 180px;
      height: 180px;
      flex-shrink: 0;
    }

    .donut-segment {
      animation: donut-appear 0.6s ease-out both;
      cursor: pointer;
    }

    .donut-segment:hover {
      opacity: 0.75;
      filter: brightness(1.1);
    }

    @keyframes donut-appear {
      from {
        stroke-width: 0;
        opacity: 0;
      }
      to {
        stroke-width: 28;
        opacity: 1;
      }
    }

    .donut-total {
      font-size: 28px;
      font-weight: 600;
      fill: var(--app-text);
    }

    .donut-total-label {
      font-size: 12px;
      fill: var(--app-text-secondary);
    }

    .legend {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .legend-status {
      color: var(--app-text-secondary);
      min-width: 80px;
    }

    .legend-count {
      font-weight: 600;
      color: var(--app-text);
    }

    /* ── Bottom Row ───────────────────────────────────── */

    .bottom-row {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 16px;
    }

    .table-card,
    .alerts-card {
      border-radius: 12px;
    }

    .full-width {
      width: 100%;
    }

    .order-link {
      color: var(--app-primary);
      text-decoration: none;
      font-family: monospace;
      font-size: 12px;
    }

    .order-link:hover {
      text-decoration: underline;
    }

    .section-subtitle {
      font-size: 13px;
      font-weight: 600;
      color: var(--app-text-secondary);
      margin: 16px 0 4px;
    }

    .section-subtitle:first-child {
      margin-top: 0;
    }

    .empty-hint {
      font-size: 13px;
      color: var(--app-text-secondary);
      margin: 0;
    }

    .warning-icon {
      color: var(--app-chip-warn-text);
    }

    /* ── Responsive ───────────────────────────────────── */

    @media (max-width: 1200px) {
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
      .charts-row,
      .bottom-row { grid-template-columns: 1fr; }
    }

    @media (max-width: 600px) {
      .kpi-row { grid-template-columns: 1fr; }
      .donut-layout { flex-direction: column; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  protected store = inject(DashboardStore);
  protected i18n = inject(I18nService);

  orderColumns = ['id', 'customerId', 'status', 'totalAmount', 'createdAt'];

  readonly yAxisTicks = computed(() => {
    const max = this.store.maxDailyRevenue();
    if (!Number.isFinite(max) || max <= 0) {
      return [{ y: 190 - BAR_MAX_HEIGHT * 0.5, label: '0' }];
    }
    return [0.25, 0.5, 0.75, 1].map(pct => ({
      y: 190 - pct * BAR_MAX_HEIGHT,
      label: this.shortCurrency(max * pct),
    }));
  });

  readonly donutSegments = computed(() => {
    const statuses = this.store.ordersByStatus();
    const total = this.store.totalOrdersForChart();
    let accumulated = 0;
    return statuses.map(s => {
      const length = (s.count / total) * DONUT_CIRCUMFERENCE;
      const offset = -accumulated;
      accumulated += length;
      return {
        ...s,
        dashArray: `${length} ${DONUT_CIRCUMFERENCE - length}`,
        dashOffset: offset,
        pct: total > 0 ? Math.round((s.count / total) * 100) : 0,
      };
    });
  });

  async ngOnInit(): Promise<void> {
    await this.store.loadAll();
  }

  retryLoad(): void {
    this.store.loadAll();
  }

  /** Altura mínima em px para barras com receita zero (gráfico sempre visível). */
  private readonly MIN_BAR_HEIGHT = 18;

  barHeight(amount: number): number {
    const amt = Number(amount) || 0;
    const max = this.store.maxDailyRevenue();
    if (!Number.isFinite(max) || max <= 0) return this.MIN_BAR_HEIGHT;
    if (amt <= 0) return this.MIN_BAR_HEIGHT;
    return Math.min((amt / max) * BAR_MAX_HEIGHT, BAR_MAX_HEIGHT);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: this.store.currency(),
    }).format(amount);
  }

  shortCurrency(amount: number): string {
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k`;
    return amount.toFixed(0);
  }

  fmtDate(d: string): string {
    return formatDateTime(d);
  }

  translateStatus(s: string): string {
    return this.i18n.messages().statuses[s] ?? s;
  }
}
