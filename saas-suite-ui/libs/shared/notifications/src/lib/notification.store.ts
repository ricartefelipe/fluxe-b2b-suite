import { Injectable, computed, signal } from '@angular/core';
import { AppNotification } from './notification.model';

const MAX_NOTIFICATIONS = 50;

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly _notifications = signal<AppNotification[]>([]);
  private readonly _connected = signal(false);

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = computed(() => this._notifications().filter(n => !n.read).length);
  readonly connected = this._connected.asReadonly();

  add(notification: AppNotification): void {
    this._notifications.update(list => [notification, ...list].slice(0, MAX_NOTIFICATIONS));
  }

  markAsRead(id: string): void {
    this._notifications.update(list =>
      list.map(n => n.id === id ? { ...n, read: true } : n),
    );
  }

  markAllAsRead(): void {
    this._notifications.update(list => list.map(n => ({ ...n, read: true })));
  }

  dismiss(id: string): void {
    this._notifications.update(list => list.filter(n => n.id !== id));
  }

  clearAll(): void {
    this._notifications.set([]);
  }

  setConnected(connected: boolean): void {
    this._connected.set(connected);
  }
}
