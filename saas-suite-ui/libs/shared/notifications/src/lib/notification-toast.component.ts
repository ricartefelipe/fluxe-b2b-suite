import { Component, Injectable, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AppNotification, NotificationType } from './notification.model';
import { NotificationStore } from './notification.store';

const TYPE_ICON: Record<NotificationType, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

const TYPE_CLASS: Record<NotificationType, string> = {
  info: 'toast-info',
  success: 'toast-success',
  warning: 'toast-warning',
  error: 'toast-error',
};

const TOAST_DURATION_MS = 5_000;

@Component({
  selector: 'saas-notification-toast-content',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="toast-body" [class]="typeClass">
      <mat-icon class="toast-icon">{{ typeIcon }}</mat-icon>
      <div class="toast-text">
        <span class="toast-title">{{ data.title }}</span>
        <span class="toast-message">{{ data.message }}</span>
      </div>
      @if (data.actionUrl) {
        <button mat-button class="toast-action" (click)="navigate()">View</button>
      }
      <button mat-icon-button class="toast-close" (click)="snackRef.dismiss()">
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .toast-body {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 0;
      min-width: 280px;
    }

    .toast-icon { flex-shrink: 0; }

    .toast-info .toast-icon { color: #1976d2; }
    .toast-success .toast-icon { color: #2e7d32; }
    .toast-warning .toast-icon { color: #f57c00; }
    .toast-error .toast-icon { color: #c62828; }

    .toast-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .toast-title {
      font-weight: 500;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .toast-message {
      font-size: 12px;
      opacity: 0.85;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .toast-action { font-size: 12px; flex-shrink: 0; }

    .toast-close {
      width: 28px !important;
      height: 28px !important;
      line-height: 28px !important;
      flex-shrink: 0;
    }
    .toast-close mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `],
})
export class NotificationToastContentComponent {
  protected readonly data: AppNotification = inject(MAT_SNACK_BAR_DATA);
  protected readonly snackRef = inject(MatSnackBarRef);
  private readonly router = inject(Router);
  private readonly store = inject(NotificationStore);

  protected readonly typeIcon = TYPE_ICON[this.data.type];
  protected readonly typeClass = TYPE_CLASS[this.data.type];

  protected navigate(): void {
    this.store.markAsRead(this.data.id);
    this.snackRef.dismiss();
    if (this.data.actionUrl) {
      this.router.navigateByUrl(this.data.actionUrl);
    }
  }
}

@Injectable({ providedIn: 'root' })
export class NotificationToastService {
  private readonly snackBar = inject(MatSnackBar);

  show(notification: AppNotification): void {
    this.snackBar.openFromComponent(NotificationToastContentComponent, {
      data: notification,
      duration: TOAST_DURATION_MS,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['notification-toast-panel'],
    });
  }
}
