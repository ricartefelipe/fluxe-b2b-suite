import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from './auth.service';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'lib-change-password-page',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-premium auth-premium--isolated" [class.page--embedded]="!fullPage()">
      <div class="auth-isolated-panel">
        <div class="flow-header">
          <div class="flow-icon" aria-hidden="true">
            <mat-icon>vpn_key</mat-icon>
          </div>
          <h1>{{ i18n.messages().auth.changePasswordTitle }}</h1>
          <p class="lead">{{ subtitle() }}</p>
        </div>

        @if (error()) {
          <div class="alert error" role="alert">
            <mat-icon>error_outline</mat-icon>
            {{ error() }}
          </div>
        }

        <form (ngSubmit)="submit()">
          <mat-form-field appearance="outline" class="full">
            <mat-label>{{ i18n.messages().auth.currentPassword }}</mat-label>
            <input
              matInput
              type="password"
              [(ngModel)]="currentPassword"
              name="currentPassword"
              required
              minlength="8"
              autocomplete="current-password"
            />
            <mat-icon matPrefix class="prefix-icon">lock</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>{{ i18n.messages().auth.newPassword }}</mat-label>
            <input
              matInput
              type="password"
              [(ngModel)]="newPassword"
              name="newPassword"
              required
              minlength="8"
              autocomplete="new-password"
            />
            <mat-icon matPrefix class="prefix-icon">lock_reset</mat-icon>
            <mat-hint>{{ i18n.messages().auth.passwordMinHint }}</mat-hint>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>{{ i18n.messages().auth.confirmNewPassword }}</mat-label>
            <input
              matInput
              type="password"
              [(ngModel)]="confirmNewPassword"
              name="confirmNewPassword"
              required
              minlength="8"
              autocomplete="new-password"
            />
            <mat-icon matPrefix class="prefix-icon">lock_outline</mat-icon>
          </mat-form-field>
          <button
            mat-flat-button
            color="primary"
            class="submit-btn"
            type="submit"
            [disabled]="
              loading() ||
              !currentPassword ||
              !newPassword ||
              newPassword.length < 8 ||
              newPassword !== confirmNewPassword
            "
          >
            @if (loading()) {
              <mat-spinner diameter="22" />
            } @else {
              {{ i18n.messages().auth.changePasswordButton }}
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./styles/auth-premium.scss'],
})
export class ChangePasswordPageComponent {
  private readonly authService = inject(AuthService);
  readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);

  fullPage = signal(true);
  subtitle = computed(() => {
    const useOptional = this.route.snapshot.data['useOptionalSubtitle'] === true;
    const m = this.i18n.messages()?.auth;
    if (!m) return 'Alterar senha';
    return useOptional && m.changePasswordSubtitleOptional
      ? m.changePasswordSubtitleOptional
      : m.changePasswordSubtitle;
  });

  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    const fullPage = this.route.snapshot.data['fullPage'];
    if (fullPage === false) this.fullPage.set(false);
  }

  async submit(): Promise<void> {
    if (!this.currentPassword || !this.newPassword || this.newPassword.length < 8) return;
    if (this.newPassword !== this.confirmNewPassword) {
      this.error.set(this.i18n.messages().auth.confirmPasswordMismatch);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.authService.changePassword(this.currentPassword, this.newPassword);
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Senha atual incorreta. Tente novamente.');
    } finally {
      this.loading.set(false);
    }
  }
}
