import { Component, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../auth.service';
import { RuntimeConfigService } from '@saas-suite/shared/config';

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
    sub: 'admin@system.local',
    email: 'admin@system.local',
    tid: '*',
    roles: ['admin'],
    perms: [
      'tenants:read', 'tenants:write', 'policies:read', 'policies:write',
      'flags:read', 'flags:write', 'audit:read', 'analytics:read', 'admin:write',
      'orders:read', 'orders:write', 'inventory:read', 'inventory:write',
      'payments:read', 'payments:write', 'ledger:read',
      'products:read', 'products:write', 'profile:read',
    ],
    plan: 'enterprise',
    region: 'global',
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
      'products:read', 'products:write', 'payments:read', 'payments:write',
      'ledger:read', 'profile:read',
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
    NgTemplateOutlet, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatIconModule, MatTabsModule,
  ],
  template: `
    <div class="login-page">
      <div class="login-left">
        <div class="brand">
          <div class="brand-logo">
            <mat-icon>hub</mat-icon>
          </div>
          <h1 class="brand-title">Fluxe B2B Suite</h1>
          <p class="brand-tagline">Plataforma inteligente para operações B2B</p>
          <div class="brand-divider"></div>
          <div class="brand-features">
            <div class="feature-item">
              <div class="feature-icon-wrap">
                <mat-icon>verified_user</mat-icon>
              </div>
              <div class="feature-text">
                <span class="feature-title">Multi-tenant seguro</span>
                <span class="feature-desc">Isolamento completo de dados por tenant</span>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon-wrap">
                <mat-icon>insights</mat-icon>
              </div>
              <div class="feature-text">
                <span class="feature-title">Governança ABAC</span>
                <span class="feature-desc">Controle granular de permissões</span>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon-wrap">
                <mat-icon>speed</mat-icon>
              </div>
              <div class="feature-text">
                <span class="feature-title">Tempo real</span>
                <span class="feature-desc">Auditoria e eventos instantâneos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="login-right">
        <div class="login-card">
          <div class="login-card-header">
            <h2>Bem-vindo de volta</h2>
            <p class="subtitle">{{ isDevMode ? 'Entre com suas credenciais ou selecione um perfil rápido' : 'Acesse sua conta para continuar' }}</p>
          </div>

          @if (isDevMode) {
            <mat-tab-group class="login-tabs" [(selectedIndex)]="activeTab" animationDuration="200ms">

              <mat-tab label="Credenciais">
                <div class="tab-content">
                  <ng-container *ngTemplateOutlet="credentialsForm" />
                </div>
              </mat-tab>

              <mat-tab label="Perfis Rápidos">
                <div class="tab-content">
                  <div class="profiles">
                    @for (p of profiles; track p.sub) {
                      <button class="profile-card"
                        [class.selected]="selectedProfile() === p"
                        (click)="selectProfile(p)">
                        <div class="profile-icon" [style.background]="p.color">
                          <mat-icon>{{ p.icon }}</mat-icon>
                        </div>
                        <div class="profile-info">
                          <span class="profile-name">{{ p.label }}</span>
                          <span class="profile-email">{{ p.email }}</span>
                        </div>
                        @if (selectedProfile() === p) {
                          <mat-icon class="check-icon">check_circle</mat-icon>
                        }
                      </button>
                    }
                  </div>

                  @if (selectedProfile(); as sp) {
                    <div class="preview">
                      <div class="preview-row">
                        <span class="preview-label">Tenant ID</span>
                        <code>{{ sp.tid.length > 18 ? sp.tid.substring(0, 18) + '...' : sp.tid }}</code>
                      </div>
                      <div class="preview-row">
                        <span class="preview-label">Plano</span>
                        <span class="plan-badge">{{ sp.plan }}</span>
                      </div>
                      <div class="preview-row">
                        <span class="preview-label">Permissões</span>
                        <span class="perm-count">{{ sp.perms.length }} permissões</span>
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
                    [disabled]="!selectedProfile() || loading()"
                    (click)="loginWithProfile()">
                    @if (loading()) {
                      <mat-spinner diameter="20" />
                    } @else {
                      <mat-icon>login</mat-icon> Entrar
                    }
                  </button>
                </div>
              </mat-tab>

            </mat-tab-group>
          } @else {
            <div class="credentials-only">
              <ng-container *ngTemplateOutlet="credentialsForm" />
            </div>
          }

          <ng-template #credentialsForm>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" [(ngModel)]="email"
                placeholder="usuario&#64;empresa.com" autocomplete="username">
              <mat-icon matPrefix class="field-icon">email</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Senha</mat-label>
              <input matInput [type]="showPassword() ? 'text' : 'password'"
                [(ngModel)]="password" placeholder="••••••••" autocomplete="current-password"
                (keyup.enter)="loginWithCredentials()">
              <mat-icon matPrefix class="field-icon">lock</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="showPassword.set(!showPassword())"
                class="toggle-password">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            @if (isDevMode) {
              <div class="credentials-hint">
                <mat-icon>info_outline</mat-icon>
                <span>Usuários de teste: <code>admin&#64;system.local</code>,
                  <code>ops&#64;saas.local</code>, <code>viewer&#64;saas.local</code>
                  — Senha: <code>Test1234!</code></span>
              </div>
            }

            @if (error()) {
              <div class="error-msg">
                <mat-icon>error_outline</mat-icon>
                {{ error() }}
              </div>
            }

            <button class="login-btn"
              [disabled]="!email || !password || loading()"
              (click)="loginWithCredentials()">
              @if (loading()) {
                <mat-spinner diameter="20" />
              } @else {
                <mat-icon>login</mat-icon> Acessar
              }
            </button>
          </ng-template>

          <div class="login-footer">
            <span>Fluxe B2B Suite &copy; {{ currentYear }}</span>
          </div>
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .login-left {
      flex: 0 0 480px;
      background: linear-gradient(170deg, #050e1f 0%, #0b2040 40%, #133666 80%, #1a4a8a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 48px;
      position: relative;
      overflow: hidden;
    }
    .login-left::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle 400px at 10% 90%, rgba(25, 118, 210, 0.18) 0%, transparent 60%),
        radial-gradient(circle 300px at 90% 10%, rgba(66, 165, 245, 0.1) 0%, transparent 50%);
      pointer-events: none;
    }
    .login-left::after {
      content: '';
      position: absolute;
      top: -20%;
      right: -30%;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.03);
      pointer-events: none;
    }

    .brand {
      color: #fff;
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 340px;
    }
    .brand-logo {
      width: 72px;
      height: 72px;
      border-radius: 18px;
      background: linear-gradient(135deg, rgba(66, 165, 245, 0.25) 0%, rgba(21, 101, 192, 0.35) 100%);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 0 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .brand-logo mat-icon { font-size: 36px; width: 36px; height: 36px; color: #fff; }

    .brand-title {
      font-size: 30px;
      font-weight: 800;
      margin: 0 0 10px;
      letter-spacing: -0.03em;
      color: #ffffff;
    }
    .brand-tagline {
      font-size: 15px;
      color: rgba(255,255,255,0.6);
      margin: 0;
      font-weight: 400;
      line-height: 1.5;
    }

    .brand-divider {
      width: 40px;
      height: 3px;
      background: linear-gradient(90deg, #42a5f5, rgba(66,165,245,0.2));
      border-radius: 2px;
      margin: 32px 0;
    }

    .brand-features {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }
    .feature-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .feature-icon-wrap mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #64b5f6;
    }
    .feature-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .feature-title {
      font-size: 13px;
      font-weight: 600;
      color: rgba(255,255,255,0.9);
    }
    .feature-desc {
      font-size: 12px;
      color: rgba(255,255,255,0.4);
      line-height: 1.4;
    }

    .login-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f7fa;
      padding: 48px;
      position: relative;
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      background: #fff;
      border-radius: 20px;
      padding: 44px 40px 32px;
      box-shadow:
        0 1px 3px rgba(0,0,0,0.04),
        0 8px 32px rgba(0,0,0,0.06);
      animation: fadeSlideIn 0.45s ease-out;
    }
    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .login-card-header { margin-bottom: 32px; }
    .login-card-header h2 {
      font-size: 28px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 8px;
      letter-spacing: -0.03em;
    }
    .subtitle { color: #64748b; font-size: 14px; margin: 0; line-height: 1.6; }

    .login-tabs { margin-bottom: 0; }
    .tab-content { padding-top: 20px; }
    .full-width { width: 100%; }

    .field-icon {
      color: #1e293b !important;
      opacity: 0.8;
    }
    .toggle-password mat-icon { color: #475569; }

    .credentials-hint {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 20px;
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
    }
    .credentials-hint mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; color: #0284c7; margin-top: 1px; }
    .credentials-hint code {
      background: #e0f2fe;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 11px;
      color: #0369a1;
      white-space: nowrap;
    }

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
      background: #f8fafc;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
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
      background: #e2e8f0;
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
      padding: 15px 20px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(180deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%);
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
      box-shadow: 0 4px 16px rgba(21, 101, 192, 0.3);
      letter-spacing: 0.02em;
    }
    .login-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .login-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(21, 101, 192, 0.4);
    }
    .login-btn:active:not(:disabled) { transform: translateY(0); }
    .login-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .credentials-only { padding-top: 4px; }

    .login-footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #f1f5f9;
      font-size: 12px;
      color: #94a3b8;
      letter-spacing: 0.01em;
    }

    @media (max-width: 900px) {
      .login-left { flex: 0 0 380px; padding: 40px 32px; }
      .brand-title { font-size: 24px; }
      .feature-desc { display: none; }
    }
    @media (max-width: 768px) {
      .login-page { flex-direction: column; }
      .login-left { flex: 0 0 auto; padding: 32px 24px; }
      .login-left .brand-features, .login-left .brand-divider { display: none; }
      .brand { text-align: center; }
      .brand-logo { margin: 0 auto 20px; }
      .brand-tagline { margin-bottom: 0; }
      .login-right { padding: 24px 16px; }
      .login-card { padding: 28px 24px 20px; border-radius: 16px; }
      .login-card-header h2 { font-size: 22px; }
    }
  `],
})
export class DevLoginComponent {
  private authService = inject(AuthService);
  private config = inject(RuntimeConfigService);

  isDevMode = this.config.get('authMode') === 'dev';
  currentYear = new Date().getFullYear();
  profiles = DEV_PROFILES;
  selectedProfile = signal<DevProfile | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);
  activeTab = 0;
  email = '';
  password = '';

  selectProfile(profile: DevProfile): void {
    this.selectedProfile.set(profile);
  }

  async loginWithProfile(): Promise<void> {
    const profile = this.selectedProfile();
    if (!profile) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.authService.loginWithDevToken(profile);
    } catch (e: unknown) {
      this.error.set(
        e instanceof Error ? e.message : 'Falha ao obter token. Verifique o backend.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async loginWithCredentials(): Promise<void> {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.authService.loginWithCredentials(this.email, this.password);
    } catch (e: unknown) {
      this.error.set(
        e instanceof Error ? e.message : 'Email ou senha inválidos.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
