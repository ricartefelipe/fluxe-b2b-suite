import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppNotification, NotificationType } from './notification.model';
import { NotificationStore } from './notification.store';

const TYPE_CONFIG: Record<NotificationType, { icon: string; color: string }> = {
  info: { icon: 'info', color: '#1976d2' },
  success: { icon: 'check_circle', color: '#2e7d32' },
  warning: { icon: 'warning', color: '#f57c00' },
  error: { icon: 'error', color: '#c62828' },
};

@Component({
  selector: 'saas-notification-bell',
  standalone: true,
  imports: [
    DatePipe, MatButtonModule, MatIconModule, MatBadgeModule,
    MatMenuModule, MatDividerModule, MatTooltipModule,
  ],
  template: `
    <button
      mat-icon-button
      [matMenuTriggerFor]="notifMenu"
      [matBadge]="badgeText()"
      [matBadgeHidden]="store.unreadCount() === 0"
      matBadgeColor="warn"
      matBadgeSize="small"
      matTooltip="Notifications"
      [class.bell-ring]="animateBell()"
    >
      <mat-icon>notifications</mat-icon>
    </button>

    <mat-menu #notifMenu="matMenu" class="notification-panel">
      <div class="notification-header" (click)="$event.stopPropagation()">
        <span class="notification-title">Notifications</span>
        <span class="notification-badge" [class.connected]="store.connected()">
          {{ store.connected() ? 'Live' : 'Offline' }}
        </span>
      </div>

      <mat-divider />

      @if (store.notifications().length === 0) {
        <div class="notification-empty" (click)="$event.stopPropagation()">
          <mat-icon>notifications_none</mat-icon>
          <span>No notifications</span>
        </div>
      } @else {
        <div class="notification-actions" (click)="$event.stopPropagation()">
          <button mat-button (click)="store.markAllAsRead()" [disabled]="store.unreadCount() === 0">
            Mark all as read
          </button>
          <button mat-button color="warn" (click)="store.clearAll()">
            Clear all
          </button>
        </div>

        <mat-divider />

        <div class="notification-list">
          @for (n of store.notifications(); track n.id) {
            <div
              class="notification-item"
              [class.unread]="!n.read"
              (click)="onNotificationClick(n)"
            >
              <mat-icon
                class="notification-type-icon"
                [style.color]="getTypeColor(n.type)"
              >{{ getTypeIcon(n.type) }}</mat-icon>

              <div class="notification-content">
                <div class="notification-item-header">
                  <span class="notification-item-title">{{ n.title }}</span>
                  <button
                    mat-icon-button
                    class="dismiss-btn"
                    (click)="onDismiss($event, n.id)"
                    matTooltip="Dismiss"
                  >
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <span class="notification-item-message">{{ n.message }}</span>
                <span class="notification-item-time">{{ n.timestamp | date:'short' }}</span>
              </div>
            </div>
          }
        </div>
      }
    </mat-menu>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; }

    .bell-ring {
      animation: bellRing 0.6s ease-in-out;
    }

    @keyframes bellRing {
      0%   { transform: rotate(0); }
      15%  { transform: rotate(14deg); }
      30%  { transform: rotate(-12deg); }
      45%  { transform: rotate(10deg); }
      60%  { transform: rotate(-8deg); }
      75%  { transform: rotate(4deg); }
      100% { transform: rotate(0); }
    }

    .notification-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px 8px;
    }

    .notification-title {
      font-weight: 600;
      font-size: 15px;
    }

    .notification-badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 12px;
      background: #ef5350;
      color: #fff;
      font-weight: 500;
    }
    .notification-badge.connected {
      background: #4caf50;
    }

    .notification-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 32px 16px;
      color: #9e9e9e;
    }
    .notification-empty mat-icon { font-size: 40px; width: 40px; height: 40px; }

    .notification-actions {
      display: flex;
      justify-content: space-between;
      padding: 4px 8px;
    }
    .notification-actions button { font-size: 12px; }

    .notification-list {
      max-height: 380px;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .notification-item {
      display: flex;
      gap: 12px;
      padding: 10px 16px;
      cursor: pointer;
      transition: background 0.15s;
      border-left: 3px solid transparent;
    }
    .notification-item:hover { background: rgba(0, 0, 0, 0.04); }
    .notification-item.unread {
      background: rgba(25, 118, 210, 0.04);
      border-left-color: #1976d2;
    }

    .notification-type-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .notification-item-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 4px;
    }

    .notification-item-title {
      font-weight: 500;
      font-size: 13px;
      color: var(--app-text, #263238);
      line-height: 1.3;
    }

    .dismiss-btn {
      width: 24px !important;
      height: 24px !important;
      line-height: 24px !important;
      flex-shrink: 0;
    }
    .dismiss-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .notification-item-message {
      font-size: 12px;
      color: #78909c;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notification-item-time {
      font-size: 11px;
      color: #b0bec5;
      margin-top: 2px;
    }
  `],
})
export class NotificationBellComponent {
  protected readonly store = inject(NotificationStore);
  private readonly router = inject(Router);

  private readonly prevCount = signal(0);
  protected readonly animateBell = signal(false);

  protected readonly badgeText = computed(() => {
    const count = this.store.unreadCount();
    return count > 99 ? '99+' : String(count);
  });

  constructor() {
    effect(() => {
      const current = this.store.unreadCount();
      if (current > this.prevCount()) {
        this.triggerBellAnimation();
      }
      this.prevCount.set(current);
    });
  }

  protected getTypeIcon(type: NotificationType): string {
    return TYPE_CONFIG[type].icon;
  }

  protected getTypeColor(type: NotificationType): string {
    return TYPE_CONFIG[type].color;
  }

  protected onNotificationClick(notification: AppNotification): void {
    this.store.markAsRead(notification.id);
    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
    }
  }

  protected onDismiss(event: Event, id: string): void {
    event.stopPropagation();
    this.store.dismiss(id);
  }

  private triggerBellAnimation(): void {
    this.animateBell.set(true);
    setTimeout(() => this.animateBell.set(false), 700);
  }
}
