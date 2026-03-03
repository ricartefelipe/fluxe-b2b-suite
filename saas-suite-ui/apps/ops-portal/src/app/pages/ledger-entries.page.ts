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
      <h1>Ledger — Lançamentos</h1>
      <button mat-stroked-button (click)="search()"><mat-icon>refresh</mat-icon> Atualizar</button>
    </div>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>De</mat-label>
        <input matInput type="date" [(ngModel)]="from">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Até</mat-label>
        <input matInput type="date" [(ngModel)]="to">
      </mat-form-field>
      <button mat-raised-button color="primary" (click)="search()">Filtrar</button>
    </div>

    @if (facade.loading()) {
      <saas-table-skeleton [rowCount]="5" [columns]="5" />
    } @else if (dataSource.data.length === 0) {
      <saas-empty-state icon="account_balance" title="Nenhum lançamento encontrado" />
    } @else {
      <table mat-table [dataSource]="dataSource" matSort class="full-width">
        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Data</th>
          <td mat-cell *matCellDef="let e">{{ fmtDate(e.createdAt) }}</td>
        </ng-container>
        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Tipo</th>
          <td mat-cell *matCellDef="let e"><saas-status-chip [status]="e.type" /></td>
        </ng-container>
        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Valor</th>
          <td mat-cell *matCellDef="let e">{{ e.currency }} {{ e.amount | number:'1.2-2' }}</td>
        </ng-container>
        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Descrição</th>
          <td mat-cell *matCellDef="let e">{{ e.description || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="referenceId">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Referência</th>
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
