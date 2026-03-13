import { Component, inject, OnInit, ViewChild, AfterViewInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { StatusChipComponent, EmptyStateComponent, TableSkeletonComponent } from '@saas-suite/shared/ui';
import { I18nService } from '@saas-suite/shared/i18n';
import { LedgerFacade } from '@saas-suite/data-access/payments';
import { formatDateTime } from '@saas-suite/shared/util';

@Component({
  selector: 'app-ledger-entries',
  standalone: true,
  imports: [
    FormsModule, DecimalPipe, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSortModule, MatPaginatorModule,
    StatusChipComponent, EmptyStateComponent, TableSkeletonComponent,
  ],
  template: `
    <div class="page-header">
      <h1>{{ i18n.messages().ledger.entriesTitle }}</h1>
      <button mat-stroked-button (click)="search()"><mat-icon>refresh</mat-icon> {{ i18n.messages().ledger.refresh }}</button>
    </div>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().ledger.from }}</mat-label>
        <input matInput type="date" [(ngModel)]="from">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().ledger.to }}</mat-label>
        <input matInput type="date" [(ngModel)]="to">
      </mat-form-field>
      <button mat-raised-button color="primary" (click)="search()">{{ i18n.messages().common.filter }}</button>
    </div>

    @if (facade.loading()) {
      <saas-table-skeleton [rowCount]="5" [columns]="5" />
    } @else if (dataSource.data.length === 0) {
      <saas-empty-state icon="account_balance" [title]="i18n.messages().ledger.noEntriesFound" />
    } @else {
      <table mat-table [dataSource]="dataSource" matSort class="full-width">
        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().common.date }}</th>
          <td mat-cell *matCellDef="let e">{{ fmtDate(e.createdAt) }}</td>
        </ng-container>
        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().common.type }}</th>
          <td mat-cell *matCellDef="let e"><saas-status-chip [status]="e.type" /></td>
        </ng-container>
        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().common.amount }}</th>
          <td mat-cell *matCellDef="let e">{{ e.currency }} {{ e.amount | number:'1.2-2' }}</td>
        </ng-container>
        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().common.description }}</th>
          <td mat-cell *matCellDef="let e">{{ e.description || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="referenceId">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().ledger.reference }}</th>
          <td mat-cell *matCellDef="let e"><code>{{ e.referenceId?.substring(0, 8) || '—' }}</code></td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
      <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons />
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .filters { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
    .full-width { width: 100%; }
  `],
})
export class LedgerEntriesPage implements OnInit, AfterViewInit {
  protected facade = inject(LedgerFacade);
  protected i18n = inject(I18nService);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<any>([]);
  from?: string;
  to?: string;
  columns = ['createdAt', 'type', 'amount', 'description', 'referenceId'];

  constructor() {
    effect(() => {
      this.dataSource.data = this.facade.entries();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  async ngOnInit(): Promise<void> { await this.search(); }

  async search(): Promise<void> {
    await this.facade.loadEntries({ from: this.from, to: this.to });
  }

  fmtDate(d: string): string { return formatDateTime(d); }
}
