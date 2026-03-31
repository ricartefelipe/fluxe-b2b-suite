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
    <div class="auth-premium auth-premium--isolated">
      <div class="auth-isolated-panel">
        <a routerLink="/login" class="back-link">
          <mat-icon>arrow_back</mat-icon>
          {{ i18n.messages().auth.backToLogin }}
        </a>

        @if (invalidLink()) {
          <div class="flow-header">
            <div class="flow-icon flow-icon--warn" aria-hidden="true">
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
            <div class="flow-icon flow-icon--success" aria-hidden="true">
              <mat-icon>check_circle</mat-icon>
            </div>
            <h1>{{ i18n.messages().auth.resetPasswordTitle }}</h1>
            <p class="lead">{{ i18n.messages().auth.resetPasswordSuccess }}</p>
            <a mat-flat-button color="primary" class="login-cta" routerLink="/login">
              {{ i18n.messages().auth.signIn }}
            </a>
          </div>
        } @else {
          <div class="flow-header">
            <div class="flow-icon" aria-hidden="true">
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
  styleUrls: ['../styles/auth-premium.scss'],
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
