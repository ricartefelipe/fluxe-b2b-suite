import { Component, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'lib-dev-login',
  standalone: true,
  imports: [
    NgTemplateOutlet, FormsModule, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatProgressSpinnerModule, MatIconModule,
  ],
  template: `
    <div class="auth-premium auth-premium--split">
      <div class="login-left">
        <div class="login-left-deco" aria-hidden="true"></div>
        <div class="brand">
          <p class="auth-eyebrow">Enterprise B2B</p>
          <div class="brand-logo">
            <mat-icon>hub</mat-icon>
          </div>
          <h1 class="brand-title">Fluxe B2B Suite</h1>
          <p class="brand-tagline">Operações, pedidos e pagamentos numa única experiência segura.</p>
          <p class="brand-trust" aria-hidden="true">
            <span class="brand-trust-pill">ABAC</span>
            <span class="brand-trust-pill">OIDC</span>
            <span class="brand-trust-pill">Audit trail</span>
          </p>
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
            <p class="card-eyebrow">Acesso à conta</p>
            <h2>Bem-vindo de volta</h2>
            <p class="subtitle">{{
              isDevMode
                ? 'Entre com o e-mail e a senha do administrador'
                : i18n.messages().auth.loginSubtitleProd
            }}</p>
          </div>

          <div class="credentials-only">
            <ng-container *ngTemplateOutlet="credentialsForm" />
          </div>

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

            @if (showForgotPassword) {
              <div class="forgot-row">
                <a routerLink="/forgot-password">{{ i18n.messages().auth.forgotPassword }}</a>
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

          @if (showSignupLink) {
            <p class="signup-link">
              {{ i18n.messages().auth.noAccount }}
              <a routerLink="/signup">{{ i18n.messages().auth.signupLink }}</a>
            </p>
          }

          <div class="login-footer">
            <span>Fluxe B2B Suite &copy; {{ currentYear }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../styles/auth-premium.scss'],
})
export class DevLoginComponent {
  private authService = inject(AuthService);
  private config = inject(RuntimeConfigService);
  private route = inject(ActivatedRoute, { optional: true });
  protected i18n = inject(I18nService);

  showSignupLink = this.route?.snapshot?.data?.['showSignupLink'] !== false;
  isDevMode = this.config.get('authMode') === 'dev';
  /** Recuperação de senha via Core (HS256/dev); em OIDC o IdP cuida do fluxo. */
  showForgotPassword = this.config.get('authMode') !== 'oidc';
  currentYear = new Date().getFullYear();
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);
  email = '';
  password = '';

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
