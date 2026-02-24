export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationCategory = 'order' | 'payment' | 'inventory' | 'tenant' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}
