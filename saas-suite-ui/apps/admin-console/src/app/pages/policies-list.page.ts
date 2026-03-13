import { Component, inject, OnInit, ViewChild, AfterViewInit, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { EmptyStateComponent, ConfirmDialogComponent, TableSkeletonComponent } from '@saas-suite/shared/ui';
import { PoliciesFacade, Policy, CreatePolicyRequest } from '@saas-suite/data-access/core';
import { I18nService } from '@saas-suite/shared/i18n';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-policies-list',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule,
    MatDialogModule, MatSnackBarModule, MatSortModule, MatPaginatorModule,
    EmptyStateComponent, TableSkeletonComponent,
  ],
  template: `
    <div class="page-header">
      <h1>{{ i18n.messages().admin.policiesTitle }}</h1>
      <button mat-raised-button color="primary" (click)="showForm = !showForm">
        <mat-icon>{{ showForm ? 'close' : 'add' }}</mat-icon> {{ showForm ? i18n.messages().common.cancel : i18n.messages().admin.newPolicy }}
      </button>
    </div>

    @if (showForm) {
      <form [formGroup]="policyForm" class="create-form" (ngSubmit)="create()">
        <mat-form-field appearance="outline">
          <mat-label>{{ i18n.messages().admin.permissionCode }}</mat-label>
          <input matInput formControlName="permissionCode" [placeholder]="i18n.messages().adminPlaceholders.permissionCode">
          @if (policyForm.controls['permissionCode'].hasError('required') && policyForm.controls['permissionCode'].touched) {
            <mat-error>{{ i18n.messages().admin.permissionCodeRequired }}</mat-error>
          }
          @if (policyForm.controls['permissionCode'].hasError('pattern')) {
            <mat-error>{{ i18n.messages().admin.invalidPermissionFormat }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ i18n.messages().admin.effect }}</mat-label>
          <mat-select formControlName="effect">
            <mat-option value="ALLOW">{{ i18n.messages().statuses['ALLOW'] }}</mat-option>
            <mat-option value="DENY">{{ i18n.messages().statuses['DENY'] }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ i18n.messages().common.description }}</mat-label>
          <input matInput formControlName="description">
        </mat-form-field>
        <mat-slide-toggle formControlName="enabled">{{ i18n.messages().admin.enabled }}</mat-slide-toggle>
        <button mat-raised-button color="primary" type="submit" [disabled]="policyForm.invalid">{{ i18n.messages().common.create }}</button>
      </form>
    }

    @if (facade.loading()) {
      <saas-table-skeleton [rowCount]="5" [columns]="5" />
    } @else if (dataSource.data.length === 0) {
      <saas-empty-state
        icon="policy"
        [title]="i18n.messages().admin.noPoliciesFound"
        [actionLabel]="i18n.messages().admin.createPolicy"
        actionIcon="add"
        (action)="showForm = true" />
    } @else {
      <table mat-table [dataSource]="dataSource" matSort class="full-width">
        <ng-container matColumnDef="permissionCode">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().admin.permissionCode }}</th>
          <td mat-cell *matCellDef="let p"><code>{{ p.permissionCode }}</code></td>
        </ng-container>
        <ng-container matColumnDef="effect">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().admin.effect }}</th>
          <td mat-cell *matCellDef="let p">
            <span [class]="p.effect === 'ALLOW' ? 'chip-allow' : 'chip-deny'">{{ translateEffect(p.effect) }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="enabled">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().admin.active }}</th>
          <td mat-cell *matCellDef="let p">{{ p.enabled ? i18n.messages().common.yes : i18n.messages().common.no }}</td>
        </ng-container>
        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ i18n.messages().common.description }}</th>
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
      <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons />
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .create-form { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; padding: 16px; background: var(--app-surface-variant); border-radius: 8px; }
    .full-width { width: 100%; }
    .chip-allow { background: var(--app-chip-allow-bg); color: var(--app-chip-allow-text); padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .chip-deny { background: var(--app-chip-deny-bg); color: var(--app-chip-deny-text); padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  `],
})
export class PoliciesListPage implements OnInit, AfterViewInit {
  protected facade = inject(PoliciesFacade);
  protected i18n = inject(I18nService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<any>([]);
  columns = ['permissionCode', 'effect', 'enabled', 'description', 'actions'];
  showForm = false;

  policyForm = this.fb.group({
    permissionCode: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_:.*-]+$/)]],
    effect: ['ALLOW' as 'ALLOW' | 'DENY', Validators.required],
    description: [''],
    enabled: [true],
  });

  constructor() {
    effect(() => {
      this.dataSource.data = this.facade.policies();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  async ngOnInit(): Promise<void> { await this.facade.loadPolicies(); }

  async create(): Promise<void> {
    if (this.policyForm.invalid) {
      this.policyForm.markAllAsTouched();
      return;
    }
    const val = this.policyForm.getRawValue();
    const req: CreatePolicyRequest & { enabled: boolean } = {
      permissionCode: val.permissionCode!,
      effect: val.effect!,
      description: val.description ?? undefined,
      enabled: val.enabled!,
    };
    const p = await this.facade.createPolicy(req);
    if (p) {
      this.showForm = false;
      this.policyForm.reset({ permissionCode: '', effect: 'ALLOW', description: '', enabled: true });
      this.snackBar.open(this.i18n.messages().admin.policyCreated, 'OK', { duration: 2000 });
    }
  }

  async remove(p: Policy): Promise<void> {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: this.i18n.messages().admin.removePolicyTitle, message: this.i18n.messages().admin.removePolicyMessage.replace('{code}', p.permissionCode), danger: true } });
    const confirmed = await firstValueFrom(ref.afterClosed());
    if (confirmed) await this.facade.deletePolicy(p.id);
  }

  translateEffect(effect: string): string { return this.i18n.messages().statuses[effect] ?? effect; }
}
