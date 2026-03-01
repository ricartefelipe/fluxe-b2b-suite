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

@Component({
  selector: 'app-flags-list',
  standalone: true,
  imports: [
    FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatSnackBarModule, EmptyStateComponent,
  ],
  template: `
    <div class="page-header">
      <h1>Feature Flags</h1>
      @if (tenantStore.activeTenantId()) {
        <span class="tenant-badge">Tenant: {{ tenantStore.activeTenant()?.name }}</span>
      }
    </div>

    @if (!tenantStore.activeTenantId()) {
      <saas-empty-state icon="flag" title="Selecione um tenant no header para gerenciar flags" />
    } @else {
      @if (showForm) {
        <div class="create-form">
          <mat-form-field appearance="outline">
            <mat-label>Nome</mat-label>
            <input matInput [(ngModel)]="newName" placeholder="ex: dark_mode">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Descrição</mat-label>
            <input matInput [(ngModel)]="newDesc">
          </mat-form-field>
          <mat-slide-toggle [(ngModel)]="newEnabled">Habilitada</mat-slide-toggle>
          <button mat-raised-button color="primary" (click)="create()">Criar</button>
          <button mat-stroked-button (click)="showForm = false">Cancelar</button>
        </div>
      } @else {
        <button mat-raised-button color="primary" (click)="showForm = true" style="margin-bottom: 16px">
          <mat-icon>add</mat-icon> Nova Flag
        </button>
      }

      @if (facade.loading()) { <mat-progress-bar mode="indeterminate" /> }

      @if (facade.flags().length === 0 && !facade.loading()) {
        <saas-empty-state
          icon="flag"
          title="Nenhuma flag encontrada para este tenant"
          subtitle="Crie feature flags para habilitar ou desabilitar funcionalidades por tenant."
          actionLabel="Nova Flag"
          (action)="showForm = true"
        />
      } @else {
        <table mat-table [dataSource]="facade.flags()" class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let f"><code>{{ f.name }}</code></td>
          </ng-container>
          <ng-container matColumnDef="enabled">
            <th mat-header-cell *matHeaderCellDef>Habilitada</th>
            <td mat-cell *matCellDef="let f">
              <mat-slide-toggle [checked]="f.enabled" (change)="toggle(f)" />
            </td>
          </ng-container>
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Descrição</th>
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
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .tenant-badge { background: #e3f2fd; color: #1565c0; padding: 4px 12px; border-radius: 16px; font-size: 13px; }
    .create-form { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; padding: 16px; background: #fafafa; border-radius: 8px; }
    .full-width { width: 100%; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
  `],
})
export class FlagsListPage implements OnInit {
  protected facade = inject(FlagsFacade);
  protected tenantStore = inject(TenantContextStore);
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
    this.snackBar.open('Flag criada', 'OK', { duration: 2000 });
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
