import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CoreApiClient, PoliciesFacade, Policy, CreatePolicyRequest } from '@saas-suite/data-access/core';
import { ConfirmDialogComponent } from '@saas-suite/shared/ui';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-policy-detail',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  template: `
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (policy(); as p) {
      <div class="page-header">
        <div>
          <h1>Policy: <code>{{ p.permissionCode }}</code></h1>
          <span [class]="p.effect === 'ALLOW' ? 'chip-allow' : 'chip-deny'">{{ p.effect }}</span>
        </div>
        <div class="actions">
          <button mat-stroked-button (click)="goBack()"><mat-icon>arrow_back</mat-icon> Voltar</button>
          <button mat-raised-button color="warn" (click)="remove()"><mat-icon>delete</mat-icon> Remover</button>
        </div>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Permission Code</mat-label>
              <input matInput [(ngModel)]="edit.permissionCode" placeholder="ex: orders:write">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Efeito</mat-label>
              <mat-select [(ngModel)]="edit.effect">
                <mat-option value="ALLOW">ALLOW</mat-option>
                <mat-option value="DENY">DENY</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Descrição</mat-label>
              <input matInput [(ngModel)]="edit.description" placeholder="Descrição opcional">
            </mat-form-field>
            <mat-slide-toggle [(ngModel)]="edit.enabled">Habilitada</mat-slide-toggle>
          </div>
          <button mat-raised-button color="primary" (click)="save()" [disabled]="saving()">
            Salvar alterações
          </button>
        </mat-card-content>
      </mat-card>
    } @else if (!loading()) {
      <p>Policy não encontrada.</p>
      <button mat-stroked-button (click)="goBack()">Voltar à lista</button>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .page-header h1 { margin: 0 12px 0 0; font-size: 24px; font-weight: 600; color: var(--app-text); }
    .actions { display: flex; gap: 8px; }
    .chip-allow { background: var(--app-chip-allow-bg); color: var(--app-chip-allow-text); padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .chip-deny { background: var(--app-chip-deny-bg); color: var(--app-chip-deny-text); padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .full-width { grid-column: 1 / -1; }
    mat-card { border-radius: 12px; }
    mat-card-content { padding: 20px !important; }
  `],
})
export class PolicyDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(CoreApiClient);
  private policiesFacade = inject(PoliciesFacade);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  policy = signal<Policy | null>(null);
  loading = signal(true);
  saving = signal(false);
  edit: CreatePolicyRequest & { enabled: boolean } = {
    permissionCode: '',
    effect: 'ALLOW',
    enabled: true,
    description: '',
  };

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }
    try {
      const p = await firstValueFrom(this.api.getPolicy(id));
      this.policy.set(p);
      this.edit = {
        permissionCode: p.permissionCode,
        effect: p.effect,
        enabled: p.enabled,
        description: p.description ?? '',
      };
    } catch {
      this.snackBar.open('Policy não encontrada', 'OK', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    const p = this.policy();
    if (!p) return;
    this.saving.set(true);
    const updated = await this.policiesFacade.updatePolicy(p.id, {
      permissionCode: this.edit.permissionCode,
      effect: this.edit.effect,
      enabled: this.edit.enabled,
      description: this.edit.description || undefined,
    });
    if (updated) {
      this.policy.set(updated);
      this.snackBar.open('Policy atualizada', 'OK', { duration: 2000 });
    }
    this.saving.set(false);
  }

  async remove(): Promise<void> {
    const p = this.policy();
    if (!p) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Remover policy?', message: `Deseja remover "${p.permissionCode}"?`, danger: true },
    });
    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;
    const ok = await this.policiesFacade.deletePolicy(p.id);
    if (ok) {
      this.snackBar.open('Policy removida', 'OK', { duration: 2000 });
      this.router.navigate(['/policies']);
    }
  }

  goBack(): void {
    this.router.navigate(['/policies']);
  }
}
