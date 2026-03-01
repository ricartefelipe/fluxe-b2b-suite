import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { StatusChipComponent, EmptyStateComponent } from '@saas-suite/shared/ui';
import { PaymentsFacade, PaymentStatus } from '@saas-suite/data-access/payments';
import { I18nService } from '@saas-suite/shared/i18n';
import { formatDateTime } from '@saas-suite/shared/util';

@Component({
  selector: 'app-payments-list',
  standalone: true,
  imports: [
    FormsModule, DecimalPipe, MatTableModule, MatButtonModule, MatIconModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule, StatusChipComponent, EmptyStateComponent, RouterLink,
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
          <mat-option value="CANCELLED">{{ i18n.messages().orders.cancelled }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().ops.orderIdLabel }} ID</mat-label>
        <input matInput [(ngModel)]="filterOrder" (ngModelChange)="search()">
      </mat-form-field>
    </div>

    @if (facade.loading()) { <mat-progress-bar mode="indeterminate" /> }

    @if (facade.payments().length === 0 && !facade.loading()) {
      <saas-empty-state
        icon="payments"
        [title]="i18n.messages().ops.noPaymentsFound"
        [subtitle]="i18n.messages().ops.noPaymentsFoundSubtitle"
      />
    } @else {
      <table mat-table [dataSource]="facade.payments()" class="full-width">
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.id }}</th>
          <td mat-cell *matCellDef="let p"><a [routerLink]="['/payments', p.id]" class="id-link"><code>{{ p.id.substring(0, 8) }}</code></a></td>
        </ng-container>
        <ng-container matColumnDef="orderId">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().ops.orderIdLabel }}</th>
          <td mat-cell *matCellDef="let p"><code>{{ p.orderId.substring(0, 8) }}</code></td>
        </ng-container>
        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.amount }}</th>
          <td mat-cell *matCellDef="let p">{{ p.currency }} {{ p.amount | number:'1.2-2' }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.status }}</th>
          <td mat-cell *matCellDef="let p"><saas-status-chip [status]="p.status" /></td>
        </ng-container>
        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.date }}</th>
          <td mat-cell *matCellDef="let p">{{ fmtDate(p.createdAt) }}</td>
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
    }
  `,
  styles: [`
    .page-header { margin-bottom: var(--app-space-16, 16px); }
    .filters { display: flex; gap: var(--app-space-12, 12px); margin-bottom: var(--app-space-16, 16px); }
    .full-width { width: 100%; }
    .id-link { color: var(--app-primary); text-decoration: none; }
    .id-link:hover { text-decoration: underline; }
  `],
})
export class PaymentsListPage implements OnInit {
  protected facade = inject(PaymentsFacade);
  protected i18n = inject(I18nService);
  private snackBar = inject(MatSnackBar);
  filterStatus?: PaymentStatus;
  filterOrder?: string;
  columns = ['id', 'orderId', 'amount', 'status', 'createdAt', 'actions'];

  async ngOnInit(): Promise<void> { await this.search(); }
  async search(): Promise<void> {
    await this.facade.loadPayments({ status: this.filterStatus, orderId: this.filterOrder });
  }
  async confirmPayment(id: string): Promise<void> {
    const p = await this.facade.confirmPayment(id);
    if (p) this.snackBar.open(this.i18n.messages().ops.paymentConfirmedSnackbar, 'OK', { duration: 2000 });
  }
  fmtDate(d: string): string { return formatDateTime(d); }
}
