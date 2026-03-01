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
      <h1>Audit Log</h1>
      <button mat-stroked-button (click)="search()"><mat-icon>refresh</mat-icon> Atualizar</button>
    </div>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Ação</mat-label>
        <input matInput [(ngModel)]="filters.action" placeholder="ex: CREATE_ORDER">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Outcome</mat-label>
        <mat-select [(ngModel)]="filters.outcome">
          <mat-option [value]="undefined">Todos</mat-option>
          <mat-option value="SUCCESS">SUCCESS</mat-option>
          <mat-option value="DENIED">DENIED</mat-option>
          <mat-option value="ERROR">ERROR</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Correlation ID</mat-label>
        <input matInput [(ngModel)]="filters.correlationId" placeholder="UUID...">
      </mat-form-field>
      <button mat-raised-button color="primary" (click)="search()">Filtrar</button>
    </div>

    @if (facade.loading()) { <mat-progress-bar mode="indeterminate" /> }

    @if (facade.logs().length === 0 && !facade.loading()) {
      <saas-empty-state
        icon="history"
        title="Nenhum registro de audit encontrado"
        subtitle="Os registros aparecem conforme as ações sensíveis são realizadas na plataforma."
      />
    } @else {
      <table mat-table [dataSource]="facade.logs()" class="full-width">
        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef>Data</th>
          <td mat-cell *matCellDef="let a">{{ fmtDate(a.createdAt) }}</td>
        </ng-container>
        <ng-container matColumnDef="action">
          <th mat-header-cell *matHeaderCellDef>Ação</th>
          <td mat-cell *matCellDef="let a"><code>{{ a.action }}</code></td>
        </ng-container>
        <ng-container matColumnDef="outcome">
          <th mat-header-cell *matHeaderCellDef>Resultado</th>
          <td mat-cell *matCellDef="let a"><saas-status-chip [status]="a.outcome" /></td>
        </ng-container>
        <ng-container matColumnDef="userId">
          <th mat-header-cell *matHeaderCellDef>Usuário</th>
          <td mat-cell *matCellDef="let a">{{ a.userId || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="resourceType">
          <th mat-header-cell *matHeaderCellDef>Recurso</th>
          <td mat-cell *matCellDef="let a">{{ a.resourceType || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="correlationId">
          <th mat-header-cell *matHeaderCellDef>Correlation ID</th>
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
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .filters { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
    .full-width { width: 100%; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    .correlation { color: #6a1b9a; }
  `],
})
export class AuditListPage implements OnInit {
  protected facade = inject(AuditFacade);
  filters: AuditListParams = {};
  columns = ['createdAt', 'action', 'outcome', 'userId', 'resourceType', 'correlationId'];

  async ngOnInit(): Promise<void> { await this.search(); }
  async search(): Promise<void> { await this.facade.loadAuditLogs(this.filters); }
  fmtDate(d: string): string { return formatDateTime(d); }
}
