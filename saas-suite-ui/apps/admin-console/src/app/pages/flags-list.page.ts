import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EmptyStateComponent } from '@saas-suite/shared/ui';
import { FlagsFacade, FeatureFlag } from '@saas-suite/data-access/core';
import { TenantContextStore } from '@saas-suite/domains/tenancy';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'app-flags-list',
  standalone: true,
  imports: [
    FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatSnackBarModule, EmptyStateComponent,
  ],
  template: `
    <div class="page-header">
      <h1>{{ i18n.messages().admin.flagsTitle }}</h1>
      @if (tenantStore.activeTenantId()) {
        <span class="tenant-badge">{{ i18n.messages().admin.tenantLabel }}: {{ tenantStore.activeTenant()?.name }}</span>
      }
    </div>

    @if (!tenantStore.activeTenantId()) {
      <saas-empty-state icon="flag" [title]="i18n.messages().admin.selectTenantForFlags" />
    } @else {
      @if (showForm) {
        <div class="create-form">
          <mat-form-field appearance="outline">
            <mat-label>{{ i18n.messages().common.name }}</mat-label>
            <input matInput [(ngModel)]="newName" placeholder="ex: dark_mode">
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
        <button mat-raised-button color="primary" (click)="showForm = true" class="add-btn">
          <mat-icon>add</mat-icon> {{ i18n.messages().admin.newFlag }}
        </button>
      }

      @if (facade.loading()) { <mat-progress-bar mode="indeterminate" /> }

      @if (facade.flags().length === 0 && !facade.loading()) {
        <saas-empty-state
          icon="flag"
          [title]="i18n.messages().admin.noFlagsFound"
          [subtitle]="i18n.messages().admin.noFlagsFoundSubtitle"
          [actionLabel]="i18n.messages().admin.newFlag"
          (action)="showForm = true"
        />
      } @else {
        <table mat-table [dataSource]="facade.flags()" class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.name }}</th>
            <td mat-cell *matCellDef="let f"><code>{{ f.name }}</code></td>
          </ng-container>
          <ng-container matColumnDef="enabled">
            <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().admin.enabled }}</th>
            <td mat-cell *matCellDef="let f">
              <mat-slide-toggle [checked]="f.enabled" (change)="toggle(f)" />
            </td>
          </ng-container>
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.description }}</th>
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
      }
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--app-space-16, 16px); }
    .tenant-badge { background: var(--app-primary-light); color: var(--app-surface); padding: 4px 12px; border-radius: 16px; font-size: 13px; }
    .create-form { display: flex; gap: var(--app-space-12, 12px); flex-wrap: wrap; align-items: center; margin-bottom: var(--app-space-16, 16px); padding: var(--app-space-16, 16px); background: var(--app-surface-variant); border-radius: 14px; }
    .add-btn { margin-bottom: var(--app-space-16, 16px); }
    .full-width { width: 100%; }
    code { background: var(--app-code-bg); padding: 2px 6px; border-radius: 4px; font-size: 12px; }
  `],
})
export class FlagsListPage implements OnInit {
  protected facade = inject(FlagsFacade);
  protected tenantStore = inject(TenantContextStore);
  protected i18n = inject(I18nService);
  private snackBar = inject(MatSnackBar);

  columns = ['name', 'enabled', 'description', 'actions'];
  showForm = false;
  newName = '';
  newDesc = '';
  newEnabled = true;

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
