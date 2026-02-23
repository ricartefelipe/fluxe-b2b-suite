import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
  },
  {
    label: 'Ops User (Orders + Inventory)',
    sub: 'ops@saas.local',
    email: 'ops@saas.local',
    tid: '00000000-0000-0000-0000-000000000002',
    roles: ['ops'],
    perms: ['orders:read', 'orders:write', 'inventory:read', 'inventory:write'],
    plan: 'professional',
    region: 'us-east-1',
  },
  {
    label: 'Viewer (Read-only)',
    sub: 'viewer@saas.local',
    email: 'viewer@saas.local',
    tid: '00000000-0000-0000-0000-000000000002',
    roles: ['viewer'],
    perms: ['orders:read', 'inventory:read', 'payments:read', 'ledger:read'],
    plan: 'starter',
    region: 'us-east-1',
  },
];

@Component({
  selector: 'saas-dev-login',
  standalone: true,
  imports: [
    FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-wrapper">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Login — Modo Dev</mat-card-title>
          <mat-card-subtitle>Selecione um perfil para entrar</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Perfil</mat-label>
            <mat-select [(ngModel)]="selectedProfile">
              @for (p of profiles; track p.label) {
                <mat-option [value]="p">{{ p.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          @if (selectedProfile) {
            <div class="profile-preview">
              <code>tid: {{ selectedProfile.tid }}</code><br>
              <code>perms: {{ selectedProfile.perms.join(', ') }}</code>
            </div>
          }

          @if (error()) {
            <div class="error-msg">{{ error() }}</div>
          }
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary"
            [disabled]="!selectedProfile || loading()"
            (click)="login()">
            @if (loading()) {
              <mat-spinner diameter="20" />
            } @else {
              Entrar
            }
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-wrapper {
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; background: #f5f5f5;
    }
    .login-card { width: 440px; padding: 16px; }
    .full-width { width: 100%; margin-top: 16px; }
    .profile-preview {
      background: #f5f5f5; padding: 8px; border-radius: 4px;
      font-size: 12px; margin-bottom: 8px; word-break: break-all;
    }
    .error-msg { color: red; font-size: 13px; margin-bottom: 8px; }
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
