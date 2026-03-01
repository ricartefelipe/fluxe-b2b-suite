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
import { I18nService } from '@saas-suite/shared/i18n';
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
      <h1>{{ i18n.messages().orders.orderList }}</h1>
      <button mat-raised-button color="primary" (click)="router.navigate(['/orders/new'])">
        <mat-icon>add</mat-icon> {{ i18n.messages().orders.createOrder }}
      </button>
    </div>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().common.status }}</mat-label>
        <mat-select [(ngModel)]="filterStatus" (ngModelChange)="search()">
          <mat-option [value]="undefined">{{ i18n.messages().common.all }}</mat-option>
          <mat-option value="DRAFT">{{ i18n.messages().orders.draft }}</mat-option>
          <mat-option value="RESERVED">{{ i18n.messages().orders.reserved }}</mat-option>
          <mat-option value="CONFIRMED">{{ i18n.messages().orders.confirmed }}</mat-option>
          <mat-option value="PAID">{{ i18n.messages().orders.paid }}</mat-option>
          <mat-option value="CANCELLED">{{ i18n.messages().orders.cancelled }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().orders.customerId }}</mat-label>
        <input matInput [(ngModel)]="filterCustomer" (ngModelChange)="search()">
      </mat-form-field>
    </div>

    @if (facade.loading()) { <mat-progress-bar mode="indeterminate" /> }

    @if (facade.orders().length === 0 && !facade.loading()) {
      <saas-empty-state
        icon="receipt_long"
        [title]="i18n.messages().orders.noOrdersFound"
        [actionLabel]="i18n.messages().orders.createOrder"
        actionRouterLink="/orders/new"
      />
    } @else {
      <table mat-table [dataSource]="facade.orders()" class="full-width">
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.id }}</th>
          <td mat-cell *matCellDef="let o"><code>{{ o.id.substring(0, 8) }}</code></td>
        </ng-container>
        <ng-container matColumnDef="customerId">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().orders.customer }}</th>
          <td mat-cell *matCellDef="let o">{{ o.customerId }}</td>
        </ng-container>
        <ng-container matColumnDef="totalAmount">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().orders.orderTotal }}</th>
          <td mat-cell *matCellDef="let o">{{ o.currency }} {{ o.totalAmount | number:'1.2-2' }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.status }}</th>
          <td mat-cell *matCellDef="let o"><saas-status-chip [status]="o.status" /></td>
        </ng-container>
        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.date }}</th>
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
  `],
})
export class OrdersListPage implements OnInit {
  protected facade = inject(OrdersFacade);
  protected router = inject(Router);
  protected i18n = inject(I18nService);
  filterStatus?: OrderStatus;
  filterCustomer?: string;
  columns = ['id', 'customerId', 'totalAmount', 'status', 'createdAt', 'actions'];

  async ngOnInit(): Promise<void> { await this.search(); }
  async search(): Promise<void> {
    await this.facade.loadOrders({ status: this.filterStatus, customerId: this.filterCustomer });
  }
  fmtDate(d: string): string { return formatDateTime(d); }
}
