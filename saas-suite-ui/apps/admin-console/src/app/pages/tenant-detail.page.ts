import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { StatusChipComponent, ConfirmDialogComponent } from '@saas-suite/shared/ui';
import { TenantsFacade, Tenant, TenantPlan } from '@saas-suite/data-access/core';
import { CoreApiClient } from '@saas-suite/data-access/core';
import { I18nService } from '@saas-suite/shared/i18n';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatIconModule, MatProgressBarModule,
    MatSnackBarModule, MatDialogModule, StatusChipComponent,
  ],
  template: `
    @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

    @if (isCreateMode()) {
      <div class="page-header">
        <h1>{{ i18n.messages().admin.newTenantTitle }}</h1>
        <button mat-stroked-button (click)="goBack()"><mat-icon>arrow_back</mat-icon> {{ i18n.messages().common.back }}</button>
      </div>
      <mat-card>
        <mat-card-content>
          <form [formGroup]="createForm" class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>{{ i18n.messages().common.name }}</mat-label>
              <input matInput formControlName="name" [placeholder]="i18n.messages().adminPlaceholders.tenantName">
              @if (createForm.controls['name'].hasError('required') && createForm.controls['name'].touched) {
                <mat-error>{{ i18n.messages().admin.nameRequired }}</mat-error>
              }
              @if (createForm.controls['name'].hasError('minlength')) {
                <mat-error>{{ i18n.messages().admin.nameMinLength }}</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ i18n.messages().tenant.tenantPlan }}</mat-label>
              <mat-select formControlName="plan">
                <mat-option value="starter">{{ i18n.messages().tenant.planStarter }}</mat-option>
                <mat-option value="professional">{{ i18n.messages().tenant.planProfessional }}</mat-option>
                <mat-option value="enterprise">{{ i18n.messages().tenant.planEnterprise }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ i18n.messages().tenant.tenantRegion }}</mat-label>
              <input matInput formControlName="region" [placeholder]="i18n.messages().adminPlaceholders.region">
            </mat-form-field>
          </form>
          <button mat-raised-button color="primary" (click)="create()" [disabled]="createForm.invalid || saving()">
            {{ i18n.messages().tenant.createTenant }}
          </button>
        </mat-card-content>
      </mat-card>
    } @else if (tenant()) {
      <div class="page-header">
        <div>
          <h1>{{ tenant()!.name }}</h1>
          <saas-status-chip [status]="tenant()!.status" />
        </div>
        <div class="actions">
          <button mat-stroked-button (click)="goBack()"><mat-icon>arrow_back</mat-icon> {{ i18n.messages().common.back }}</button>
          @if (tenant()!.status === 'ACTIVE') {
            <button mat-raised-button color="warn" (click)="suspend()">{{ i18n.messages().admin.suspend }}</button>
          } @else if (tenant()!.status === 'SUSPENDED') {
            <button mat-raised-button color="primary" (click)="activate()">{{ i18n.messages().admin.activate }}</button>
          }
        </div>
      </div>

      <mat-card>
        <mat-card-content>
          <form [formGroup]="editForm" class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>{{ i18n.messages().common.name }}</mat-label>
              <input matInput formControlName="name">
              @if (editForm.controls['name'].hasError('required') && editForm.controls['name'].touched) {
                <mat-error>{{ i18n.messages().admin.nameRequired }}</mat-error>
              }
              @if (editForm.controls['name'].hasError('minlength')) {
                <mat-error>{{ i18n.messages().admin.nameMinLength }}</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ i18n.messages().tenant.tenantPlan }}</mat-label>
              <mat-select formControlName="plan">
                <mat-option value="starter">{{ i18n.messages().tenant.planStarter }}</mat-option>
                <mat-option value="professional">{{ i18n.messages().tenant.planProfessional }}</mat-option>
                <mat-option value="enterprise">{{ i18n.messages().tenant.planEnterprise }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ i18n.messages().tenant.tenantRegion }}</mat-label>
              <input matInput [value]="tenant()!.region" disabled>
            </mat-form-field>
          </form>
          <button mat-raised-button color="primary" (click)="save()" [disabled]="editForm.invalid || saving()">
            {{ i18n.messages().admin.saveChanges }}
          </button>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .page-header h1 { margin: 0 12px 0 0; display: inline; }
    .actions { display: flex; gap: 8px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
  `],
})
export class TenantDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private facade = inject(TenantsFacade);
  private api = inject(CoreApiClient);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  protected i18n = inject(I18nService);

  tenant = signal<Tenant | null>(null);
  loading = signal(true);
  saving = signal(false);

  createForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    plan: ['starter' as TenantPlan, Validators.required],
    region: ['us-east-1', Validators.required],
  });

  editForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    plan: ['starter' as TenantPlan, Validators.required],
  });

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
      this.editForm.patchValue({ name: t.name, plan: t.plan });
    } catch { this.snackBar.open(this.i18n.messages().admin.tenantNotFound, 'OK', { duration: 3000 }); }
    finally { this.loading.set(false); }
  }

  async create(): Promise<void> {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const val = this.createForm.getRawValue();
    const created = await this.facade.createTenant({
      name: val.name!,
      plan: val.plan!,
      region: val.region!,
    });
    if (created) {
      this.snackBar.open(this.i18n.messages().admin.tenantCreated, 'OK', { duration: 2000 });
      this.router.navigate(['/tenants', created.id]);
    }
    this.saving.set(false);
  }

  async save(): Promise<void> {
    const current = this.tenant();
    if (!current || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const val = this.editForm.getRawValue();
    const t = await this.facade.updateTenant(current.id, { name: val.name!, plan: val.plan! });
    if (t) { this.tenant.set(t); this.snackBar.open(this.i18n.messages().admin.tenantUpdated, 'OK', { duration: 2000 }); }
    this.saving.set(false);
  }

  async suspend(): Promise<void> {
    const current = this.tenant();
    if (!current) return;
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: this.i18n.messages().admin.suspendTenantTitle, message: this.i18n.messages().admin.suspendTenantMessage, danger: true } });
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
