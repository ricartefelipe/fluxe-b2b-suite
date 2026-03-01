import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { formatDateTime } from '@saas-suite/shared/util';

@Component({
  selector: 'app-payments-list',
  standalone: true,
  imports: [
    FormsModule, DecimalPipe, MatTableModule, MatButtonModule, MatIconModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule, StatusChipComponent, EmptyStateComponent,
  ],
  template: `
    <div class="page-header"><h1>Pagamentos</h1></div>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Status</mat-label>
        <mat-select [(ngModel)]="filterStatus" (ngModelChange)="search()">
          <mat-option [value]="undefined">Todos</mat-option>
          <mat-option value="PENDING">Pendente</mat-option>
          <mat-option value="CONFIRMED">Confirmado</mat-option>
          <mat-option value="FAILED">Falhou</mat-option>
          <mat-option value="CANCELLED">Cancelado</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Order ID</mat-label>
        <input matInput [(ngModel)]="filterOrder" (ngModelChange)="search()">
      </mat-form-field>
    </div>

    @if (facade.loading()) { <mat-progress-bar mode="indeterminate" /> }

    @if (facade.payments().length === 0 && !facade.loading()) {
      <saas-empty-state icon="payments" title="Nenhum pagamento encontrado" />
    } @else {
      <table mat-table [dataSource]="facade.payments()" class="full-width">
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef>ID</th>
          <td mat-cell *matCellDef="let p"><code>{{ p.id.substring(0, 8) }}</code></td>
        </ng-container>
        <ng-container matColumnDef="orderId">
          <th mat-header-cell *matHeaderCellDef>Pedido</th>
          <td mat-cell *matCellDef="let p"><code>{{ p.orderId.substring(0, 8) }}</code></td>
        </ng-container>
        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef>Valor</th>
          <td mat-cell *matCellDef="let p">{{ p.currency }} {{ p.amount | number:'1.2-2' }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let p"><saas-status-chip [status]="p.status" /></td>
        </ng-container>
        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef>Data</th>
          <td mat-cell *matCellDef="let p">{{ fmtDate(p.createdAt) }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let p">
            @if (p.status === 'PENDING') {
              <button mat-raised-button color="primary" (click)="confirmPayment(p.id)">Confirmar</button>
            }
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 16px; }
    .filters { display: flex; gap: 12px; margin-bottom: 16px; }
    .full-width { width: 100%; }
  `],
})
export class PaymentsListPage implements OnInit {
  protected facade = inject(PaymentsFacade);
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
    if (p) this.snackBar.open('Pagamento confirmado', 'OK', { duration: 2000 });
  }
  fmtDate(d: string): string { return formatDateTime(d); }
}
