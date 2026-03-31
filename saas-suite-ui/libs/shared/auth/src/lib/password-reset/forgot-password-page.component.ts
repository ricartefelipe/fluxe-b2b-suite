import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../auth.service';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'lib-forgot-password-page',
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

        @if (!sent()) {
          <div class="flow-header">
            <div class="flow-icon" aria-hidden="true">
              <mat-icon>lock_reset</mat-icon>
            </div>
            <h1>{{ i18n.messages().auth.forgotPasswordTitle }}</h1>
            <p class="lead">{{ i18n.messages().auth.forgotPasswordSubtitle }}</p>
          </div>

          <mat-form-field appearance="outline" class="full">
            <mat-label>{{ i18n.messages().common.email }}</mat-label>
            <input
              matInput
              type="email"
              [(ngModel)]="email"
              (keyup.enter)="submit()"
              autocomplete="email"
              placeholder="voce&#64;empresa.com"
            />
            <mat-icon matPrefix class="prefix-icon">mail</mat-icon>
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
            [disabled]="!email.trim() || loading()"
            (click)="submit()"
          >
            @if (loading()) {
              <mat-spinner diameter="22" />
            } @else {
              {{ i18n.messages().auth.forgotPasswordSubmit }}
            }
          </button>
        } @else {
          <div class="success-block">
            <div class="flow-icon flow-icon--success" aria-hidden="true">
              <mat-icon>mark_email_read</mat-icon>
            </div>
            <h1>{{ i18n.messages().auth.forgotPasswordTitle }}</h1>
            <p class="lead">{{ i18n.messages().auth.forgotPasswordSent }}</p>
            <a mat-flat-button color="primary" routerLink="/login" class="login-cta">
              {{ i18n.messages().auth.signIn }}
            </a>
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['../styles/auth-premium.scss'],
})
export class ForgotPasswordPageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly config = inject(RuntimeConfigService);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);

  email = '';
  loading = signal(false);
  error = signal<string | null>(null);
  sent = signal(false);

  ngOnInit(): void {
    if (this.config.get('authMode') === 'oidc') {
      void this.router.navigate(['/login']);
    }
  }

  async submit(): Promise<void> {
    const trimmed = this.email.trim();
    if (!trimmed) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.requestPasswordReset(trimmed);
      this.sent.set(true);
    } catch (e: unknown) {
      this.error.set(
        e instanceof Error
          ? e.message
          : this.i18n.messages().auth.requestResetError,
      );
    } finally {
      this.loading.set(false);
    }
  }
}
