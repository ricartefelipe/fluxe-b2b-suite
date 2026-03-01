import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { StatusChipComponent, EmptyStateComponent } from '@saas-suite/shared/ui';
import { AuditFacade, AuditListParams } from '@saas-suite/data-access/core';
import { I18nService } from '@saas-suite/shared/i18n';
import { formatDateTime } from '@saas-suite/shared/util';

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [
    FormsModule, MatTableModule, MatProgressBarModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    StatusChipComponent, EmptyStateComponent,
  ],
  template: `
    <div class="page-header">
      <h1>{{ i18n.messages().admin.auditTitle }}</h1>
      <button mat-stroked-button (click)="search()"><mat-icon>refresh</mat-icon> {{ i18n.messages().admin.refresh }}</button>
    </div>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().admin.action }}</mat-label>
        <input matInput [(ngModel)]="filters.action" placeholder="ex: CREATE_ORDER">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().admin.outcome }}</mat-label>
        <mat-select [(ngModel)]="filters.outcome">
          <mat-option [value]="undefined">{{ i18n.messages().common.all }}</mat-option>
          <mat-option value="SUCCESS">SUCCESS</mat-option>
          <mat-option value="DENIED">DENIED</mat-option>
          <mat-option value="ERROR">ERROR</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().admin.correlationId }}</mat-label>
        <input matInput [(ngModel)]="filters.correlationId" placeholder="UUID...">
      </mat-form-field>
      <button mat-raised-button color="primary" (click)="search()">{{ i18n.messages().admin.filter }}</button>
    </div>

    @if (facade.loading()) { <mat-progress-bar mode="indeterminate" /> }

    @if (facade.logs().length === 0 && !facade.loading()) {
      <saas-empty-state
        icon="history"
        [title]="i18n.messages().admin.noAuditFound"
        [subtitle]="i18n.messages().admin.noAuditFoundSubtitle"
      />
    } @else {
      <table mat-table [dataSource]="facade.logs()" class="full-width">
        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.date }}</th>
          <td mat-cell *matCellDef="let a">{{ fmtDate(a.createdAt) }}</td>
        </ng-container>
        <ng-container matColumnDef="action">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().admin.action }}</th>
          <td mat-cell *matCellDef="let a"><code>{{ a.action }}</code></td>
        </ng-container>
        <ng-container matColumnDef="outcome">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().admin.result }}</th>
          <td mat-cell *matCellDef="let a"><saas-status-chip [status]="a.outcome" /></td>
        </ng-container>
        <ng-container matColumnDef="userId">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().admin.user }}</th>
          <td mat-cell *matCellDef="let a">{{ a.userId || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="resourceType">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().admin.resource }}</th>
          <td mat-cell *matCellDef="let a">{{ a.resourceType || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="correlationId">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().admin.correlationId }}</th>
          <td mat-cell *matCellDef="let a">
            <code class="correlation">{{ a.correlationId?.substring(0, 8) || '—' }}</code>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--app-space-16, 16px); }
    .filters { display: flex; gap: var(--app-space-12, 12px); flex-wrap: wrap; align-items: center; margin-bottom: var(--app-space-16, 16px); }
    .full-width { width: 100%; }
    code { background: var(--app-code-bg); padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    .correlation { color: var(--app-primary); }
  `],
})
export class AuditListPage implements OnInit {
  protected facade = inject(AuditFacade);
  protected i18n = inject(I18nService);
  filters: AuditListParams = {};
  columns = ['createdAt', 'action', 'outcome', 'userId', 'resourceType', 'correlationId'];

  async ngOnInit(): Promise<void> { await this.search(); }
  async search(): Promise<void> { await this.facade.loadAuditLogs(this.filters); }
  fmtDate(d: string): string { return formatDateTime(d); }
}
