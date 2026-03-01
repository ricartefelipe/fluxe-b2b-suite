import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { StatusChipComponent, EmptyStateComponent } from '@saas-suite/shared/ui';
import { LedgerFacade } from '@saas-suite/data-access/payments';
import { I18nService } from '@saas-suite/shared/i18n';
import { formatDateTime } from '@saas-suite/shared/util';

@Component({
  selector: 'app-ledger-entries',
  standalone: true,
  imports: [
    FormsModule, DecimalPipe, MatTableModule, MatProgressBarModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, StatusChipComponent, EmptyStateComponent,
  ],
  template: `
    <div class="page-header">
      <h1>{{ i18n.messages().ops.ledgerEntriesTitle }}</h1>
      <button mat-stroked-button (click)="search()"><mat-icon>refresh</mat-icon> {{ i18n.messages().admin.refresh }}</button>
    </div>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().ops.fromDate }}</mat-label>
        <input matInput type="date" [(ngModel)]="from">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().ops.toDate }}</mat-label>
        <input matInput type="date" [(ngModel)]="to">
      </mat-form-field>
      <button mat-raised-button color="primary" (click)="search()">{{ i18n.messages().common.filter }}</button>
    </div>

    @if (facade.loading()) { <mat-progress-bar mode="indeterminate" /> }

    @if (facade.entries().length === 0 && !facade.loading()) {
      <saas-empty-state
        icon="account_balance"
        [title]="i18n.messages().ops.noEntriesFound"
        [subtitle]="i18n.messages().ops.noEntriesFoundSubtitle"
      />
    } @else {
      <table mat-table [dataSource]="facade.entries()" class="full-width">
        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.date }}</th>
          <td mat-cell *matCellDef="let e">{{ fmtDate(e.createdAt) }}</td>
        </ng-container>
        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.type }}</th>
          <td mat-cell *matCellDef="let e"><saas-status-chip [status]="e.type" /></td>
        </ng-container>
        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.amount }}</th>
          <td mat-cell *matCellDef="let e">{{ e.currency }} {{ e.amount | number:'1.2-2' }}</td>
        </ng-container>
        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.description }}</th>
          <td mat-cell *matCellDef="let e">{{ e.description || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="referenceId">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().ops.reference }}</th>
          <td mat-cell *matCellDef="let e"><code>{{ e.referenceId?.substring(0, 8) || '—' }}</code></td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--app-space-16, 16px); }
    .filters { display: flex; gap: var(--app-space-12, 12px); align-items: center; margin-bottom: var(--app-space-16, 16px); }
    .full-width { width: 100%; }
  `],
})
export class LedgerEntriesPage implements OnInit {
  protected facade = inject(LedgerFacade);
  protected i18n = inject(I18nService);
  from?: string;
  to?: string;
  columns = ['createdAt', 'type', 'amount', 'description', 'referenceId'];

  async ngOnInit(): Promise<void> { await this.search(); }
  async search(): Promise<void> {
    await this.facade.loadEntries({ from: this.from, to: this.to });
  }
  fmtDate(d: string): string { return formatDateTime(d); }
}
