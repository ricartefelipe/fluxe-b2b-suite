import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthStore, AuthService } from '@saas-suite/shared/auth';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="profile-page">
      <div class="profile-header">
        <div class="avatar-circle">
          <span>{{ initials() }}</span>
        </div>
        <div class="profile-headline">
          <h1>{{ displayName() }}</h1>
          <span class="email">{{ session()?.email }}</span>
        </div>
      </div>

      <div class="profile-grid">
        <section class="profile-card">
          <h2><mat-icon>person</mat-icon> Dados da Conta</h2>
          <div class="info-row">
            <span class="label">Email</span>
            <span class="value">{{ session()?.email ?? '—' }}</span>
          </div>
          <div class="info-row">
            <span class="label">ID</span>
            <code class="value mono">{{ session()?.userId ?? '—' }}</code>
          </div>
          <div class="info-row">
            <span class="label">Tenant</span>
            <code class="value mono">{{ session()?.tenantId ?? '—' }}</code>
          </div>
        </section>

        <section class="profile-card">
          <h2><mat-icon>verified_user</mat-icon> Plano & Região</h2>
          <div class="info-row">
            <span class="label">Plano</span>
            <span class="badge plan">{{ session()?.plan ?? '—' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Região</span>
            <span class="badge region">{{ session()?.region ?? '—' }}</span>
          </div>
        </section>

        <section class="profile-card full-width">
          <h2><mat-icon>admin_panel_settings</mat-icon> Roles & Permissões</h2>
          <div class="info-row">
            <span class="label">Roles</span>
            <div class="chips">
              @for (role of session()?.roles ?? []; track role) {
                <span class="chip role">{{ role }}</span>
              }
              @if ((session()?.roles ?? []).length === 0) {
                <span class="chip empty">Nenhuma</span>
              }
            </div>
          </div>
          <div class="info-row">
            <span class="label">Permissões</span>
            <div class="chips">
              @for (perm of session()?.permissions ?? []; track perm) {
                <span class="chip perm">{{ perm }}</span>
              }
              @if ((session()?.permissions ?? []).length === 0) {
                <span class="chip empty">Nenhuma</span>
              }
            </div>
          </div>
        </section>
      </div>

      <div class="profile-actions">
        <button class="btn-outline" (click)="goToOrders()">
          <mat-icon>receipt_long</mat-icon> Meus Pedidos
        </button>
        <button class="btn-danger" (click)="logout()">
          <mat-icon>logout</mat-icon> Sair
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .profile-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 32px 16px;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 32px;
    }

    .avatar-circle {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1565c0, #0d47a1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
      box-shadow: 0 4px 16px rgba(21, 101, 192, 0.3);
    }

    .profile-headline h1 {
      margin: 0 0 4px;
      font-size: 24px;
      font-weight: 700;
      color: var(--shop-text, #1a2332);
    }
    .email {
      font-size: 14px;
      color: #64748b;
    }

    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 32px;
    }

    .profile-card {
      background: var(--card-bg, #fff);
      border-radius: 14px;
      padding: 24px;
      border: 1px solid var(--shop-border, #e2e8f0);
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .profile-card.full-width {
      grid-column: 1 / -1;
    }
    .profile-card h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      color: var(--shop-text, #1a2332);
      margin: 0 0 16px;
    }
    .profile-card h2 mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #1565c0;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 10px 0;
    }
    .info-row:not(:last-child) {
      border-bottom: 1px solid var(--shop-border, #f1f5f9);
    }
    .label {
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
      flex-shrink: 0;
      min-width: 80px;
    }
    .value {
      font-size: 14px;
      color: var(--shop-text, #1a2332);
      text-align: right;
    }
    .mono {
      font-family: 'Roboto Mono', monospace;
      font-size: 12px;
      background: #f1f5f9;
      padding: 4px 8px;
      border-radius: 6px;
      color: #1565c0;
    }

    .badge {
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .badge.plan {
      background: #dcfce7;
      color: #166534;
    }
    .badge.region {
      background: #dbeafe;
      color: #1e40af;
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: flex-end;
    }
    .chip {
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 500;
    }
    .chip.role {
      background: #fef3c7;
      color: #92400e;
    }
    .chip.perm {
      background: #f1f5f9;
      color: #475569;
    }
    .chip.empty {
      background: #fef2f2;
      color: #991b1b;
    }

    .profile-actions {
      display: flex;
      gap: 12px;
    }
    .profile-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.2s, box-shadow 0.2s;
    }
    .btn-outline {
      background: var(--card-bg, #fff);
      color: #1565c0;
      border: 1px solid #1565c0 !important;
    }
    .btn-outline:hover {
      background: #eff6ff;
    }
    .btn-danger {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca !important;
    }
    .btn-danger:hover {
      background: #fee2e2;
    }

    @media (max-width: 640px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
      .profile-header {
        flex-direction: column;
        text-align: center;
      }
      .profile-actions {
        flex-direction: column;
      }
    }
  `],
})
export class ProfileComponent {
  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly session = this.authStore.session;

  readonly displayName = computed(() => {
    const s = this.session();
    if (!s?.email) return 'Utilizador';
    const name = s.email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  });

  readonly initials = computed(() => {
    const name = this.displayName();
    return name ? name.substring(0, 2).toUpperCase() : 'U';
  });

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }
}
