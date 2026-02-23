import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { StatusChipComponent, EmptyStateComponent } from '@saas-suite/shared/ui';
import { OrdersFacade, OrderStatus } from '@saas-suite/data-access/orders';
import { formatDateTime } from '@saas-suite/shared/util';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    DecimalPipe, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, StatusChipComponent, EmptyStateComponent,
  ],
  template: `
    <div class="page-header">
      <h1>Pedidos</h1>
      <button mat-raised-button color="primary" (click)="router.navigate(['/orders/new'])">
        <mat-icon>add</mat-icon> Novo Pedido
      </button>
    </div>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Status</mat-label>
        <mat-select [(ngModel)]="filterStatus" (ngModelChange)="search()">
          <mat-option [value]="undefined">Todos</mat-option>
          <mat-option value="DRAFT">Draft</mat-option>
          <mat-option value="RESERVED">Reservado</mat-option>
          <mat-option value="CONFIRMED">Confirmado</mat-option>
          <mat-option value="PAID">Pago</mat-option>
          <mat-option value="CANCELLED">Cancelado</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Cliente ID</mat-label>
        <input matInput [(ngModel)]="filterCustomer" (ngModelChange)="search()">
      </mat-form-field>
    </div>

    @if (facade.loading()) { <mat-progress-bar mode="indeterminate" /> }

    @if (facade.orders().length === 0 && !facade.loading()) {
      <saas-empty-state icon="receipt_long" title="Nenhum pedido encontrado" />
    } @else {
      <table mat-table [dataSource]="facade.orders()" class="full-width">
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef>ID</th>
          <td mat-cell *matCellDef="let o"><code>{{ o.id.substring(0, 8) }}</code></td>
        </ng-container>
        <ng-container matColumnDef="customerId">
          <th mat-header-cell *matHeaderCellDef>Cliente</th>
          <td mat-cell *matCellDef="let o">{{ o.customerId }}</td>
        </ng-container>
        <ng-container matColumnDef="totalAmount">
          <th mat-header-cell *matHeaderCellDef>Total</th>
          <td mat-cell *matCellDef="let o">{{ o.currency }} {{ o.totalAmount | number:'1.2-2' }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let o"><saas-status-chip [status]="o.status" /></td>
        </ng-container>
        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef>Data</th>
          <td mat-cell *matCellDef="let o">{{ fmtDate(o.createdAt) }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let o">
            <button mat-icon-button (click)="router.navigate(['/orders', o.id])"><mat-icon>open_in_new</mat-icon></button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .filters { display: flex; gap: 12px; margin-bottom: 16px; }
    .full-width { width: 100%; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
  `],
})
export class OrdersListPage implements OnInit {
  protected facade = inject(OrdersFacade);
  protected router = inject(Router);
  filterStatus?: OrderStatus;
  filterCustomer?: string;
  columns = ['id', 'customerId', 'totalAmount', 'status', 'createdAt', 'actions'];

  async ngOnInit(): Promise<void> { await this.search(); }
  async search(): Promise<void> {
    await this.facade.loadOrders({ status: this.filterStatus, customerId: this.filterCustomer });
  }
  fmtDate(d: string): string { return formatDateTime(d); }
}
