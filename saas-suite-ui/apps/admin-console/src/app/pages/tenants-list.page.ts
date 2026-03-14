import { Component, inject, OnInit, ViewChild, AfterViewInit, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { StatusChipComponent, EmptyStateComponent, TableSkeletonComponent } from '@saas-suite/shared/ui';
import { I18nService } from '@saas-suite/shared/i18n';
import { TenantsFacade, Tenant, TenantStatus, TenantPlan } from '@saas-suite/data-access/core';
import { TenantContextStore } from '@saas-suite/domains/tenancy';
import { formatDateTime } from '@saas-suite/shared/util';

@Component({
  selector: 'app-tenants-list',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule,
    MatDialogModule, FormsModule, MatSortModule, MatPaginatorModule,
    StatusChipComponent, EmptyStateComponent, TableSkeletonComponent,
  ],
  template: `
    <div class="page-header">
      <h1>{{ i18n.messages().tenant.listTitle }}</h1>
      <button mat-raised-button color="primary" (click)="openCreate()">
        <mat-icon>add</mat-icon> {{ i18n.messages().tenant.newTenant }}
      </button>
    </div>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().tenant.searchByName }}</mat-label>
        <input matInput [(ngModel)]="filterName" (ngModelChange)="search()" [placeholder]="i18n.messages().common.name + '...'">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().common.status }}</mat-label>
        <mat-select [(ngModel)]="filterStatus" (ngModelChange)="search()">
          <mat-option [value]="undefined">{{ i18n.messages().common.all }}</mat-option>
          <mat-option value="ACTIVE">{{ i18n.messages().tenant.statusActive }}</mat-option>
          <mat-option value="SUSPENDED">{{ i18n.messages().tenant.statusSuspended }}</mat-option>
          <mat-option value="DELETED">{{ i18n.messages().tenant.statusDeleted }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>{{ i18n.messages().tenant.tenantPlan }}</mat-label>
        <mat-select [(ngModel)]="filterPlan" (ngModelChange)="search()">
          <mat-option [value]="undefined">{{ i18n.messages().common.all }}</mat-option>
          <mat-option value="starter">{{ i18n.messages().tenant.planStarter }}</mat-option>
          <mat-option value="professional">{{ i18n.messages().tenant.planProfessional }}</mat-option>
          <mat-option value="enterprise">{{ i18n.messages().tenant.planEnterprise }}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    @if (facade.loading()) {
      <saas-table-skeleton [rowCount]="5" [columns]="6" />
    } @else if (dataSource.data.length === 0) {
      <saas-empty-state
        icon="business"
        [title]="i18n.messages().tenant.noTenantsFound"
        [actionLabel]="i18n.messages().tenant.newTenant"
        actionIcon="add"
        (action)="openCreate()" />
    } @else {
      <table mat-table [dataSource]="dataSource" matSort class="full-width">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().common.name }}</th>
          <td mat-cell *matCellDef="let t">{{ t.name }}</td>
        </ng-container>
        <ng-container matColumnDef="plan">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().tenant.tenantPlan }}</th>
          <td mat-cell *matCellDef="let t">{{ translatePlan(t.plan) }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().common.status }}</th>
          <td mat-cell *matCellDef="let t"><saas-status-chip [status]="t.status" /></td>
        </ng-container>
        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().tenant.createdAt }}</th>
          <td mat-cell *matCellDef="let t">{{ fmtDate(t.createdAt) }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let t">
            <button mat-icon-button (click)="goToDetail(t)"><mat-icon>open_in_new</mat-icon></button>
            <button mat-icon-button color="primary" (click)="impersonate(t)"><mat-icon>login</mat-icon></button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;" class="clickable-row"></tr>
      </table>
      <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons />
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .filters { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
    .filters mat-form-field { min-width: 180px; }
    .full-width { width: 100%; }
    .clickable-row:hover { background: rgba(0,0,0,.04); }
  `],
})
export class TenantsListPage implements OnInit, AfterViewInit {
  protected facade = inject(TenantsFacade);
  protected i18n = inject(I18nService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private tenantStore = inject(TenantContextStore);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<any>([]);
  columns = ['name', 'plan', 'status', 'createdAt', 'actions'];
  filterName?: string;
  filterStatus?: TenantStatus;
  filterPlan?: TenantPlan;

  constructor() {
    effect(() => {
      this.dataSource.data = this.facade.tenants();
      queueMicrotask(() => {
        if (this.sort) this.dataSource.sort = this.sort;
        if (this.paginator) this.dataSource.paginator = this.paginator;
      });
    });
  }

  ngAfterViewInit(): void {
    if (this.sort) this.dataSource.sort = this.sort;
    if (this.paginator) this.dataSource.paginator = this.paginator;
  }

  async ngOnInit(): Promise<void> { await this.search(); }

  async search(): Promise<void> {
    await this.facade.loadTenants({
      name: this.filterName, status: this.filterStatus, plan: this.filterPlan,
    });
  }

  goToDetail(t: Tenant): void { this.router.navigate(['/tenants', t.id]); }

  impersonate(t: Tenant): void {
    this.tenantStore.selectTenant(t);
  }

  fmtDate(d: string): string { return formatDateTime(d); }

  translatePlan(plan: string): string { return this.i18n.messages().statuses[plan] ?? plan; }

  openCreate(): void { this.router.navigate(['/tenants', 'new']); }
}
