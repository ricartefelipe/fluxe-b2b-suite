import { Component, inject, OnInit, ViewChild, AfterViewInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StatusChipComponent, EmptyStateComponent, TableSkeletonComponent } from '@saas-suite/shared/ui';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { formatDateTime } from '@saas-suite/shared/util';

const UM = {
  title: 'Usuários',
  invite: 'Convidar Usuário',
  search: 'Buscar por nome ou email',
  name: 'Nome',
  email: 'Email',
  roles: 'Perfis',
  status: 'Status',
  createdAt: 'Criado em',
  actions: 'Ações',
  all: 'Todos',
  save: 'Salvar',
  cancel: 'Cancelar',
  inviteTitle: 'Convidar Usuário',
  editTitle: 'Editar Usuário',
  noUsers: 'Nenhum usuário encontrado',
  noUsersDesc: 'Convide o primeiro usuário para este tenant',
  confirmDelete: 'Tem certeza que deseja remover este usuário?',
  deleteSuccess: 'Usuário removido',
  inviteSuccess: 'Convite enviado',
  updateSuccess: 'Usuário atualizado',
  error: 'Erro ao processar solicitação',
};

const AVAILABLE_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'ops', label: 'Ops' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'member', label: 'Member' },
];

const USER_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED'];

