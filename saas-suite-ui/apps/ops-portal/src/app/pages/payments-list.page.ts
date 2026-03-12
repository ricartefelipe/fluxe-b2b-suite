import { Component, inject, OnInit, ViewChild, AfterViewInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { StatusChipComponent, EmptyStateComponent, TableSkeletonComponent } from '@saas-suite/shared/ui';
import { I18nService } from '@saas-suite/shared/i18n';
import { PaymentsFacade, PaymentStatus } from '@saas-suite/data-access/payments';
import { formatDateTime } from '@saas-suite/shared/util';

@Component({
  selector: 'app-payments-list',
  standalone: true,
  imports: [
    FormsModule, DecimalPipe, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule,
    MatSortModule, MatPaginatorModule,
    StatusChipComponent, EmptyStateComponent, TableSkeletonComponent,
  ],
  template: `
    <div class="page-header"><h1>{{ i18n.messages().payments.paymentList }}</h1></div>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().common.status }}</mat-label>
        <mat-select [(ngModel)]="filterStatus" (ngModelChange)="search()">
          <mat-option [value]="undefined">{{ i18n.messages().common.all }}</mat-option>
          <mat-option value="PENDING">{{ i18n.messages().payments.pending }}</mat-option>
          <mat-option value="CONFIRMED">{{ i18n.messages().payments.confirmed }}</mat-option>
          <mat-option value="FAILED">{{ i18n.messages().payments.failed }}</mat-option>
          <mat-option value="CANCELLED">{{ i18n.messages().payments.cancelled }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().payments.customer }}</mat-label>
        <input matInput [(ngModel)]="filterCustomer" (ngModelChange)="search()">
      </mat-form-field>
    </div>

    @if (facade.loading()) {
      <saas-table-skeleton [rowCount]="5" [columns]="6" />
    } @else if (dataSource.data.length === 0) {
      <saas-empty-state icon="payments" [title]="i18n.messages().payments.noPaymentsFound" />
    } @else {
      <table mat-table [dataSource]="dataSource" matSort class="full-width">
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().common.id }}</th>
          <td mat-cell *matCellDef="let p"><code>{{ p.id.substring(0, 8) }}</code></td>
        </ng-container>
        <ng-container matColumnDef="customerRef">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().payments.customer }}</th>
          <td mat-cell *matCellDef="let p"><code>{{ p.customer_ref }}</code></td>
        </ng-container>
        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().common.amount }}</th>
          <td mat-cell *matCellDef="let p">{{ p.currency }} {{ p.amount | number:'1.2-2' }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().common.status }}</th>
          <td mat-cell *matCellDef="let p"><saas-status-chip [status]="p.status" /></td>
        </ng-container>
        <ng-container matColumnDef="created_at">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().common.date }}</th>
          <td mat-cell *matCellDef="let p">{{ fmtDate(p.created_at) }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let p">
            @if (p.status === 'PENDING') {
              <button mat-raised-button color="primary" (click)="confirmPayment(p.id)">{{ i18n.messages().common.confirm }}</button>
            }
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
      <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons />
    }
  `,
  styles: [`
    .page-header { margin-bottom: 16px; }
    .filters { display: flex; gap: 12px; margin-bottom: 16px; }
    .full-width { width: 100%; }
  `],
})
export class PaymentsListPage implements OnInit, AfterViewInit {
  protected facade = inject(PaymentsFacade);
  protected i18n = inject(I18nService);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<any>([]);
  filterStatus?: PaymentStatus;
  filterCustomer?: string;
  columns = ['id', 'customerRef', 'amount', 'status', 'created_at', 'actions'];

  constructor() {
    effect(() => {
      this.dataSource.data = this.facade.payments();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  async ngOnInit(): Promise<void> { await this.search(); }

  async search(): Promise<void> {
    await this.facade.loadPayments({ status: this.filterStatus, customer_ref: this.filterCustomer });
  }

  async confirmPayment(id: string): Promise<void> {
    const p = await this.facade.confirmPayment(id);
    if (p) this.snackBar.open(this.i18n.messages().payments.paymentConfirmed, 'OK', { duration: 2000 });
  }

  fmtDate(d: string): string { return formatDateTime(d); }
}
