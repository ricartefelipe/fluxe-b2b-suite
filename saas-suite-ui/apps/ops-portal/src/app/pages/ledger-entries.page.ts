import { Component, inject, OnInit, ViewChild, AfterViewInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { StatusChipComponent, EmptyStateComponent, TableSkeletonComponent } from '@saas-suite/shared/ui';
import { I18nService } from '@saas-suite/shared/i18n';
import { LedgerFacade, LedgerEntryRow } from '@saas-suite/data-access/payments';
import { formatDateTime } from '@saas-suite/shared/util';

@Component({
  selector: 'app-ledger-entries',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    FormsModule, DecimalPipe, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule, MatSortModule, MatPaginatorModule,
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
        <input matInput [matDatepicker]="fromPicker" [(ngModel)]="fromDate" (dateChange)="search()">
        <mat-datepicker-toggle matIconSuffix [for]="fromPicker" />
        <mat-datepicker #fromPicker />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().ledger.to }}</mat-label>
        <input matInput [matDatepicker]="toPicker" [(ngModel)]="toDate" (dateChange)="search()">
        <mat-datepicker-toggle matIconSuffix [for]="toPicker" />
        <mat-datepicker #toPicker />
      </mat-form-field>
      <button mat-stroked-button (click)="clearFilters()"><mat-icon>clear</mat-icon> {{ i18n.messages().common.clear }}</button>
    </div>

    @if (facade.loading()) {
      <saas-table-skeleton [rowCount]="5" [columns]="6" />
    } @else if (dataSource.data.length === 0) {
      <saas-empty-state icon="account_balance" [title]="i18n.messages().ledger.noEntriesFound" />
    } @else {
      <table mat-table [dataSource]="dataSource" matSort class="full-width">
        <ng-container matColumnDef="postedAt">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().common.date }}</th>
          <td mat-cell *matCellDef="let e">{{ fmtDate(e.postedAt) }}</td>
        </ng-container>
        <ng-container matColumnDef="side">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().common.type }}</th>
          <td mat-cell *matCellDef="let e"><saas-status-chip [status]="e.side" /></td>
        </ng-container>
        <ng-container matColumnDef="account">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().ledger.account }}</th>
          <td mat-cell *matCellDef="let e">{{ e.account }}</td>
        </ng-container>
        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().common.amount }}</th>
          <td mat-cell *matCellDef="let e" [class]="e.side === 'CREDIT' ? 'credit' : 'debit'">
            {{ e.side === 'CREDIT' ? '+' : '-' }}{{ e.amount | number:'1.2-2' }} {{ e.currency }}
          </td>
        </ng-container>
        <ng-container matColumnDef="paymentIntentId">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().ledger.reference }}</th>
          <td mat-cell *matCellDef="let e"><code>{{ e.paymentIntentId?.substring(0, 8) || '—' }}</code></td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
      <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons />
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .filters { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .full-width { width: 100%; }
    .credit { color: #2e7d32; font-weight: 500; }
    .debit { color: #c62828; font-weight: 500; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
  `],
})
export class LedgerEntriesPage implements OnInit, AfterViewInit {
  protected facade = inject(LedgerFacade);
  protected i18n = inject(I18nService);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<LedgerEntryRow>([]);
  fromDate: Date | null = null;
  toDate: Date | null = null;
  columns = ['postedAt', 'side', 'account', 'amount', 'paymentIntentId'];

  constructor() {
    effect(() => {
      this.dataSource.data = this.facade.entries();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  async ngOnInit(): Promise<void> {
    await this.search();
  }

  async search(): Promise<void> {
    const params: Record<string, string | undefined> = {};
    if (this.fromDate) params['from'] = this.toIsoDate(this.fromDate);
    if (this.toDate) params['to'] = this.toIsoDate(this.toDate);
    await this.facade.loadEntries(params);
  }

  clearFilters(): void {
    this.fromDate = null;
    this.toDate = null;
    this.search();
  }

  fmtDate(d: string): string { return formatDateTime(d); }

  private toIsoDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