interface UserDto {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  roles: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Invite / Edit Dialog
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-invite-user-dialog',
  standalone: true,
  imports: [
    FormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatDialogModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data?.user ? UM.editTitle : UM.inviteTitle }}</h2>
    <mat-dialog-content class="dialog-content">
      <mat-form-field appearance="outline" class="full-field">
        <mat-label>{{ UM.name }}</mat-label>
        <input matInput [(ngModel)]="form.name" required>
      </mat-form-field>

      @if (!data?.user) {
        <mat-form-field appearance="outline" class="full-field">
          <mat-label>{{ UM.email }}</mat-label>
          <input matInput [(ngModel)]="form.email" type="email" required>
        </mat-form-field>
      }

      <mat-form-field appearance="outline" class="full-field">
        <mat-label>{{ UM.roles }}</mat-label>
        <mat-select [(ngModel)]="form.roles" multiple required>
          @for (r of roles; track r.value) {
            <mat-option [value]="r.value">{{ r.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      @if (data?.user) {
        <mat-form-field appearance="outline" class="full-field">
          <mat-label>{{ UM.status }}</mat-label>
          <mat-select [(ngModel)]="form.status">
            @for (s of statuses; track s) {
              <mat-option [value]="s">{{ s }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ UM.cancel }}</button>
      <button mat-flat-button color="primary" [disabled]="!isValid()" (click)="submit()">
        {{ UM.save }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content { display: flex; flex-direction: column; gap: 4px; min-width: 380px; }
    .full-field { width: 100%; }
  `],
})
export class InviteUserDialog {
  protected readonly UM = UM;
  protected readonly roles = AVAILABLE_ROLES;
  protected readonly statuses = USER_STATUSES;

  private dialogRef = inject(MatDialogRef<InviteUserDialog>);
  protected data: { user?: UserDto } | null = inject(MAT_DIALOG_DATA, { optional: true });

  form = {
    name: this.data?.user?.name ?? '',
    email: this.data?.user?.email ?? '',
    roles: this.data?.user?.roles?.slice() ?? [],
    status: this.data?.user?.status ?? 'ACTIVE',
  };

  isValid(): boolean {
    if (!this.form.name || this.form.roles.length === 0) return false;
    if (!this.data?.user && !this.form.email) return false;
    return true;
  }

  submit(): void {
    this.dialogRef.close(this.form);
  }
}

// ---------------------------------------------------------------------------
// Users List Page
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule,
    MatDialogModule, FormsModule, MatSortModule, MatPaginatorModule,
    MatSnackBarModule,
    StatusChipComponent, EmptyStateComponent, TableSkeletonComponent,
  ],
  template: `
    <div class="page-header">
      <h1>{{ UM.title }}</h1>
      <button mat-raised-button color="primary" (click)="openInvite()">
        <mat-icon>person_add</mat-icon> {{ UM.invite }}
      </button>
    </div>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>{{ UM.search }}</mat-label>
        <input matInput [(ngModel)]="filterText" (ngModelChange)="applyFilter()" placeholder="...">
        <mat-icon matPrefix>search</mat-icon>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>{{ UM.status }}</mat-label>
        <mat-select [(ngModel)]="filterStatus" (ngModelChange)="applyFilter()">
          <mat-option [value]="''">{{ UM.all }}</mat-option>
          @for (s of statuses; track s) {
            <mat-option [value]="s">{{ s }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    @if (loading()) {
      <saas-table-skeleton [rowCount]="5" [columns]="6" />
    } @else if (dataSource.data.length === 0) {
      <saas-empty-state
        icon="people"
        [title]="UM.noUsers"
        [subtitle]="UM.noUsersDesc"
        [actionLabel]="UM.invite"
        actionIcon="person_add"
        (action)="openInvite()" />
    } @else {
      <table mat-table [dataSource]="dataSource" matSort class="full-width">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ UM.name }}</th>
          <td mat-cell *matCellDef="let u">{{ u.name }}</td>
        </ng-container>

        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ UM.email }}</th>
          <td mat-cell *matCellDef="let u">{{ u.email }}</td>
        </ng-container>

        <ng-container matColumnDef="roles">
          <th mat-header-cell *matHeaderCellDef>{{ UM.roles }}</th>
          <td mat-cell *matCellDef="let u">
            <mat-chip-set>
              @for (role of u.roles; track role) {
                <mat-chip class="role-chip" highlighted>{{ role }}</mat-chip>
              }
            </mat-chip-set>
          </td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ UM.status }}</th>
          <td mat-cell *matCellDef="let u"><saas-status-chip [status]="u.status" /></td>
        </ng-container>

        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ UM.createdAt }}</th>
          <td mat-cell *matCellDef="let u">{{ fmtDate(u.createdAt) }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let u">
            <button mat-icon-button color="primary" (click)="openEdit(u)" aria-label="Editar">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deleteUser(u)" aria-label="Remover">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;" class="clickable-row"></tr>
      </table>
      <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons />
    }
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .page-header h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1565c0;
      margin: 0;
    }
    .filters {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .filters mat-form-field { min-width: 220px; }
    .full-width { width: 100%; }
    .clickable-row:hover { background: rgba(21, 101, 192, 0.04); }
    .role-chip {
      font-size: 11px;
      min-height: 24px !important;
      padding: 2px 8px !important;
    }
  `],
})
export class UsersListPage implements OnInit, AfterViewInit {
  protected readonly UM = UM;
  protected readonly statuses = USER_STATUSES;

  private http = inject(HttpClient);
  private config = inject(RuntimeConfigService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<UserDto>([]);
  columns = ['name', 'email', 'roles', 'status', 'createdAt', 'actions'];
  loading = signal(false);
  filterText = '';
  filterStatus = '';

  private get baseUrl(): string {
    return `${this.config.get('coreApiBaseUrl')}/v1/users`;
  }

  ngAfterViewInit(): void {
    if (this.sort) this.dataSource.sort = this.sort;
    if (this.paginator) this.dataSource.paginator = this.paginator;
  }

  async ngOnInit(): Promise<void> {
    this.dataSource.filterPredicate = (user: UserDto, filter: string) => {
      const parsed = JSON.parse(filter) as { text: string; status: string };
      const matchesText =
        !parsed.text ||
        user.name.toLowerCase().includes(parsed.text) ||
        user.email.toLowerCase().includes(parsed.text);
      const matchesStatus = !parsed.status || user.status === parsed.status;
      return matchesText && matchesStatus;
    };
    await this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.loading.set(true);
    try {
      const users = await firstValueFrom(this.http.get<UserDto[]>(this.baseUrl));
      this.dataSource.data = users;
      queueMicrotask(() => {
        if (this.sort) this.dataSource.sort = this.sort;
        if (this.paginator) this.dataSource.paginator = this.paginator;
      });
    } catch {
      this.snack.open(UM.error, '', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  applyFilter(): void {
    this.dataSource.filter = JSON.stringify({
      text: this.filterText.toLowerCase(),
      status: this.filterStatus,
    });
  }

  openInvite(): void {
    const ref = this.dialog.open(InviteUserDialog, { width: '460px' });
    ref.afterClosed().subscribe(async (result) => {
      if (!result) return;
      try {
        await firstValueFrom(
          this.http.post(`${this.baseUrl}/invite`, {
            name: result.name,
            email: result.email,
            roles: result.roles,
          }),
        );
        this.snack.open(UM.inviteSuccess, '', { duration: 3000 });
        await this.loadUsers();
      } catch {
        this.snack.open(UM.error, '', { duration: 3000 });
      }
    });
  }

  openEdit(user: UserDto): void {
    const ref = this.dialog.open(InviteUserDialog, {
      width: '460px',
      data: { user },
    });
    ref.afterClosed().subscribe(async (result) => {
      if (!result) return;
      try {
        await firstValueFrom(
          this.http.patch(`${this.baseUrl}/${user.id}`, {
            name: result.name,
            roles: result.roles,
            status: result.status,
          }),
        );
        this.snack.open(UM.updateSuccess, '', { duration: 3000 });
        await this.loadUsers();
      } catch {
        this.snack.open(UM.error, '', { duration: 3000 });
      }
    });
  }

  async deleteUser(user: UserDto): Promise<void> {
    if (!confirm(UM.confirmDelete)) return;
    try {
      await firstValueFrom(this.http.delete(`${this.baseUrl}/${user.id}`));
      this.snack.open(UM.deleteSuccess, '', { duration: 3000 });
      await this.loadUsers();
    } catch {
      this.snack.open(UM.error, '', { duration: 3000 });
    }
  }

  fmtDate(d: string): string {
    return formatDateTime(d);
  }
}
