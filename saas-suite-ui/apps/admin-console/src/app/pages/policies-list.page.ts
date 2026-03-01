import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
import { PoliciesFacade, Policy, CreatePolicyRequest } from '@saas-suite/data-access/core';
import { I18nService } from '@saas-suite/shared/i18n';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-policies-list',
  standalone: true,
  imports: [
    FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule,
    MatDialogModule, MatSnackBarModule, EmptyStateComponent, RouterLink,
  ],
  template: `
    <div class="page-header">
      <h1>{{ i18n.messages().admin.policiesTitle }}</h1>
      <button mat-raised-button color="primary" (click)="showForm = !showForm">
        <mat-icon>{{ showForm ? 'close' : 'add' }}</mat-icon> {{ showForm ? i18n.messages().common.cancel : i18n.messages().admin.newPolicy }}
      </button>
    </div>

    @if (showForm) {
      <div class="create-form">
        <mat-form-field appearance="outline">
          <mat-label>{{ i18n.messages().admin.permissionCode }}</mat-label>
          <input matInput [(ngModel)]="newPolicy.permissionCode" placeholder="ex: orders:write">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ i18n.messages().admin.effect }}</mat-label>
          <mat-select [(ngModel)]="newPolicy.effect">
            <mat-option value="ALLOW">ALLOW</mat-option>
            <mat-option value="DENY">DENY</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ i18n.messages().common.description }}</mat-label>
          <input matInput [(ngModel)]="newPolicy.description">
        </mat-form-field>
        <mat-slide-toggle [(ngModel)]="newPolicyEnabled">{{ i18n.messages().admin.enabled }}</mat-slide-toggle>
        <button mat-raised-button color="primary" (click)="create()">{{ i18n.messages().common.create }}</button>
      </div>
    }

    @if (facade.loading()) { <mat-progress-bar mode="indeterminate" /> }

    @if (facade.policies().length === 0 && !facade.loading()) {
      <saas-empty-state
        icon="policy"
        [title]="i18n.messages().admin.noPoliciesFound"
        [subtitle]="i18n.messages().admin.noPoliciesFoundSubtitle"
        [actionLabel]="i18n.messages().admin.newPolicy"
        (action)="showForm = true"
      />
    } @else {
      <table mat-table [dataSource]="facade.policies()" class="full-width">
        <ng-container matColumnDef="permissionCode">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().admin.permissionCode }}</th>
          <td mat-cell *matCellDef="let p"><a [routerLink]="['/policies', p.id]" class="code-link"><code>{{ p.permissionCode }}</code></a></td>
        </ng-container>
        <ng-container matColumnDef="effect">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().admin.effect }}</th>
          <td mat-cell *matCellDef="let p">
            <span [class]="p.effect === 'ALLOW' ? 'chip-allow' : 'chip-deny'">{{ p.effect }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="enabled">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().admin.active }}</th>
          <td mat-cell *matCellDef="let p">{{ p.enabled ? i18n.messages().common.yes : i18n.messages().common.no }}</td>
        </ng-container>
        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>{{ i18n.messages().common.description }}</th>
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
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--app-space-16, 16px); }
    .create-form { display: flex; gap: var(--app-space-12, 12px); flex-wrap: wrap; align-items: center; margin-bottom: var(--app-space-16, 16px); padding: var(--app-space-16, 16px); background: var(--app-surface-variant); border-radius: 14px; }
    .full-width { width: 100%; }
    .chip-allow { background: var(--app-chip-allow-bg); color: var(--app-chip-allow-text); padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .chip-deny { background: var(--app-chip-deny-bg); color: var(--app-chip-deny-text); padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .code-link { color: inherit; text-decoration: none; }
    .code-link:hover { text-decoration: underline; }
  `],
})
export class PoliciesListPage implements OnInit {
  protected facade = inject(PoliciesFacade);
  protected i18n = inject(I18nService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  columns = ['permissionCode', 'effect', 'enabled', 'description', 'actions'];
  showForm = false;
  newPolicy: CreatePolicyRequest = { permissionCode: '', effect: 'ALLOW' };
  newPolicyEnabled = true;

  async ngOnInit(): Promise<void> { await this.facade.loadPolicies(); }

  async create(): Promise<void> {
    const p = await this.facade.createPolicy({ ...this.newPolicy, enabled: this.newPolicyEnabled });
    if (p) { this.showForm = false; this.newPolicy = { permissionCode: '', effect: 'ALLOW' }; this.snackBar.open(this.i18n.messages().admin.policyCreated, 'OK', { duration: 2000 }); }
  }

  async remove(p: Policy): Promise<void> {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: this.i18n.messages().admin.removePolicyConfirm, message: `Deseja remover "${p.permissionCode}"?`, danger: true } });
    const confirmed = await firstValueFrom(ref.afterClosed());
    if (confirmed) await this.facade.deletePolicy(p.id);
  }
}
