import { Component, inject, OnInit, ViewChild, AfterViewInit, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { StatusChipComponent, EmptyStateComponent, TableSkeletonComponent } from '@saas-suite/shared/ui';
import { I18nService } from '@saas-suite/shared/i18n';
import { InventoryFacade, AdjustmentType } from '@saas-suite/data-access/orders';
import { formatDateTime } from '@saas-suite/shared/util';

@Component({
  selector: 'app-adjustments-list',
  standalone: true,
  imports: [
    FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSortModule, MatPaginatorModule,
    StatusChipComponent, EmptyStateComponent, TableSkeletonComponent,
  ],
  template: `
    <div class="page-header">
      <h1>{{ i18n.messages().inventory.adjustments }}</h1>
      <button mat-raised-button color="primary" (click)="router.navigate(['/inventory/adjustments/new'])">
        <mat-icon>add</mat-icon> {{ i18n.messages().inventory.newAdjustment }}
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
          <mat-option value="IN">{{ i18n.messages().inventory.typeIn }}</mat-option>
          <mat-option value="OUT">{{ i18n.messages().inventory.typeOut }}</mat-option>
          <mat-option value="ADJUSTMENT">{{ i18n.messages().inventory.typeAdjustment }}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    @if (facade.loading()) {
      <saas-table-skeleton [rowCount]="5" [columns]="5" />
    } @else if (dataSource.data.length === 0) {
      <saas-empty-state
        icon="inventory_2"
        [title]="i18n.messages().inventory.noAdjustmentsFound"
        [actionLabel]="i18n.messages().inventory.createAdjustment"
        actionIcon="add"
        (action)="router.navigate(['/inventory/adjustments/new'])" />
    } @else {
      <table mat-table [dataSource]="dataSource" matSort class="full-width">
        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().common.date }}</th>
          <td mat-cell *matCellDef="let a">{{ fmtDate(a.createdAt) }}</td>
        </ng-container>
        <ng-container matColumnDef="sku">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().inventory.sku }}</th>
          <td mat-cell *matCellDef="let a"><code>{{ a.sku }}</code></td>
        </ng-container>
        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().common.type }}</th>
          <td mat-cell *matCellDef="let a"><saas-status-chip [status]="a.type" /></td>
        </ng-container>
        <ng-container matColumnDef="quantity">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().inventory.quantity }}</th>
          <td mat-cell *matCellDef="let a">{{ a.qty }}</td>
        </ng-container>
        <ng-container matColumnDef="reason">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().inventory.reason }}</th>
          <td mat-cell *matCellDef="let a">{{ a.reason }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
      <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons />
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .filters { display: flex; gap: 12px; margin-bottom: 16px; }
    .full-width { width: 100%; }
  `],
})
export class AdjustmentsListPage implements OnInit, AfterViewInit {
  protected facade = inject(InventoryFacade);
  protected router = inject(Router);
  protected i18n = inject(I18nService);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<any>([]);
  filterSku?: string;
  filterType?: AdjustmentType;
  columns = ['createdAt', 'sku', 'type', 'quantity', 'reason'];

  constructor() {
    effect(() => {
      this.dataSource.data = this.facade.adjustments();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  async ngOnInit(): Promise<void> { await this.search(); }

  async search(): Promise<void> {
    await this.facade.loadAdjustments({ sku: this.filterSku });
  }

  fmtDate(d: string): string { return formatDateTime(d); }
}
