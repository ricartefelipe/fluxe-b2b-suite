import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from './auth.service';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'lib-change-password-page',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page">
      <mat-card class="card">
        <mat-card-header>
          <mat-card-title>{{ i18n.messages().auth.changePasswordTitle }}</mat-card-title>
          <mat-card-subtitle>{{ i18n.messages().auth.changePasswordSubtitle }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (error()) {
            <div class="error-msg">
              {{ error() }}
            </div>
          }
          <form (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ i18n.messages().auth.currentPassword }}</mat-label>
              <input matInput type="password" [(ngModel)]="currentPassword" name="currentPassword" required minlength="8" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ i18n.messages().auth.newPassword }}</mat-label>
              <input matInput type="password" [(ngModel)]="newPassword" name="newPassword" required minlength="8" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ i18n.messages().auth.confirmNewPassword }}</mat-label>
              <input matInput type="password" [(ngModel)]="confirmNewPassword" name="confirmNewPassword" required minlength="8" />
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit" [disabled]="loading() || !currentPassword || !newPassword || newPassword.length < 8 || newPassword !== confirmNewPassword">
              @if (loading()) {
                <mat-spinner diameter="20" />
              } @else {
                {{ i18n.messages().auth.changePasswordButton }}
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: #f4f6f9;
      }
      .card {
        max-width: 400px;
        width: 100%;
      }
      .full-width { width: 100%; }
      .error-msg {
        color: #c62828;
        margin-bottom: 16px;
        font-size: 14px;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
    `,
  ],
})
export class ChangePasswordPageComponent {
  private readonly authService = inject(AuthService);
  readonly i18n = inject(I18nService);

  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  loading = signal(false);
  error = signal<string | null>(null);

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
