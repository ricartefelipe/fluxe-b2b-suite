import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../auth.service';

interface DevProfile {
  label: string;
  sub: string;
  email: string;
  tid: string;
  roles: string[];
  perms: string[];
  plan: string;
  region: string;
  icon: string;
  color: string;
}

const DEV_PROFILES: DevProfile[] = [
  {
    label: 'Super Admin',
    sub: 'admin@saas.local',
    email: 'admin@saas.local',
    tid: '00000000-0000-0000-0000-000000000001',
    roles: ['admin'],
    perms: [
      'tenants:read', 'tenants:write', 'policies:read', 'policies:write',
      'flags:read', 'flags:write', 'audit:read', 'orders:read', 'orders:write',
      'inventory:read', 'inventory:write', 'payments:read', 'payments:write', 'ledger:read',
    ],
    plan: 'enterprise',
    region: 'us-east-1',
    icon: 'shield',
    color: '#1565c0',
  },
  {
    label: 'Ops User',
    sub: 'ops@saas.local',
    email: 'ops@saas.local',
    tid: '00000000-0000-0000-0000-000000000002',
    roles: ['ops'],
    perms: ['orders:read', 'orders:write', 'inventory:read', 'inventory:write'],
    plan: 'professional',
    region: 'us-east-1',
    icon: 'engineering',
    color: '#2e7d32',
  },
  {
    label: 'Viewer',
    sub: 'viewer@saas.local',
    email: 'viewer@saas.local',
    tid: '00000000-0000-0000-0000-000000000002',
    roles: ['viewer'],
    perms: ['orders:read', 'inventory:read', 'payments:read', 'ledger:read'],
    plan: 'starter',
    region: 'us-east-1',
    icon: 'visibility',
    color: '#e65100',
  },
];

@Component({
  selector: 'saas-dev-login',
  standalone: true,
  imports: [
    FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatIconModule,
  ],
  template: `
    <div class="login-page">
      <div class="login-left">
        <div class="brand">
          <div class="brand-logo">
            <mat-icon>dashboard</mat-icon>
          </div>
          <h1>Union Solutions</h1>
          <p>B2B Suite — Plataforma de gestão empresarial</p>
        </div>
      </div>
      <div class="login-right">
        <div class="login-form">
          <h2>Acesso Desenvolvimento</h2>
          <p class="subtitle">Selecione um perfil para continuar</p>

          <div class="profiles">
            @for (p of profiles; track p.label) {
              <button class="profile-card"
                [class.selected]="selectedProfile === p"
                (click)="selectedProfile = p">
                <div class="profile-icon" [style.background]="p.color">
                  <mat-icon>{{ p.icon }}</mat-icon>
                </div>
                <div class="profile-info">
                  <span class="profile-name">{{ p.label }}</span>
                  <span class="profile-email">{{ p.email }}</span>
                </div>
                @if (selectedProfile === p) {
                  <mat-icon class="check-icon">check_circle</mat-icon>
                }
              </button>
            }
          </div>

          @if (selectedProfile) {
            <div class="preview">
              <div class="preview-row">
                <span class="preview-label">Tenant ID</span>
                <code>{{ selectedProfile.tid.substring(0, 18) }}...</code>
              </div>
              <div class="preview-row">
                <span class="preview-label">Plano</span>
                <span class="plan-badge">{{ selectedProfile.plan }}</span>
              </div>
              <div class="preview-row">
                <span class="preview-label">Permissões</span>
                <span class="perm-count">{{ selectedProfile.perms.length }} permissões</span>
              </div>
            </div>
          }

          @if (error()) {
            <div class="error-msg">
              <mat-icon>error_outline</mat-icon>
              {{ error() }}
            </div>
          }

          <button class="login-btn"
            [disabled]="!selectedProfile || loading()"
            (click)="login()">
            @if (loading()) {
              <mat-spinner diameter="20" />
            } @else {
              Entrar
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .login-page {
      display: flex;
      height: 100%;
    }

    .login-left {
      flex: 0 0 420px;
      background: linear-gradient(135deg, #0d1b2a 0%, #1b3a5c 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }

    .brand {
      text-align: center;
      color: #fff;
    }
    .brand-logo {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }
    .brand-logo mat-icon { font-size: 32px; width: 32px; height: 32px; color: #fff; }
    .brand h1 { font-size: 24px; font-weight: 700; margin: 0 0 8px; }
    .brand p { font-size: 14px; color: rgba(255,255,255,0.6); margin: 0; }

    .login-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f4f6f9;
      padding: 40px;
    }

    .login-form {
      width: 100%;
      max-width: 420px;
    }
    .login-form h2 { font-size: 22px; font-weight: 700; color: #263238; margin: 0 0 4px; }
    .subtitle { color: #78909c; font-size: 14px; margin: 0 0 24px; }

    .profiles {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 20px;
    }

    .profile-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      background: #fff;
      cursor: pointer;
      transition: all 0.15s;
      text-align: left;
      font-family: inherit;
      font-size: inherit;
    }
    .profile-card:hover { border-color: #90caf9; }
    .profile-card.selected {
      border-color: #1565c0;
      background: #e3f2fd;
    }

    .profile-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .profile-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: #fff; }

    .profile-info { flex: 1; display: flex; flex-direction: column; }
    .profile-name { font-weight: 600; font-size: 14px; color: #263238; }
    .profile-email { font-size: 12px; color: #90a4ae; }

    .check-icon { color: #1565c0; }

    .preview {
      background: #fff;
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 20px;
      border: 1px solid #e0e0e0;
    }
    .preview-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
    }
    .preview-row:not(:last-child) { border-bottom: 1px solid #f5f5f5; }
    .preview-label { font-size: 12px; color: #78909c; font-weight: 500; }
    .preview code {
      font-size: 11px;
      background: #eef2f7;
      padding: 2px 8px;
      border-radius: 4px;
      color: #1565c0;
    }
    .plan-badge {
      font-size: 11px;
      background: #e8f5e9;
      color: #2e7d32;
      padding: 2px 10px;
      border-radius: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .perm-count { font-size: 12px; color: #546e7a; }

    .error-msg {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #c62828;
      font-size: 13px;
      background: #ffebee;
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .error-msg mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .login-btn {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 10px;
      background: #1565c0;
      color: #fff;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-family: inherit;
    }
    .login-btn:hover:not(:disabled) { background: #0d47a1; }
    .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    @media (max-width: 768px) {
      .login-page { flex-direction: column; }
      .login-left { flex: 0 0 auto; padding: 32px; }
      .login-right { padding: 24px; }
    }
  `],
})
export class DevLoginComponent {
  private authService = inject(AuthService);

  profiles = DEV_PROFILES;
  selectedProfile: DevProfile | null = null;
  loading = signal(false);
  error = signal<string | null>(null);

  async login(): Promise<void> {
    if (!this.selectedProfile) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.authService.loginWithDevToken(this.selectedProfile);
    } catch (e: unknown) {
      this.error.set(
        e instanceof Error ? e.message : 'Falha ao obter token. Verifique o backend.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
