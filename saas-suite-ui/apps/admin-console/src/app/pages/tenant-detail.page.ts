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
import { StatusChipComponent, ConfirmDialogComponent } from '@saas-suite/shared/ui';
import { TenantsFacade, Tenant, TenantPlan } from '@saas-suite/data-access/core';
import { CoreApiClient } from '@saas-suite/data-access/core';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [
    FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatIconModule, MatProgressBarModule,
    MatSnackBarModule, MatDialogModule, StatusChipComponent,
  ],
  template: `
    @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

    @if (tenant()) {
      <div class="page-header">
        <div>
          <h1>{{ tenant()!.name }}</h1>
          <saas-status-chip [status]="tenant()!.status" />
        </div>
        <div class="actions">
          <button mat-stroked-button (click)="goBack()"><mat-icon>arrow_back</mat-icon> Voltar</button>
          @if (tenant()!.status === 'ACTIVE') {
            <button mat-raised-button color="warn" (click)="suspend()">Suspender</button>
          } @else if (tenant()!.status === 'SUSPENDED') {
            <button mat-raised-button color="primary" (click)="activate()">Ativar</button>
          }
        </div>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Nome</mat-label>
              <input matInput [(ngModel)]="editName">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Slug</mat-label>
              <input matInput [value]="tenant()!.slug" disabled>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Plano</mat-label>
              <mat-select [(ngModel)]="editPlan">
                <mat-option value="starter">Starter</mat-option>
                <mat-option value="professional">Professional</mat-option>
                <mat-option value="enterprise">Enterprise</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Região</mat-label>
              <input matInput [value]="tenant()!.region" disabled>
            </mat-form-field>
          </div>
          <button mat-raised-button color="primary" (click)="save()" [disabled]="saving()">
            Salvar Alterações
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

  tenant = signal<Tenant | null>(null);
  loading = signal(true);
  saving = signal(false);
  editName = '';
  editPlan: TenantPlan = 'starter';

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id')!;
    try {
      const t = await firstValueFrom(this.api.getTenant(id));
      this.tenant.set(t);
      this.editName = t.name;
      this.editPlan = t.plan;
    } catch { this.snackBar.open('Tenant não encontrado', 'OK', { duration: 3000 }); }
    finally { this.loading.set(false); }
  }

  async save(): Promise<void> {
    this.saving.set(true);
    const t = await this.facade.updateTenant(this.tenant()!.id, { name: this.editName, plan: this.editPlan });
    if (t) { this.tenant.set(t); this.snackBar.open('Tenant atualizado', 'OK', { duration: 2000 }); }
    this.saving.set(false);
  }

  async suspend(): Promise<void> {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: 'Suspender tenant?', message: 'Esta ação suspenderá o acesso do tenant.', danger: true } });
    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;
    const t = await this.facade.updateTenant(this.tenant()!.id, { status: 'SUSPENDED' });
    if (t) this.tenant.set(t);
  }

  async activate(): Promise<void> {
    const t = await this.facade.updateTenant(this.tenant()!.id, { status: 'ACTIVE' });
    if (t) this.tenant.set(t);
  }

  goBack(): void { this.router.navigate(['/tenants']); }
}
