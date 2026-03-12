import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { I18nService } from '@saas-suite/shared/i18n';
import { OrdersFacade } from '@saas-suite/data-access/orders';

@Component({
  selector: 'app-order-create',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatSnackBarModule, DecimalPipe,
  ],
  template: `
    <div class="page-header">
      <h1>{{ i18n.messages().orders.createOrder }}</h1>
      <button mat-stroked-button (click)="router.navigate(['/orders'])"><mat-icon>arrow_back</mat-icon> {{ i18n.messages().common.back }}</button>
    </div>

    <mat-card>
      <mat-card-content>
        <form [formGroup]="orderForm">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ i18n.messages().orders.customerId }}</mat-label>
            <input matInput formControlName="customerId">
            @if (orderForm.controls['customerId'].hasError('required') && orderForm.controls['customerId'].touched) {
              <mat-error>{{ i18n.messages().orders.customerIdRequired }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" style="width: 140px">
            <mat-label>{{ i18n.messages().orders.currency }}</mat-label>
            <input matInput formControlName="currency" placeholder="BRL">
            @if (orderForm.controls['currency'].hasError('required') && orderForm.controls['currency'].touched) {
              <mat-error>{{ i18n.messages().orders.currencyRequired }}</mat-error>
            }
          </mat-form-field>

          <h3>{{ i18n.messages().orders.items }}</h3>
          @for (item of items.controls; track $index) {
            <div class="item-row" [formGroupName]="$index">
              <mat-form-field appearance="outline">
                <mat-label>{{ i18n.messages().inventory.sku }}</mat-label>
                <input matInput formControlName="sku">
                @if (item.get('sku')!.hasError('required') && item.get('sku')!.touched) {
                  <mat-error>{{ i18n.messages().orders.skuRequired }}</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline" style="width: 100px">
                <mat-label>{{ i18n.messages().inventory.quantity }}</mat-label>
                <input matInput type="number" formControlName="quantity">
                @if (item.get('quantity')!.hasError('required') && item.get('quantity')!.touched) {
                  <mat-error>{{ i18n.messages().orders.quantityRequired }}</mat-error>
                }
                @if (item.get('quantity')!.hasError('min')) {
                  <mat-error>{{ i18n.messages().orders.quantityMin }}</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline" style="width: 120px">
                <mat-label>{{ i18n.messages().orders.unitPrice }}</mat-label>
                <input matInput type="number" formControlName="unitPrice">
                @if (item.get('unitPrice')!.hasError('min')) {
                  <mat-error>{{ i18n.messages().orders.priceMin }}</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ i18n.messages().common.description }}</mat-label>
                <input matInput formControlName="description">
              </mat-form-field>
              <button mat-icon-button color="warn" type="button" (click)="removeItem($index)"><mat-icon>delete</mat-icon></button>
            </div>
          }
          <button mat-stroked-button type="button" (click)="addItem()"><mat-icon>add</mat-icon> {{ i18n.messages().orders.addItem }}</button>

          <div class="total">
            <strong>{{ i18n.messages().common.total }}: {{ orderForm.get('currency')?.value }} {{ calcTotal() | number:'1.2-2' }}</strong>
          </div>

          <button mat-raised-button color="primary" type="button" (click)="submit()" [disabled]="orderForm.invalid || submitting()" class="submit-btn">
            {{ i18n.messages().orders.createOrder }}
          </button>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .item-row { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 8px; }
    .item-row mat-form-field { flex: 1; }
    .total { margin: 16px 0; font-size: 18px; text-align: right; }
    .submit-btn { margin-top: 8px; }
  `],
})
export class OrderCreatePage {
  protected router = inject(Router);
  protected i18n = inject(I18nService);
  private facade = inject(OrdersFacade);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  submitting = signal(false);

  orderForm = this.fb.group({
    customerId: ['', Validators.required],
    currency: ['BRL', Validators.required],
    items: this.fb.array([this.createItemGroup()]),
  });

  get items(): FormArray {
    return this.orderForm.get('items') as FormArray;
  }

  private createItemGroup() {
    return this.fb.group({
      sku: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      description: [''],
    });
  }

  addItem(): void { this.items.push(this.createItemGroup()); }
  removeItem(i: number): void { this.items.removeAt(i); }

  calcTotal(): number {
    return this.items.controls.reduce((sum, ctrl) => {
      const qty = ctrl.get('quantity')?.value ?? 0;
      const price = ctrl.get('unitPrice')?.value ?? 0;
      return sum + qty * price;
    }, 0);
  }

  async submit(): Promise<void> {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const val = this.orderForm.getRawValue();
    const order = await this.facade.createOrder({
      customerId: val.customerId!,
      items: val.items.map(i => ({
        sku: i.sku!,
        qty: i.quantity!,
        price: i.unitPrice!,
        description: i.description ?? undefined,
      })),
    });
    this.submitting.set(false);
    if (order) {
      this.snackBar.open(this.i18n.messages().orders.orderCreatedSuccess, 'OK', { duration: 3000 });
      this.router.navigate(['/orders', order.id]);
    }
  }
}
