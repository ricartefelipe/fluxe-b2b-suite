import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { StatusChipComponent, EmptyStateComponent } from '@saas-suite/shared/ui';
import { InventoryFacade, AdjustmentType } from '@saas-suite/data-access/orders';
import { I18nService } from '@saas-suite/shared/i18n';
import { formatDateTime } from '@saas-suite/shared/util';

@Component({
  selector: 'app-adjustments-list',
  standalone: true,
  imports: [
    FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, StatusChipComponent, EmptyStateComponent,
  ],
  template: `
    <div class="page-header">
      <h1>{{ i18n.messages().inventory.adjustments }}</h1>
      <button mat-raised-button color="primary" (click)="router.navigate(['/inventory/adjustments/new'])">
        <mat-icon>add</mat-icon> {{ i18n.messages().inventory.createAdjustment }}
      </button>
    </div>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().inventory.sku }}</mat-label>
        <input matInput [(ngModel)]="filterSku" (ngModelChange)="search()">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().common.type }}</mat-label>
        <mat-select [(ngModel)]="filterType" (ngModelChange)="search()">
          <mat-option [value]="undefined">{{ i18n.messages().common.all }}</mat-option>
          <mat-option value="IN">{{ i18n.messages().ops.adjustmentTypeIn }}</mat-option>
          <mat-option value="OUT">{{ i18n.messages().ops.adjustmentTypeOut }}</mat-option>
          <mat-option value="ADJUSTMENT">{{ i18n.messages().ops.adjustmentTypeAdj }}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    @if (facade.loading()) { <mat-progress-bar mode="indeterminate" /> }

    @if (facade.adjustments().length === 0 && !facade.loading()) {
      <saas-empty-state
        icon="inventory_2"
        [title]="i18n.messages().ops.noAdjustmentsFound"
        [subtitle]="i18n.messages().ops.noAdjustmentsFoundSubtitle"
        [actionLabel]="i18n.messages().inventory.createAdjustment"
        actionRouterLink="/inventory/adjustments/new"
      />
    } @else {
      <table mat-table [dataSource]="facade.adjustments()" class="full-width">
        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.date }}</th>
          <td mat-cell *matCellDef="let a">{{ fmtDate(a.createdAt) }}</td>
        </ng-container>
        <ng-container matColumnDef="sku">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().inventory.sku }}</th>
          <td mat-cell *matCellDef="let a"><code>{{ a.sku }}</code></td>
        </ng-container>
        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.type }}</th>
          <td mat-cell *matCellDef="let a"><saas-status-chip [status]="a.type" /></td>
        </ng-container>
        <ng-container matColumnDef="quantity">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().inventory.quantity }}</th>
          <td mat-cell *matCellDef="let a">{{ a.quantity }}</td>
        </ng-container>
        <ng-container matColumnDef="reason">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().inventory.reason }}</th>
          <td mat-cell *matCellDef="let a">{{ a.reason }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--app-space-16, 16px); }
    .filters { display: flex; gap: var(--app-space-12, 12px); margin-bottom: var(--app-space-16, 16px); }
    .full-width { width: 100%; }
  `],
})
export class AdjustmentsListPage implements OnInit {
  protected facade = inject(InventoryFacade);
  protected router = inject(Router);
  protected i18n = inject(I18nService);
  filterSku?: string;
  filterType?: AdjustmentType;
  columns = ['createdAt', 'sku', 'type', 'quantity', 'reason'];

  async ngOnInit(): Promise<void> { await this.search(); }
  async search(): Promise<void> {
    await this.facade.loadAdjustments({ sku: this.filterSku, type: this.filterType });
  }
  fmtDate(d: string): string { return formatDateTime(d); }
}
