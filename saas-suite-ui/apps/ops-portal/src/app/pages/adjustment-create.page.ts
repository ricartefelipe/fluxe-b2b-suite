import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InventoryFacade, AdjustmentType } from '@saas-suite/data-access/orders';

@Component({
  selector: 'app-adjustment-create',
  standalone: true,
  imports: [
    FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatIconModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <h1>Novo Ajuste de Inventário</h1>
      <button mat-stroked-button (click)="router.navigate(['/inventory/adjustments'])"><mat-icon>arrow_back</mat-icon> Voltar</button>
    </div>

    <mat-card>
      <mat-card-content>
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>SKU</mat-label>
            <input matInput [(ngModel)]="sku" placeholder="SKU do produto">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Tipo</mat-label>
            <mat-select [(ngModel)]="type">
              <mat-option value="IN">Entrada</mat-option>
              <mat-option value="OUT">Saída</mat-option>
              <mat-option value="ADJUSTMENT">Ajuste</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Quantidade</mat-label>
            <input matInput type="number" [(ngModel)]="quantity" min="1">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-span">
            <mat-label>Motivo</mat-label>
            <input matInput [(ngModel)]="reason" placeholder="Motivo do ajuste">
          </mat-form-field>
        </div>
        <button mat-raised-button color="primary" (click)="submit()" [disabled]="submitting()">Criar Ajuste</button>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .full-span { grid-column: 1 / -1; }
  `],
})
export class AdjustmentCreatePage {
  protected router = inject(Router);
  private facade = inject(InventoryFacade);
  private snackBar = inject(MatSnackBar);

  sku = '';
  type: AdjustmentType = 'IN';
  quantity = 1;
  reason = '';
  submitting = signal(false);

  async submit(): Promise<void> {
    if (!this.sku || !this.reason) return;
    this.submitting.set(true);
    const adj = await this.facade.createAdjustment({ sku: this.sku, type: this.type, quantity: this.quantity, reason: this.reason });
    this.submitting.set(false);
    if (adj) {
      this.snackBar.open('Ajuste criado', 'OK', { duration: 2000 });
      this.router.navigate(['/inventory/adjustments']);
    }
  }
}
