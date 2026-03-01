import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { StatusChipComponent, ConfirmDialogComponent, PlanChipComponent } from '@saas-suite/shared/ui';
import { TenantsFacade, Tenant, TenantPlan } from '@saas-suite/data-access/core';
import { CoreApiClient } from '@saas-suite/data-access/core';
import { I18nService } from '@saas-suite/shared/i18n';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [
    FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatIconModule, MatProgressBarModule,
    MatSnackBarModule, MatDialogModule, StatusChipComponent, PlanChipComponent,
  ],
  template: `
    @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

    @if (isCreateMode()) {
      <div class="page-header">
        <h1>{{ i18n.messages().tenant.newTenant }}</h1>
        <button mat-stroked-button (click)="goBack()"><mat-icon>arrow_back</mat-icon> {{ i18n.messages().common.back }}</button>
      </div>
      <mat-card>
        <mat-card-content>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>{{ i18n.messages().tenant.tenantName }}</mat-label>
              <input matInput [(ngModel)]="createName" placeholder="Ex: Acme Corp">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ i18n.messages().tenant.tenantSlug }}</mat-label>
              <input matInput [(ngModel)]="createSlug" placeholder="Ex: acme-corp">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ i18n.messages().tenant.tenantPlan }}</mat-label>
              <mat-select [(ngModel)]="createPlan">
                <mat-option value="starter">{{ i18n.messages().tenant.planStarter }}</mat-option>
                <mat-option value="professional">{{ i18n.messages().tenant.planProfessional }}</mat-option>
                <mat-option value="enterprise">{{ i18n.messages().tenant.planEnterprise }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ i18n.messages().tenant.tenantRegion }}</mat-label>
              <input matInput [(ngModel)]="createRegion" placeholder="us-east-1">
            </mat-form-field>
          </div>
          <button mat-raised-button color="primary" (click)="create()" [disabled]="saving()">
            {{ i18n.messages().tenant.createTenant }}
          </button>
        </mat-card-content>
      </mat-card>
    } @else if (tenant()) {
      <div class="page-header">
        <div>
          <h1>{{ tenant()!.name }}</h1>
          <div class="header-chips">
            <saas-status-chip [status]="tenant()!.status" />
            <saas-plan-chip [plan]="tenant()!.plan" />
          </div>
        </div>
        <div class="actions">
          <button mat-stroked-button (click)="goBack()"><mat-icon>arrow_back</mat-icon> {{ i18n.messages().common.back }}</button>
          @if (tenant()!.status === 'ACTIVE') {
            <button mat-raised-button color="warn" (click)="suspend()">{{ i18n.messages().tenant.suspendTenant }}</button>
          } @else if (tenant()!.status === 'SUSPENDED') {
            <button mat-raised-button color="primary" (click)="activate()">{{ i18n.messages().tenant.activateTenant }}</button>
          }
        </div>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>{{ i18n.messages().tenant.tenantName }}</mat-label>
              <input matInput [(ngModel)]="editName">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ i18n.messages().tenant.tenantSlug }}</mat-label>
              <input matInput [value]="tenant()!.slug" disabled>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ i18n.messages().tenant.tenantPlan }}</mat-label>
              <mat-select [(ngModel)]="editPlan">
                <mat-option value="starter">{{ i18n.messages().tenant.planStarter }}</mat-option>
                <mat-option value="professional">{{ i18n.messages().tenant.planProfessional }}</mat-option>
                <mat-option value="enterprise">{{ i18n.messages().tenant.planEnterprise }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ i18n.messages().tenant.tenantRegion }}</mat-label>
              <input matInput [value]="tenant()!.region" disabled>
            </mat-form-field>
          </div>
          <button mat-raised-button color="primary" (click)="save()" [disabled]="saving()">
            {{ i18n.messages().admin.saveChanges }}
          </button>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--app-space-24, 24px); flex-wrap: wrap; gap: var(--app-space-16, 16px); }
    .page-header h1 { margin: 0 var(--app-space-12, 12px) 0 0; font-size: var(--app-font-size-title, 24px); font-weight: 600; color: var(--app-text, #263238); }
    .header-chips { display: flex; align-items: center; gap: 10px; margin-top: var(--app-space-8, 8px); flex-wrap: wrap; }
    .actions { display: flex; gap: var(--app-space-8, 8px); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--app-space-16, 16px); margin-bottom: var(--app-space-20, 20px); }
    mat-card { border-radius: 14px; }
    mat-card-content { padding: var(--app-space-20, 20px) !important; }
  `],
})
export class TenantDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private facade = inject(TenantsFacade);
  private api = inject(CoreApiClient);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  protected i18n = inject(I18nService);

  tenant = signal<Tenant | null>(null);
  loading = signal(true);
  saving = signal(false);
  editName = '';
  editPlan: TenantPlan = 'starter';
  createName = '';
  createSlug = '';
  createPlan: TenantPlan = 'starter';
  createRegion = 'us-east-1';

  isCreateMode(): boolean {
    return this.route.snapshot.paramMap.get('id') === 'new';
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || id === 'new') {
      this.loading.set(false);
      return;
    }
    try {
      const t = await firstValueFrom(this.api.getTenant(id));
      this.tenant.set(t);
      this.editName = t.name;
      this.editPlan = t.plan;
    } catch { this.snackBar.open(this.i18n.messages().tenant.tenantNotFound, 'OK', { duration: 3000 }); }
    finally { this.loading.set(false); }
  }

  async create(): Promise<void> {
    this.saving.set(true);
    const created = await this.facade.createTenant({
      name: this.createName,
      slug: this.createSlug,
      plan: this.createPlan,
      region: this.createRegion,
    });
    if (created) {
      this.snackBar.open(this.i18n.messages().tenant.tenantCreated, 'OK', { duration: 2000 });
      this.router.navigate(['/tenants', created.id]);
    }
    this.saving.set(false);
  }

  async save(): Promise<void> {
    const current = this.tenant();
    if (!current) return;
    this.saving.set(true);
    const t = await this.facade.updateTenant(current.id, { name: this.editName, plan: this.editPlan });
    if (t) { this.tenant.set(t); this.snackBar.open(this.i18n.messages().tenant.tenantUpdated, 'OK', { duration: 2000 }); }
    this.saving.set(false);
  }

  async suspend(): Promise<void> {
    const current = this.tenant();
    if (!current) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.i18n.messages().tenant.suspendTenantConfirmTitle,
        message: this.i18n.messages().tenant.suspendTenantConfirmMessage,
        danger: true,
      },
    });
    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;
    const t = await this.facade.updateTenant(current.id, { status: 'SUSPENDED' });
    if (t) this.tenant.set(t);
  }

  async activate(): Promise<void> {
    const current = this.tenant();
    if (!current) return;
    const t = await this.facade.updateTenant(current.id, { status: 'ACTIVE' });
    if (t) this.tenant.set(t);
  }

  goBack(): void { this.router.navigate(['/tenants']); }
}
