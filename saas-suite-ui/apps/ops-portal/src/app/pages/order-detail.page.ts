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
          <h1>Pedido <code>{{ order.id.substring(0, 8) }}...</code></h1>
          <saas-status-chip [status]="order.status" />
        </div>
        <div class="actions">
          <button mat-stroked-button (click)="router.navigate(['/orders'])"><mat-icon>arrow_back</mat-icon> Voltar</button>
          @if (order.status === 'DRAFT' || order.status === 'RESERVED') {
            <button mat-raised-button color="primary" (click)="confirm()"><mat-icon>check</mat-icon> Confirmar</button>
            <button mat-raised-button color="warn" (click)="cancel()"><mat-icon>close</mat-icon> Cancelar</button>
          }
        </div>
      </div>

      <div class="details-grid">
        <mat-card>
          <mat-card-header><mat-card-title>Informações</mat-card-title></mat-card-header>
          <mat-card-content>
            <p><strong>Cliente:</strong> {{ order.customerId }}</p>
            <p><strong>Moeda:</strong> {{ order.currency }}</p>
            <p><strong>Total:</strong> {{ order.currency }} {{ order.totalAmount | number:'1.2-2' }}</p>
            <p><strong>Criado em:</strong> {{ fmtDate(order.createdAt) }}</p>
            <p><strong>Atualizado em:</strong> {{ fmtDate(order.updatedAt) }}</p>
            @if (order.correlationId) {
              <p><strong>Correlation ID:</strong> <code>{{ order.correlationId }}</code></p>
            }
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header><mat-card-title>Itens ({{ order.items.length }})</mat-card-title></mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="order.items" class="full-width">
              <ng-container matColumnDef="sku">
                <th mat-header-cell *matHeaderCellDef>SKU</th>
                <td mat-cell *matCellDef="let i">{{ i.sku }}</td>
              </ng-container>
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Descrição</th>
                <td mat-cell *matCellDef="let i">{{ i.description || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="quantity">
                <th mat-header-cell *matHeaderCellDef>Qtd</th>
                <td mat-cell *matCellDef="let i">{{ i.quantity }}</td>
              </ng-container>
              <ng-container matColumnDef="unitPrice">
                <th mat-header-cell *matHeaderCellDef>Preço Unit.</th>
                <td mat-cell *matCellDef="let i">{{ i.unitPrice | number:'1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="subtotal">
                <th mat-header-cell *matHeaderCellDef>Subtotal</th>
                <td mat-cell *matCellDef="let i">{{ i.quantity * i.unitPrice | number:'1.2-2' }}</td>
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
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    @media (max-width: 768px) { .details-grid { grid-template-columns: 1fr; } }
  `],
})
export class OrderDetailPage implements OnInit {
  protected facade = inject(OrdersFacade);
  protected router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  itemCols = ['sku', 'description', 'quantity', 'unitPrice', 'subtotal'];

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id')!;
    await this.facade.loadOrder(id);
  }

  async confirm(): Promise<void> {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: 'Confirmar pedido?', message: 'Esta ação confirmará o pedido e reservará o estoque.' } });
    const ok = await firstValueFrom(ref.afterClosed());
    if (!ok) return;
    const o = await this.facade.confirmOrder(this.facade.selectedOrder()!.id);
    if (o) this.snackBar.open('Pedido confirmado', 'OK', { duration: 2000 });
  }

  async cancel(): Promise<void> {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: 'Cancelar pedido?', message: 'Esta ação cancelará o pedido.', danger: true } });
    const ok = await firstValueFrom(ref.afterClosed());
    if (!ok) return;
    const o = await this.facade.cancelOrder(this.facade.selectedOrder()!.id);
    if (o) this.snackBar.open('Pedido cancelado', 'OK', { duration: 2000 });
  }

  fmtDate(d: string): string { return formatDateTime(d); }
}
