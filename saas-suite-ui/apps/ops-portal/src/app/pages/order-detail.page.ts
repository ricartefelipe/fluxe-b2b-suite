import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { StatusChipComponent, ConfirmDialogComponent } from '@saas-suite/shared/ui';
import { I18nService } from '@saas-suite/shared/i18n';
import { OrdersFacade } from '@saas-suite/data-access/orders';
import { formatDateTime } from '@saas-suite/shared/util';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    DecimalPipe, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatTableModule, MatSnackBarModule,
    MatDialogModule, StatusChipComponent,
  ],
  template: `
    @if (facade.loading()) { <mat-progress-bar mode="indeterminate" /> }

    @if (facade.selectedOrder(); as order) {
      <div class="page-header">
        <div>
          <h1>{{ i18n.messages().orders.orderDetail }} <code>{{ order.id.substring(0, 8) }}...</code></h1>
          <saas-status-chip [status]="order.status" />
        </div>
        <div class="actions">
          <button mat-stroked-button (click)="router.navigate(['/orders'])"><mat-icon>arrow_back</mat-icon> {{ i18n.messages().common.back }}</button>
          @if (order.status === 'DRAFT' || order.status === 'RESERVED') {
            <button mat-raised-button color="primary" (click)="confirm()"><mat-icon>check</mat-icon> {{ i18n.messages().common.confirm }}</button>
            <button mat-raised-button color="warn" (click)="cancel()"><mat-icon>close</mat-icon> {{ i18n.messages().common.cancel }}</button>
          }
        </div>
      </div>

      <div class="details-grid">
        <mat-card>
          <mat-card-header><mat-card-title>{{ i18n.messages().orders.information }}</mat-card-title></mat-card-header>
          <mat-card-content>
            <p><strong>{{ i18n.messages().orders.customer }}:</strong> {{ order.customerId }}</p>
            <p><strong>{{ i18n.messages().orders.currency }}:</strong> {{ order.currency || 'BRL' }}</p>
            <p><strong>{{ i18n.messages().common.total }}:</strong> {{ order.currency || 'BRL' }} {{ order.totalAmount | number:'1.2-2' }}</p>
            <p><strong>{{ i18n.messages().orders.createdAt }}:</strong> {{ fmtDate(order.createdAt) }}</p>
            <p><strong>{{ i18n.messages().orders.updatedAt }}:</strong> {{ fmtDate(order.updatedAt) }}</p>
            @if (order.correlationId) {
              <p><strong>{{ i18n.messages().errorPage.correlationIdLabel }}:</strong> <code>{{ order.correlationId }}</code></p>
            }
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header><mat-card-title>{{ i18n.messages().orders.items }} ({{ order.items.length }})</mat-card-title></mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="order.items" class="full-width">
              <ng-container matColumnDef="sku">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().inventory.sku }}</th>
                <td mat-cell *matCellDef="let i">{{ i.sku }}</td>
              </ng-container>
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.description }}</th>
                <td mat-cell *matCellDef="let i">{{ i.description || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="qty">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().inventory.quantity }}</th>
                <td mat-cell *matCellDef="let i">{{ i.qty }}</td>
              </ng-container>
              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().orders.unitPrice }}</th>
                <td mat-cell *matCellDef="let i">{{ i.price | number:'1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="subtotal">
                <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().orders.subtotal }}</th>
                <td mat-cell *matCellDef="let i">{{ i.qty * i.price | number:'1.2-2' }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="itemCols"></tr>
              <tr mat-row *matRowDef="let row; columns: itemCols;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .page-header h1 { margin: 0 12px 0 0; display: inline; }
    .actions { display: flex; gap: 8px; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-width { width: 100%; }
    @media (max-width: 768px) { .details-grid { grid-template-columns: 1fr; } }
  `],
})
export class OrderDetailPage implements OnInit {
  protected facade = inject(OrdersFacade);
  protected router = inject(Router);
  protected i18n = inject(I18nService);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  itemCols = ['sku', 'description', 'qty', 'price', 'subtotal'];

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) await this.facade.loadOrder(id);
  }

  async confirm(): Promise<void> {
    const order = this.facade.selectedOrder();
    if (!order) return;
    const m = this.i18n.messages().orders;
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: m.confirmOrderTitle, message: m.confirmOrderMessage } });
    const ok = await firstValueFrom(ref.afterClosed());
    if (!ok) return;
    const o = await this.facade.confirmOrder(order.id);
    if (o) this.snackBar.open(m.orderConfirmed, 'OK', { duration: 2000 });
  }

  async cancel(): Promise<void> {
    const order = this.facade.selectedOrder();
    if (!order) return;
    const m = this.i18n.messages().orders;
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: m.cancelOrderTitle, message: m.cancelOrderMessage, danger: true } });
    const ok = await firstValueFrom(ref.afterClosed());
    if (!ok) return;
    const o = await this.facade.cancelOrder(order.id);
    if (o) this.snackBar.open(m.orderCancelled, 'OK', { duration: 2000 });
  }

  fmtDate(d: string): string { return formatDateTime(d); }
}
