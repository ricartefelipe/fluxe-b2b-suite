import { Component, inject, OnInit, ViewChild, AfterViewInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { EmptyStateComponent, TableSkeletonComponent } from '@saas-suite/shared/ui';
import { FlagsFacade, FeatureFlag } from '@saas-suite/data-access/core';
import { TenantContextStore } from '@saas-suite/domains/tenancy';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'app-flags-list',
  standalone: true,
  imports: [
    FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatSnackBarModule,
    MatSortModule, MatPaginatorModule,
    EmptyStateComponent, TableSkeletonComponent,
  ],
  template: `
    <div class="page-header">
      <h1>{{ i18n.messages().admin.featureFlagsTitle }}</h1>
      @if (tenantStore.activeTenantId()) {
        <span class="tenant-badge">Tenant: {{ tenantStore.activeTenant()?.name }}</span>
      }
    </div>

    @if (!tenantStore.activeTenantId()) {
      <saas-empty-state icon="flag" [title]="i18n.messages().admin.selectTenantForFlags" />
    } @else {
      @if (showForm) {
        <div class="create-form">
          <mat-form-field appearance="outline">
            <mat-label>{{ i18n.messages().common.name }}</mat-label>
            <input matInput [(ngModel)]="newName" [placeholder]="i18n.messages().adminPlaceholders.flagName">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>{{ i18n.messages().common.description }}</mat-label>
            <input matInput [(ngModel)]="newDesc">
          </mat-form-field>
          <mat-slide-toggle [(ngModel)]="newEnabled">{{ i18n.messages().admin.enabled }}</mat-slide-toggle>
          <button mat-raised-button color="primary" (click)="create()">{{ i18n.messages().common.create }}</button>
          <button mat-stroked-button (click)="showForm = false">{{ i18n.messages().common.cancel }}</button>
        </div>
      } @else {
        <button mat-raised-button color="primary" (click)="showForm = true" style="margin-bottom: 16px">
          <mat-icon>add</mat-icon> {{ i18n.messages().admin.newFlag }}
        </button>
      }

      @if (facade.loading()) {
        <saas-table-skeleton [rowCount]="5" [columns]="4" />
      } @else if (dataSource.data.length === 0) {
        <saas-empty-state icon="flag" [title]="i18n.messages().admin.noFlagsFound" />
      } @else {
        <table mat-table [dataSource]="dataSource" matSort class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().common.name }}</th>
            <td mat-cell *matCellDef="let f"><code>{{ f.name }}</code></td>
          </ng-container>
          <ng-container matColumnDef="enabled">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().admin.enabled }}</th>
            <td mat-cell *matCellDef="let f">
              <mat-slide-toggle [checked]="f.enabled" (change)="toggle(f)" />
            </td>
          </ng-container>
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().common.description }}</th>
            <td mat-cell *matCellDef="let f">{{ f.description || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let f">
              <button mat-icon-button color="warn" (click)="remove(f)"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
        <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons />
      }
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .tenant-badge { background: #e3f2fd; color: #1565c0; padding: 4px 12px; border-radius: 16px; font-size: 13px; }
    .create-form { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; padding: 16px; background: #fafafa; border-radius: 8px; }
    .full-width { width: 100%; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
  `],
})
export class FlagsListPage implements OnInit, AfterViewInit {
  protected facade = inject(FlagsFacade);
  protected tenantStore = inject(TenantContextStore);
  protected i18n = inject(I18nService);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<any>([]);
  columns = ['name', 'enabled', 'description', 'actions'];
  showForm = false;
  newName = '';
  newDesc = '';
  newEnabled = true;

  constructor() {
    effect(() => {
      this.dataSource.data = this.facade.flags();
    });
  }

  ngAfterViewInit(): void {
    if (this.sort) this.dataSource.sort = this.sort;
    if (this.paginator) this.dataSource.paginator = this.paginator;
  }

  async ngOnInit(): Promise<void> {
    const tid = this.tenantStore.activeTenantId();
    if (tid) await this.facade.loadFlags(tid);
  }

  async create(): Promise<void> {
    const tid = this.tenantStore.activeTenantId();
    if (!tid) return;
    await this.facade.createFlag(tid, { name: this.newName, enabled: this.newEnabled, description: this.newDesc });
    this.showForm = false;
    this.newName = '';
    this.newDesc = '';
    this.snackBar.open(this.i18n.messages().admin.flagCreated, 'OK', { duration: 2000 });
  }

  async toggle(f: FeatureFlag): Promise<void> {
    const tid = this.tenantStore.activeTenantId();
    if (!tid) return;
    await this.facade.updateFlag(tid, f.name, { enabled: !f.enabled });
  }

  async remove(f: FeatureFlag): Promise<void> {
    const tid = this.tenantStore.activeTenantId();
    if (!tid) return;
    await this.facade.deleteFlag(tid, f.name);
  }
}
