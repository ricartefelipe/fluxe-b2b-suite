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
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'app-adjustment-create',
  standalone: true,
  imports: [
    FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatIconModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <h1>{{ i18n.messages().inventory.createAdjustment }}</h1>
      <button mat-stroked-button (click)="router.navigate(['/inventory/adjustments'])"><mat-icon>arrow_back</mat-icon> {{ i18n.messages().common.back }}</button>
    </div>

    <mat-card>
      <mat-card-content>
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>{{ i18n.messages().inventory.sku }}</mat-label>
            <input matInput [(ngModel)]="sku" [placeholder]="i18n.messages().inventory.sku">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>{{ i18n.messages().common.type }}</mat-label>
            <mat-select [(ngModel)]="type">
              <mat-option value="IN">{{ i18n.messages().ops.adjustmentTypeIn }}</mat-option>
              <mat-option value="OUT">{{ i18n.messages().ops.adjustmentTypeOut }}</mat-option>
              <mat-option value="ADJUSTMENT">{{ i18n.messages().ops.adjustmentTypeAdj }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>{{ i18n.messages().inventory.quantity }}</mat-label>
            <input matInput type="number" [(ngModel)]="quantity" min="1">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-span">
            <mat-label>{{ i18n.messages().inventory.reason }}</mat-label>
            <input matInput [(ngModel)]="reason" [placeholder]="i18n.messages().inventory.reason">
          </mat-form-field>
        </div>
        <button mat-raised-button color="primary" (click)="submit()" [disabled]="submitting()">{{ i18n.messages().inventory.createAdjustment }}</button>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--app-space-16, 16px); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--app-space-12, 12px); margin-bottom: var(--app-space-16, 16px); }
    .full-span { grid-column: 1 / -1; }
  `],
})
export class AdjustmentCreatePage {
  protected router = inject(Router);
  protected i18n = inject(I18nService);
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
      this.snackBar.open(this.i18n.messages().ops.adjustmentCreatedSuccess, 'OK', { duration: 2000 });
      this.router.navigate(['/inventory/adjustments']);
    }
  }
}
