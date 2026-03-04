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
    tid: 'tenant_demo',
    roles: ['admin'],
    perms: [
      'tenants:read', 'tenants:write', 'policies:read', 'policies:write',
      'flags:read', 'flags:write', 'audit:read', 'orders:read', 'orders:write',
      'inventory:read', 'inventory:write', 'payments:read', 'payments:write',
      'ledger:read', 'products:read', 'products:write', 'profile:read',
    ],
    plan: 'enterprise',
    region: 'region-a',
    icon: 'shield',
    color: '#1565c0',
  },
  {
    label: 'Ops User',
    sub: 'ops@saas.local',
    email: 'ops@saas.local',
    tid: 'tenant_demo',
    roles: ['ops'],
    perms: [
      'orders:read', 'orders:write', 'inventory:read', 'inventory:write',
      'products:read', 'products:write', 'profile:read',
    ],
    plan: 'pro',
    region: 'region-a',
    icon: 'engineering',
    color: '#2e7d32',
  },
  {
    label: 'Viewer',
    sub: 'viewer@saas.local',
    email: 'viewer@saas.local',
    tid: 'tenant_demo',
    roles: ['viewer'],
    perms: [
      'orders:read', 'inventory:read', 'payments:read', 'ledger:read',
      'products:read', 'profile:read',
    ],
    plan: 'pro',
    region: 'region-a',
    icon: 'visibility',
    color: '#e65100',
  },
];

@Component({
  selector: 'lib-dev-login',
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
          <h1>Fluxe B2B Suite</h1>
          <p>Plataforma B2B multi-tenant — Demo</p>
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
      min-height: 100vh;
    }

    .login-left {
      flex: 0 0 440px;
      background: linear-gradient(160deg, #0a1628 0%, #132f4c 40%, #1a3a5c 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
      position: relative;
      overflow: hidden;
    }
    .login-left::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 80% 50% at 50% 120%, rgba(21, 101, 192, 0.15) 0%, transparent 60%);
      pointer-events: none;
    }

    .brand {
      text-align: center;
      color: #fff;
      position: relative;
      z-index: 1;
    }
    .brand-logo {
      width: 72px;
      height: 72px;
      border-radius: 18px;
      background: rgba(255,255,255,0.12);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.2);
    }
    .brand-logo mat-icon { font-size: 36px; width: 36px; height: 36px; color: #fff; }
    .brand h1 { font-size: 26px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.02em; }
    .brand p { font-size: 14px; color: rgba(255,255,255,0.7); margin: 0; font-weight: 400; }

    .login-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(180deg, #f0f4f8 0%, #e8eef4 100%);
      padding: 48px;
    }

    .login-form {
      width: 100%;
      max-width: 400px;
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .login-form h2 { font-size: 24px; font-weight: 700; color: #1a2332; margin: 0 0 6px; letter-spacing: -0.02em; }
    .subtitle { color: #64748b; font-size: 14px; margin: 0 0 28px; }

    .profiles {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 24px;
    }

    .profile-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      background: #fff;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
      text-align: left;
      font-family: inherit;
      font-size: inherit;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .profile-card:hover { border-color: #94a3b8; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .profile-card.selected {
      border-color: #1565c0;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      box-shadow: 0 0 0 1px rgba(21, 101, 192, 0.2), 0 4px 12px rgba(21, 101, 192, 0.12);
    }

    .profile-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .profile-icon mat-icon { font-size: 22px; width: 22px; height: 22px; color: #fff; }

    .profile-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .profile-name { font-weight: 600; font-size: 15px; color: #1e293b; }
    .profile-email { font-size: 12px; color: #64748b; margin-top: 2px; }

    .check-icon { color: #1565c0; flex-shrink: 0; }

    .preview {
      background: #fff;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .preview-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }
    .preview-row:not(:last-child) { border-bottom: 1px solid #f1f5f9; }
    .preview-label { font-size: 12px; color: #64748b; font-weight: 500; }
    .preview code {
      font-size: 11px;
      background: #f1f5f9;
      padding: 4px 10px;
      border-radius: 6px;
      color: #1565c0;
      font-weight: 500;
    }
    .plan-badge {
      font-size: 11px;
      background: #dcfce7;
      color: #166534;
      padding: 4px 10px;
      border-radius: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .perm-count { font-size: 12px; color: #64748b; }

    .error-msg {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #b91c1c;
      font-size: 13px;
      background: #fef2f2;
      padding: 12px 16px;
      border-radius: 10px;
      margin-bottom: 20px;
      border: 1px solid #fecaca;
    }
    .error-msg mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }

    .login-btn {
      width: 100%;
      padding: 14px 20px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(180deg, #1565c0 0%, #0d47a1 100%);
      color: #fff;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-family: inherit;
      box-shadow: 0 2px 8px rgba(21, 101, 192, 0.35);
    }
    .login-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(21, 101, 192, 0.4);
    }
    .login-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

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
