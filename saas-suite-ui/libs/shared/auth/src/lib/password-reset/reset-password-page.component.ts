import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../auth.service';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'lib-reset-password-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-shell">
      <div class="auth-panel">
        <a routerLink="/login" class="back-link">
          <mat-icon>arrow_back</mat-icon>
          {{ i18n.messages().auth.backToLogin }}
        </a>

        @if (invalidLink()) {
          <div class="header">
            <div class="icon-wrap warn" aria-hidden="true">
              <mat-icon>link_off</mat-icon>
            </div>
            <h1>{{ i18n.messages().auth.resetPasswordTitle }}</h1>
            <p class="lead">{{ i18n.messages().auth.resetPasswordInvalidLink }}</p>
          </div>
          <a mat-flat-button color="primary" class="submit-btn" routerLink="/forgot-password">
            {{ i18n.messages().auth.forgotPassword }}
          </a>
        } @else if (done()) {
          <div class="success-block">
            <div class="icon-wrap success" aria-hidden="true">
              <mat-icon>check_circle</mat-icon>
            </div>
            <h1>{{ i18n.messages().auth.resetPasswordTitle }}</h1>
            <p class="lead success-text">{{ i18n.messages().auth.resetPasswordSuccess }}</p>
            <a mat-flat-button color="primary" class="submit-btn" routerLink="/login">
              {{ i18n.messages().auth.signIn }}
            </a>
          </div>
        } @else {
          <div class="header">
            <div class="icon-wrap" aria-hidden="true">
              <mat-icon>vpn_key</mat-icon>
            </div>
            <h1>{{ i18n.messages().auth.resetPasswordTitle }}</h1>
            <p class="lead">{{ i18n.messages().auth.resetPasswordSubtitle }}</p>
          </div>

          <mat-form-field appearance="outline" class="full">
            <mat-label>{{ i18n.messages().auth.newPassword }}</mat-label>
            <input
              matInput
              [type]="showPass() ? 'text' : 'password'"
              [(ngModel)]="newPassword"
              (keyup.enter)="submit()"
              autocomplete="new-password"
            />
            <mat-icon matPrefix class="prefix-icon">lock</mat-icon>
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="showPass.set(!showPass())"
              [attr.aria-label]="i18n.messages().auth.password"
            >
              <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-hint>{{ i18n.messages().auth.passwordMinHint }}</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full">
            <mat-label>{{ i18n.messages().auth.confirmNewPassword }}</mat-label>
            <input
              matInput
              [type]="showPass2() ? 'text' : 'password'"
              [(ngModel)]="confirmPassword"
              (keyup.enter)="submit()"
              autocomplete="new-password"
            />
            <mat-icon matPrefix class="prefix-icon">lock_outline</mat-icon>
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="showPass2.set(!showPass2())"
              [attr.aria-label]="i18n.messages().auth.password"
            >
              <mat-icon>{{ showPass2() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>

          @if (error()) {
            <div class="alert error" role="alert">
              <mat-icon>error_outline</mat-icon>
              {{ error() }}
            </div>
          }

          <button
            mat-flat-button
            color="primary"
            class="submit-btn"
            [disabled]="invalidLink() || loading() || newPassword.length < 8"
            (click)="submit()"
          >
            @if (loading()) {
              <mat-spinner diameter="22" />
            } @else {
              {{ i18n.messages().auth.resetPasswordSubmit }}
            }
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: linear-gradient(165deg, #f0f4f8 0%, #e8eef5 45%, #dfe7f0 100%);
      }
      .auth-shell {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px 16px 48px;
        box-sizing: border-box;
      }
      .auth-panel {
        width: 100%;
        max-width: 420px;
        background: #fff;
        border-radius: 20px;
        padding: 32px 28px 36px;
        box-shadow:
          0 1px 2px rgba(15, 23, 42, 0.04),
          0 12px 40px rgba(15, 23, 42, 0.08);
        border: 1px solid rgba(15, 23, 42, 0.06);
      }
      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 500;
        color: #475569;
        text-decoration: none;
        margin-bottom: 28px;
      }
      .back-link:hover {
        color: #1565c0;
      }
      .back-link mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .header {
        margin-bottom: 20px;
      }
      .icon-wrap {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
      }
      .icon-wrap mat-icon {
        color: #1565c0;
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      .icon-wrap.success mat-icon {
        color: #2e7d32;
      }
      .icon-wrap.success {
        background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      }
      .icon-wrap.warn mat-icon {
        color: #c2410c;
      }
      .icon-wrap.warn {
        background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
      }
      h1 {
        font-size: 1.5rem;
        font-weight: 800;
        margin: 0 0 10px;
        color: #0f172a;
        letter-spacing: -0.02em;
      }
      .lead {
        margin: 0;
        font-size: 15px;
        line-height: 1.55;
        color: #64748b;
      }
      .full {
        width: 100%;
        margin-bottom: 4px;
      }
      .prefix-icon {
        color: #64748b;
        margin-right: 4px;
      }
      .alert {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 14px;
        border-radius: 12px;
        font-size: 14px;
        margin: 12px 0 16px;
      }
      .alert.error {
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #b91c1c;
      }
      .alert mat-icon {
        flex-shrink: 0;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .submit-btn {
        width: 100%;
        height: 48px;
        font-size: 15px;
        font-weight: 600;
        border-radius: 12px;
        margin-top: 12px;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
      }
      .success-block {
        text-align: center;
        padding: 8px 0 0;
      }
      .success-block .icon-wrap {
        margin-left: auto;
        margin-right: auto;
      }
      .success-text {
        margin-bottom: 8px;
      }
    `,
  ],
})
export class ResetPasswordPageComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  protected readonly i18n = inject(I18nService);

  tokenId = '';
  token = '';
  newPassword = '';
  confirmPassword = '';
  loading = signal(false);
  error = signal<string | null>(null);
  invalidLink = signal(false);
  done = signal(false);
  showPass = signal(false);
  showPass2 = signal(false);

  constructor() {
    const q = this.route.snapshot.queryParamMap;
    this.tokenId = (q.get('tokenId') ?? '').trim();
    this.token = (q.get('token') ?? '').trim();
    this.invalidLink.set(!this.tokenId || !this.token);
  }

  async submit(): Promise<void> {
    if (this.invalidLink() || this.newPassword.length < 8) return;
    if (this.newPassword !== this.confirmPassword) {
      this.error.set(this.i18n.messages().auth.confirmPasswordMismatch);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.confirmPasswordReset(this.tokenId, this.token, this.newPassword);
      this.done.set(true);
    } catch (e: unknown) {
      this.error.set(
        e instanceof Error
          ? e.message
          : this.i18n.messages().auth.resetPasswordInvalidLink,
      );
    } finally {
      this.loading.set(false);
    }
  }
}
