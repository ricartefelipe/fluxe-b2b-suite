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
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'app-order-create',
  standalone: true,
  imports: [
    FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatSnackBarModule, DecimalPipe,
  ],
  template: `
    <div class="page-header">
      <h1>{{ i18n.messages().orders.createOrder }}</h1>
      <button mat-stroked-button (click)="router.navigate(['/orders'])"><mat-icon>arrow_back</mat-icon> {{ i18n.messages().common.back }}</button>
    </div>

    <mat-card>
      <mat-card-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ i18n.messages().orders.customerId }}</mat-label>
          <input matInput [(ngModel)]="customerId" [placeholder]="i18n.messages().orders.customerId">
        </mat-form-field>

        <h3>{{ i18n.messages().orders.orderItems }}</h3>
        @for (item of items; track $index) {
          <div class="item-row">
            <mat-form-field appearance="outline">
              <mat-label>{{ i18n.messages().inventory.sku }}</mat-label>
              <input matInput [(ngModel)]="item.sku">
            </mat-form-field>
            <mat-form-field appearance="outline" style="width: 100px">
              <mat-label>{{ i18n.messages().inventory.quantity }}</mat-label>
              <input matInput type="number" [(ngModel)]="item.quantity" min="1">
            </mat-form-field>
            <mat-form-field appearance="outline" style="width: 120px">
              <mat-label>{{ i18n.messages().ops.unitPrice }}</mat-label>
              <input matInput type="number" [(ngModel)]="item.unitPrice" min="0" step="0.01">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ i18n.messages().common.description }}</mat-label>
              <input matInput [(ngModel)]="item.description">
            </mat-form-field>
            <button mat-icon-button color="warn" (click)="removeItem($index)"><mat-icon>delete</mat-icon></button>
          </div>
        }
        <button mat-stroked-button (click)="addItem()"><mat-icon>add</mat-icon> {{ i18n.messages().ops.addItem }}</button>

        <div class="total">
          <strong>{{ i18n.messages().common.total }}: BRL {{ calcTotal() | number:'1.2-2' }}</strong>
        </div>

        <button mat-raised-button color="primary" (click)="submit()" [disabled]="submitting()" class="submit-btn">
          {{ i18n.messages().orders.createOrder }}
        </button>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--app-space-16, 16px); }
    .full-width { width: 100%; }
    .item-row { display: flex; gap: var(--app-space-8, 8px); align-items: center; margin-bottom: var(--app-space-8, 8px); }
    .item-row mat-form-field { flex: 1; }
    .total { margin: var(--app-space-16, 16px) 0; font-size: var(--app-font-size-title, 18px); text-align: right; }
    .submit-btn { margin-top: var(--app-space-8, 8px); }
  `],
})
export class OrderCreatePage {
  protected router = inject(Router);
  protected i18n = inject(I18nService);
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
      this.snackBar.open(this.i18n.messages().ops.orderCreatedSuccess, 'OK', { duration: 3000 });
      this.router.navigate(['/orders', order.id]);
    }
  }
}
