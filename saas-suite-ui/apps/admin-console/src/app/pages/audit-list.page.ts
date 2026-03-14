import { Component, inject, OnInit, ViewChild, AfterViewInit, effect, ChangeDetectionStrategy } from '@angular/core';
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
import { AuditFacade, AuditListParams } from '@saas-suite/data-access/core';
import { formatDateTime } from '@saas-suite/shared/util';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [
    FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSortModule, MatPaginatorModule,
    StatusChipComponent, EmptyStateComponent, TableSkeletonComponent,
  ],
  template: `
    <div class="page-header">
      <h1>{{ i18n.messages().admin.auditLogTitle }}</h1>
      <button mat-stroked-button (click)="search()"><mat-icon>refresh</mat-icon> {{ i18n.messages().ledger.refresh }}</button>
    </div>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().admin.action }}</mat-label>
        <input matInput [(ngModel)]="filters.action" [placeholder]="i18n.messages().adminPlaceholders.auditAction">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().admin.actor }}</mat-label>
        <input matInput [(ngModel)]="filters.actorSub" [placeholder]="i18n.messages().adminPlaceholders.correlationId">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Correlation ID</mat-label>
        <input matInput [(ngModel)]="filters.correlationId" [placeholder]="i18n.messages().adminPlaceholders.correlationId">
      </mat-form-field>
      <button mat-raised-button color="primary" (click)="search()">{{ i18n.messages().common.filter }}</button>
    </div>

    @if (facade.loading()) {
      <saas-table-skeleton [rowCount]="5" [columns]="6" />
    } @else if (dataSource.data.length === 0) {
      <saas-empty-state icon="history" [title]="i18n.messages().admin.noAuditRecords" />
    } @else {
      <table mat-table [dataSource]="dataSource" matSort class="full-width">
        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().common.date }}</th>
          <td mat-cell *matCellDef="let a">{{ fmtDate(a.createdAt) }}</td>
        </ng-container>
        <ng-container matColumnDef="action">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().admin.action }}</th>
          <td mat-cell *matCellDef="let a"><code>{{ a.action }}</code></td>
        </ng-container>
        <ng-container matColumnDef="outcome">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().admin.result }}</th>
          <td mat-cell *matCellDef="let a"><saas-status-chip [status]="deriveOutcome(a.statusCode)" /></td>
        </ng-container>
        <ng-container matColumnDef="actorSub">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().admin.user }}</th>
          <td mat-cell *matCellDef="let a">{{ a.actorSub || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="resourceType">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().admin.resource }}</th>
          <td mat-cell *matCellDef="let a">{{ a.resourceType || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="correlationId">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Correlation ID</th>
          <td mat-cell *matCellDef="let a">
            <code class="correlation">{{ a.correlationId?.substring(0, 8) || '—' }}</code>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
      <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons />
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .filters { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
    .full-width { width: 100%; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    .correlation { color: #6a1b9a; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditListPage implements OnInit, AfterViewInit {
  protected facade = inject(AuditFacade);
  protected i18n = inject(I18nService);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<any>([]);
  filters: AuditListParams = {};
  columns = ['createdAt', 'action', 'outcome', 'actorSub', 'resourceType', 'correlationId'];

  constructor() {
    effect(() => {
      this.dataSource.data = this.facade.logs();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  async ngOnInit(): Promise<void> { await this.search(); }
  async search(): Promise<void> { await this.facade.loadAuditLogs(this.filters); }
  fmtDate(d: string): string { return formatDateTime(d); }

  deriveOutcome(statusCode?: number): string {
    if (statusCode == null) return 'UNKNOWN';
    if (statusCode >= 500) return 'ERROR';
    if (statusCode >= 400) return 'DENIED';
    return 'SUCCESS';
  }
}
