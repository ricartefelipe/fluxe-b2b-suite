import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EmptyStateComponent, ConfirmDialogComponent } from '@saas-suite/shared/ui';
import { PoliciesFacade, Policy, CreatePolicyRequest, PolicyEffect } from '@saas-suite/data-access/core';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-policies-list',
  standalone: true,
  imports: [
    FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule,
    MatDialogModule, MatSnackBarModule, EmptyStateComponent,
  ],
  template: `
    <div class="page-header">
      <h1>Policies (ABAC/RBAC)</h1>
      <button mat-raised-button color="primary" (click)="showForm = !showForm">
        <mat-icon>{{ showForm ? 'close' : 'add' }}</mat-icon> {{ showForm ? 'Cancelar' : 'Nova Policy' }}
      </button>
    </div>

    @if (showForm) {
      <div class="create-form">
        <mat-form-field appearance="outline">
          <mat-label>Permission Code</mat-label>
          <input matInput [(ngModel)]="newPolicy.permissionCode" placeholder="ex: orders:write">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Efeito</mat-label>
          <mat-select [(ngModel)]="newPolicy.effect">
            <mat-option value="ALLOW">ALLOW</mat-option>
            <mat-option value="DENY">DENY</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Descrição</mat-label>
          <input matInput [(ngModel)]="newPolicy.description">
        </mat-form-field>
        <mat-slide-toggle [(ngModel)]="newPolicyEnabled">Habilitada</mat-slide-toggle>
        <button mat-raised-button color="primary" (click)="create()">Criar</button>
      </div>
    }

    @if (facade.loading()) { <mat-progress-bar mode="indeterminate" /> }

    @if (facade.policies().length === 0 && !facade.loading()) {
      <saas-empty-state icon="policy" title="Nenhuma policy encontrada" />
    } @else {
      <table mat-table [dataSource]="facade.policies()" class="full-width">
        <ng-container matColumnDef="permissionCode">
          <th mat-header-cell *matHeaderCellDef>Permission Code</th>
          <td mat-cell *matCellDef="let p"><code>{{ p.permissionCode }}</code></td>
        </ng-container>
        <ng-container matColumnDef="effect">
          <th mat-header-cell *matHeaderCellDef>Efeito</th>
          <td mat-cell *matCellDef="let p">
            <span [class]="p.effect === 'ALLOW' ? 'chip-allow' : 'chip-deny'">{{ p.effect }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="enabled">
          <th mat-header-cell *matHeaderCellDef>Ativa</th>
          <td mat-cell *matCellDef="let p">{{ p.enabled ? 'Sim' : 'Não' }}</td>
        </ng-container>
        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>Descrição</th>
          <td mat-cell *matCellDef="let p">{{ p.description || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let p">
            <button mat-icon-button color="warn" (click)="remove(p)"><mat-icon>delete</mat-icon></button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .create-form { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; padding: 16px; background: #fafafa; border-radius: 8px; }
    .full-width { width: 100%; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    .chip-allow { background: #e8f5e9; color: #2e7d32; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .chip-deny { background: #ffebee; color: #c62828; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  `],
})
export class PoliciesListPage implements OnInit {
  protected facade = inject(PoliciesFacade);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  columns = ['permissionCode', 'effect', 'enabled', 'description', 'actions'];
  showForm = false;
  newPolicy: CreatePolicyRequest = { permissionCode: '', effect: 'ALLOW' };
  newPolicyEnabled = true;

  async ngOnInit(): Promise<void> { await this.facade.loadPolicies(); }

  async create(): Promise<void> {
    const p = await this.facade.createPolicy({ ...this.newPolicy, enabled: this.newPolicyEnabled });
    if (p) { this.showForm = false; this.newPolicy = { permissionCode: '', effect: 'ALLOW' }; this.snackBar.open('Policy criada', 'OK', { duration: 2000 }); }
  }

  async remove(p: Policy): Promise<void> {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: 'Remover policy?', message: `Deseja remover "${p.permissionCode}"?`, danger: true } });
    const confirmed = await firstValueFrom(ref.afterClosed());
    if (confirmed) await this.facade.deletePolicy(p.id);
  }
}
