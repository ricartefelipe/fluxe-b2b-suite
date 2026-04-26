import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { EmptyStateComponent, StatusChipComponent, TableSkeletonComponent } from '@saas-suite/shared/ui';
import { I18nService } from '@saas-suite/shared/i18n';
import { LedgerEntryRow, LedgerFacade, PaymentIntent, PaymentsFacade, PaymentStatus } from '@saas-suite/data-access/payments';
import { Order, OrderStatus, OrdersFacade } from '@saas-suite/data-access/orders';
import {
  buildCsv,
  buildDateRangeParams,
  buildLedgerCsvRows,
  buildOrderCsvRows,
  buildPaymentCsvRows,
  downloadCsv,
  filterByDateRange,
  formatCurrencyTotals,
  reportFilename,
  summarizeAmountsByCurrency,
} from '../reports/reports-export.util';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    DecimalPipe,
    NgTemplateOutlet,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatTabsModule,
    EmptyStateComponent,
    StatusChipComponent,
    TableSkeletonComponent,
  ],
  template: `
    <div class="page-header">
      <div>
        <h1>{{ msg().title }}</h1>
        <p>{{ msg().subtitle }}</p>
      </div>
    </div>

    <mat-tab-group animationDuration="150ms">
      <mat-tab [label]="msg().ordersTab">
        <section class="report-section">
          <p class="section-hint">{{ msg().ordersHint }}</p>
          <div class="filters-card">
            <h2>{{ msg().filters }}</h2>
            <div class="filters">
              <mat-form-field appearance="outline">
                <mat-label>{{ i18n.messages().common.status }}</mat-label>
                <mat-select [(ngModel)]="orderStatus">
                  <mat-option [value]="undefined">{{ i18n.messages().common.all }}</mat-option>
                  <mat-option value="DRAFT">{{ i18n.messages().orders.draft }}</mat-option>
                  <mat-option value="CREATED">Criado</mat-option>
                  <mat-option value="RESERVED">{{ i18n.messages().orders.reserved }}</mat-option>
                  <mat-option value="CONFIRMED">{{ i18n.messages().orders.confirmed }}</mat-option>
                  <mat-option value="SHIPPED">Enviado</mat-option>
                  <mat-option value="DELIVERED">Entregue</mat-option>
                  <mat-option value="PAID">{{ i18n.messages().orders.paid }}</mat-option>
                  <mat-option value="CANCELLED">{{ i18n.messages().orders.cancelled }}</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ msg().customer }}</mat-label>
                <input matInput [(ngModel)]="orderCustomer">
              </mat-form-field>
              <ng-container *ngTemplateOutlet="dateFilters; context: { from: 'ordersFrom', to: 'ordersTo' }" />
              <button mat-raised-button color="primary" (click)="loadOrders()">
                <mat-icon>search</mat-icon> {{ msg().loadData }}
              </button>
              <button mat-stroked-button (click)="exportOrders()">
                <mat-icon>download</mat-icon> {{ msg().exportCsv }}
              </button>
            </div>
          </div>

          <div class="summary-grid">
            <mat-card>
              <mat-card-title>{{ msg().records }}</mat-card-title>
              <mat-card-content>{{ reportOrders().length | number }}</mat-card-content>
            </mat-card>
            <mat-card>
              <mat-card-title>{{ msg().totalAmount }}</mat-card-title>
              <mat-card-content>{{ ordersTotalLabel() }}</mat-card-content>
            </mat-card>
          </div>

          @if (orders.loading()) {
            <saas-table-skeleton [rowCount]="5" [columns]="5" />
          } @else if (reportOrders().length === 0) {
            <saas-empty-state icon="assessment" [title]="i18n.messages().orders.noOrdersFound" />
          } @else {
            <table mat-table [dataSource]="reportOrders()" class="full-width">
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.id }}</th>
                <td mat-cell *matCellDef="let order"><code>{{ order.id.substring(0, 8) }}</code></td>
              </ng-container>
              <ng-container matColumnDef="customer">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().orders.customer }}</th>
                <td mat-cell *matCellDef="let order">{{ order.customerId }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.status }}</th>
                <td mat-cell *matCellDef="let order"><saas-status-chip [status]="order.status" /></td>
              </ng-container>
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.amount }}</th>
                <td mat-cell *matCellDef="let order">{{ order.currency || 'BRL' }} {{ order.totalAmount | number:'1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.date }}</th>
                <td mat-cell *matCellDef="let order">{{ order.createdAt }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="orderColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: orderColumns;"></tr>
            </table>
          }
        </section>
      </mat-tab>

      <mat-tab [label]="msg().paymentsTab">
        <section class="report-section">
          <p class="section-hint">{{ msg().paymentsHint }}</p>
          <div class="filters-card">
            <h2>{{ msg().filters }}</h2>
            <div class="filters">
              <mat-form-field appearance="outline">
                <mat-label>{{ i18n.messages().common.status }}</mat-label>
                <mat-select [(ngModel)]="paymentStatus">
                  <mat-option [value]="undefined">{{ i18n.messages().common.all }}</mat-option>
                  <mat-option value="CREATED">Criado</mat-option>
                  <mat-option value="PENDING">{{ i18n.messages().payments.pending }}</mat-option>
                  <mat-option value="AUTHORIZED">Autorizado</mat-option>
                  <mat-option value="CONFIRMED">{{ i18n.messages().payments.confirmed }}</mat-option>
                  <mat-option value="SETTLED">Liquidado</mat-option>
                  <mat-option value="FAILED">{{ i18n.messages().payments.failed }}</mat-option>
                  <mat-option value="CANCELLED">{{ i18n.messages().payments.cancelled }}</mat-option>
                  <mat-option value="VOIDED">Estornado/Cancelado</mat-option>
                  <mat-option value="REFUNDED">Reembolsado</mat-option>
                  <mat-option value="PARTIALLY_REFUNDED">Parcialmente reembolsado</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ msg().customer }}</mat-label>
                <input matInput [(ngModel)]="paymentCustomer">
              </mat-form-field>
              <ng-container *ngTemplateOutlet="dateFilters; context: { from: 'paymentsFrom', to: 'paymentsTo' }" />
              <button mat-raised-button color="primary" (click)="loadPayments()">
                <mat-icon>search</mat-icon> {{ msg().loadData }}
              </button>
              <button mat-stroked-button (click)="exportPayments()">
                <mat-icon>download</mat-icon> {{ msg().exportCsv }}
              </button>
            </div>
          </div>

          <div class="summary-grid">
            <mat-card>
              <mat-card-title>{{ msg().records }}</mat-card-title>
              <mat-card-content>{{ reportPayments().length | number }}</mat-card-content>
            </mat-card>
            <mat-card>
              <mat-card-title>{{ msg().totalAmount }}</mat-card-title>
              <mat-card-content>{{ paymentsTotalLabel() }}</mat-card-content>
            </mat-card>
          </div>

          @if (payments.loading()) {
            <saas-table-skeleton [rowCount]="5" [columns]="5" />
          } @else if (reportPayments().length === 0) {
            <saas-empty-state icon="payments" [title]="i18n.messages().payments.noPaymentsFound" />
          } @else {
            <table mat-table [dataSource]="reportPayments()" class="full-width">
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.id }}</th>
                <td mat-cell *matCellDef="let payment"><code>{{ payment.id.substring(0, 8) }}</code></td>
              </ng-container>
              <ng-container matColumnDef="customer">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().payments.customer }}</th>
                <td mat-cell *matCellDef="let payment">{{ payment.customer_ref }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.status }}</th>
                <td mat-cell *matCellDef="let payment"><saas-status-chip [status]="payment.status" /></td>
              </ng-container>
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.amount }}</th>
                <td mat-cell *matCellDef="let payment">{{ payment.currency }} {{ +payment.amount | number:'1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.date }}</th>
                <td mat-cell *matCellDef="let payment">{{ payment.created_at }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="paymentColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: paymentColumns;"></tr>
            </table>
          }
        </section>
      </mat-tab>

      <mat-tab [label]="msg().ledgerTab">
        <section class="report-section">
          <p class="section-hint">{{ msg().ledgerHint }}</p>
          <div class="filters-card">
            <h2>{{ msg().filters }}</h2>
            <div class="filters">
              <ng-container *ngTemplateOutlet="dateFilters; context: { from: 'ledgerFrom', to: 'ledgerTo' }" />
              <mat-form-field appearance="outline">
                <mat-label>{{ msg().currency }}</mat-label>
                <input matInput [(ngModel)]="ledgerCurrency" placeholder="BRL">
              </mat-form-field>
              <button mat-raised-button color="primary" (click)="loadLedger()">
                <mat-icon>search</mat-icon> {{ msg().loadData }}
              </button>
              <button mat-stroked-button (click)="exportLedger()">
                <mat-icon>download</mat-icon> {{ msg().exportCsv }}
              </button>
            </div>
          </div>

          <div class="summary-grid">
            <mat-card>
              <mat-card-title>{{ msg().records }}</mat-card-title>
              <mat-card-content>{{ reportLedgerEntries().length | number }}</mat-card-content>
            </mat-card>
            <mat-card>
              <mat-card-title>{{ msg().netAmount }}</mat-card-title>
              <mat-card-content>{{ ledgerNetTotalLabel() }}</mat-card-content>
            </mat-card>
          </div>

          @if (ledger.loading()) {
            <mat-progress-bar mode="indeterminate" />
          } @else if (reportLedgerEntries().length === 0) {
            <saas-empty-state icon="account_balance" [title]="i18n.messages().ledger.noEntriesFound" />
          } @else {
            <table mat-table [dataSource]="reportLedgerEntries()" class="full-width">
              <ng-container matColumnDef="postedAt">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.date }}</th>
                <td mat-cell *matCellDef="let entry">{{ entry.postedAt }}</td>
              </ng-container>
              <ng-container matColumnDef="side">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.type }}</th>
                <td mat-cell *matCellDef="let entry"><saas-status-chip [status]="entry.side" /></td>
              </ng-container>
              <ng-container matColumnDef="account">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().ledger.account }}</th>
                <td mat-cell *matCellDef="let entry">{{ entry.account }}</td>
              </ng-container>
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.amount }}</th>
                <td mat-cell *matCellDef="let entry">{{ entry.currency }} {{ entry.amount | number:'1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="reference">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().ledger.reference }}</th>
                <td mat-cell *matCellDef="let entry"><code>{{ entry.paymentIntentId?.substring(0, 8) || '—' }}</code></td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="ledgerColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: ledgerColumns;"></tr>
            </table>
          }
        </section>
      </mat-tab>
    </mat-tab-group>

    <ng-template #dateFilters let-from="from" let-to="to">
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().ledger.from }}</mat-label>
        <input matInput [matDatepicker]="fromPicker" [ngModel]="dateValue(from)" (ngModelChange)="setDateValue(from, $event)">
        <mat-datepicker-toggle matIconSuffix [for]="fromPicker" />
        <mat-datepicker #fromPicker />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().ledger.to }}</mat-label>
        <input matInput [matDatepicker]="toPicker" [ngModel]="dateValue(to)" (ngModelChange)="setDateValue(to, $event)">
        <mat-datepicker-toggle matIconSuffix [for]="toPicker" />
        <mat-datepicker #toPicker />
      </mat-form-field>
    </ng-template>
  `,
  styles: [`
    .page-header { margin-bottom: 20px; }
    .page-header h1 { margin: 0 0 4px; }
    .page-header p, .section-hint { color: var(--app-text-secondary); margin: 0; }
    .report-section { padding: 20px 0; }
    .filters-card {
      margin: 16px 0;
      padding: 16px;
      border: 1px solid var(--app-border);
      border-radius: 12px;
      background: var(--app-surface);
    }
    .filters-card h2 { font-size: 16px; margin: 0 0 12px; }
    .filters { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    mat-card-title { font-size: 13px; color: var(--app-text-secondary); }
    mat-card-content { font-size: 22px; font-weight: 700; }
    .full-width { width: 100%; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage implements OnInit {
  protected readonly i18n = inject(I18nService);
  protected readonly orders = inject(OrdersFacade);
  protected readonly payments = inject(PaymentsFacade);
  protected readonly ledger = inject(LedgerFacade);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly msg = () => this.i18n.messages().reports;

  protected readonly orderColumns = ['id', 'customer', 'status', 'amount', 'createdAt'];
  protected readonly paymentColumns = ['id', 'customer', 'status', 'amount', 'createdAt'];
  protected readonly ledgerColumns = ['postedAt', 'side', 'account', 'amount', 'reference'];

  protected orderStatus?: OrderStatus;
  protected orderCustomer = '';
  protected ordersFrom: Date | null = null;
  protected ordersTo: Date | null = null;

  protected paymentStatus?: PaymentStatus;
  protected paymentCustomer = '';
  protected paymentsFrom: Date | null = null;
  protected paymentsTo: Date | null = null;

  protected ledgerFrom: Date | null = null;
  protected ledgerTo: Date | null = null;
  protected ledgerCurrency = '';

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadOrders(), this.loadPayments(), this.loadLedger()]);
  }

  protected async loadOrders(): Promise<void> {
    await this.orders.loadAllOrders({
      status: this.orderStatus,
      q: this.blankToUndefined(this.orderCustomer),
      limit: 500,
    });
  }

  protected async loadPayments(): Promise<void> {
    await this.payments.loadAllPayments({
      status: this.paymentStatus,
      customer_ref: this.blankToUndefined(this.paymentCustomer),
      pageSize: 500,
    });
  }

  protected async loadLedger(): Promise<void> {
    await this.ledger.loadAllEntries({
      ...buildDateRangeParams({ from: this.ledgerFrom, to: this.ledgerTo }),
      currency: this.blankToUndefined(this.ledgerCurrency),
      limit: 500,
    });
  }

  protected reportOrders(): Order[] {
    return filterByDateRange(this.orders.orders(), order => order.createdAt, {
      from: this.ordersFrom,
      to: this.ordersTo,
    });
  }

  protected reportPayments(): PaymentIntent[] {
    return filterByDateRange(this.payments.payments(), payment => payment.created_at, {
      from: this.paymentsFrom,
      to: this.paymentsTo,
    });
  }

  protected reportLedgerEntries(): LedgerEntryRow[] {
    const currency = this.blankToUndefined(this.ledgerCurrency)?.toUpperCase();
    return this.ledger.entries().filter(entry => !currency || entry.currency.toUpperCase() === currency);
  }

  protected ordersTotalLabel(): string {
    return formatCurrencyTotals(summarizeAmountsByCurrency(
      this.reportOrders(),
      order => order.currency || 'BRL',
      order => order.totalAmount,
    ));
  }

  protected paymentsTotalLabel(): string {
    return formatCurrencyTotals(summarizeAmountsByCurrency(
      this.reportPayments(),
      payment => payment.currency,
      payment => payment.amount,
    ));
  }

  protected ledgerNetTotalLabel(): string {
    return formatCurrencyTotals(summarizeAmountsByCurrency(
      this.reportLedgerEntries(),
      entry => entry.currency,
      entry => entry.side === 'CREDIT' ? entry.amount : -entry.amount,
    ));
  }

  protected exportOrders(): void {
    this.exportRows(
      reportFilename('relatorio-pedidos'),
      ['ID', 'Cliente', 'Status', 'Moeda', 'Valor', 'Itens', 'Criado em'],
      buildOrderCsvRows(this.reportOrders()),
    );
  }

  protected exportPayments(): void {
    this.exportRows(
      reportFilename('relatorio-pagamentos'),
      ['ID', 'Cliente', 'Status', 'Moeda', 'Valor', 'Gateway', 'Criado em'],
      buildPaymentCsvRows(this.reportPayments()),
    );
  }

  protected exportLedger(): void {
    this.exportRows(
      reportFilename('relatorio-ledger'),
      ['ID', 'Data', 'Tipo', 'Conta', 'Moeda', 'Valor', 'Pagamento'],
      buildLedgerCsvRows(this.reportLedgerEntries()),
    );
  }

  protected dateValue(key: DateField): Date | null {
    return this[key];
  }

  protected setDateValue(key: DateField, value: Date | null): void {
    this[key] = value;
  }

  private exportRows(filename: string, headers: readonly string[], rows: readonly (readonly unknown[])[]): void {
    if (rows.length === 0) {
      this.snackBar.open(this.msg().noDataToExport, 'OK', { duration: 2500 });
      return;
    }
    downloadCsv(filename, buildCsv(headers, rows));
    this.snackBar.open(this.msg().exported, 'OK', { duration: 2500 });
  }

  private blankToUndefined(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
}

type DateField = 'ordersFrom' | 'ordersTo' | 'paymentsFrom' | 'paymentsTo' | 'ledgerFrom' | 'ledgerTo';
