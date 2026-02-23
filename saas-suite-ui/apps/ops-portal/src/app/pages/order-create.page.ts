import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { OrdersFacade, OrderItem } from '@saas-suite/data-access/orders';

@Component({
  selector: 'app-order-create',
  standalone: true,
  imports: [
    FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatSnackBarModule, DecimalPipe,
  ],
  template: `
    <div class="page-header">
      <h1>Novo Pedido</h1>
      <button mat-stroked-button (click)="router.navigate(['/orders'])"><mat-icon>arrow_back</mat-icon> Voltar</button>
    </div>

    <mat-card>
      <mat-card-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Cliente ID</mat-label>
          <input matInput [(ngModel)]="customerId" placeholder="ID do cliente">
        </mat-form-field>

        <h3>Itens</h3>
        @for (item of items; track $index) {
          <div class="item-row">
            <mat-form-field appearance="outline">
              <mat-label>SKU</mat-label>
              <input matInput [(ngModel)]="item.sku">
            </mat-form-field>
            <mat-form-field appearance="outline" style="width: 100px">
              <mat-label>Qtd</mat-label>
              <input matInput type="number" [(ngModel)]="item.quantity" min="1">
            </mat-form-field>
            <mat-form-field appearance="outline" style="width: 120px">
              <mat-label>Preço Unit.</mat-label>
              <input matInput type="number" [(ngModel)]="item.unitPrice" min="0" step="0.01">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Descrição</mat-label>
              <input matInput [(ngModel)]="item.description">
            </mat-form-field>
            <button mat-icon-button color="warn" (click)="removeItem($index)"><mat-icon>delete</mat-icon></button>
          </div>
        }
        <button mat-stroked-button (click)="addItem()"><mat-icon>add</mat-icon> Adicionar Item</button>

        <div class="total">
          <strong>Total: BRL {{ calcTotal() | number:'1.2-2' }}</strong>
        </div>

        <button mat-raised-button color="primary" (click)="submit()" [disabled]="submitting()" class="submit-btn">
          Criar Pedido
        </button>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .item-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
    .item-row mat-form-field { flex: 1; }
    .total { margin: 16px 0; font-size: 18px; text-align: right; }
    .submit-btn { margin-top: 8px; }
  `],
})
export class OrderCreatePage {
  protected router = inject(Router);
  private facade = inject(OrdersFacade);
  private snackBar = inject(MatSnackBar);

  customerId = '';
  items: OrderItem[] = [{ sku: '', quantity: 1, unitPrice: 0 }];
  submitting = signal(false);

  addItem(): void { this.items = [...this.items, { sku: '', quantity: 1, unitPrice: 0 }]; }
  removeItem(i: number): void { this.items = this.items.filter((_, idx) => idx !== i); }

  calcTotal(): number { return this.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0); }

  async submit(): Promise<void> {
    if (!this.customerId || this.items.length === 0) return;
    this.submitting.set(true);
    const order = await this.facade.createOrder({ customerId: this.customerId, items: this.items, currency: 'BRL' });
    this.submitting.set(false);
    if (order) {
      this.snackBar.open('Pedido criado com sucesso', 'OK', { duration: 3000 });
      this.router.navigate(['/orders', order.id]);
    }
  }
}
