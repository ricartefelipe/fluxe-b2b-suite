import { Injectable, NgZone, OnDestroy, inject, isDevMode } from '@angular/core';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { AppNotification, NotificationCategory, NotificationType } from './notification.model';
import { NotificationStore } from './notification.store';

const MOCK_INTERVAL_MS = 30_000;

interface MockTemplate {
  type: NotificationType;
  category: NotificationCategory;
  title: (id: string) => string;
  message: (id: string) => string;
  actionUrl?: string;
}

const MOCK_TEMPLATES: MockTemplate[] = [
  {
    type: 'success',
    category: 'order',
    title: (id) => `New order #ORD-${id} created`,
    message: (id) => `Order #ORD-${id} has been successfully placed and is awaiting processing.`,
    actionUrl: '/orders',
  },
  {
    type: 'success',
    category: 'payment',
    title: (id) => `Payment of $${id} confirmed`,
    message: (id) => `A payment of $${id}.00 has been successfully processed and confirmed.`,
    actionUrl: '/payments',
  },
  {
    type: 'warning',
    category: 'inventory',
    title: (id) => `Low stock alert: SKU-${id}`,
    message: (id) => `Product SKU-${id} has dropped below the minimum threshold. Reorder recommended.`,
    actionUrl: '/inventory',
  },
  {
    type: 'info',
    category: 'tenant',
    title: () => 'Tenant onboarding completed',
    message: () => 'A new tenant has completed the onboarding process and is now active.',
    actionUrl: '/tenants',
  },
  {
    type: 'info',
    category: 'system',
    title: () => 'Fluxe B2B Suite maintenance scheduled',
    message: () => 'Scheduled maintenance window: Saturday 02:00–04:00 UTC. Plan accordingly.',
  },
  {
    type: 'error',
    category: 'payment',
    title: (id) => `Payment #PAY-${id} failed`,
    message: (id) => `Payment #PAY-${id} was declined by the payment gateway. Please review.`,
    actionUrl: '/payments',
  },
  {
    type: 'warning',
    category: 'system',
    title: () => 'High CPU usage detected',
    message: () => 'Server CPU usage has exceeded 90% for the last 5 minutes.',
  },
];

/**
 * Notificações in-app: em dev + authMode dev usa dados simulados.
 * Não há stream SSE no stack actual; quando existir endpoint no backend, ligar aqui com flag de config.
 */
@Injectable({ providedIn: 'root' })
export class SseService implements OnDestroy {
  private readonly config = inject(RuntimeConfigService);
  private readonly store = inject(NotificationStore);
  private readonly zone = inject(NgZone);

  private mockInterval: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;

  connect(): void {
    if (this.destroyed) return;
    if (this.config.get('authMode') === 'dev' && isDevMode()) {
      this.startMockMode();
      return;
    }
  }

  disconnect(): void {
    this.destroyed = true;
    this.stopMockMode();
    this.store.setConnected(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private startMockMode(): void {
    this.store.setConnected(true);

    this.zone.runOutsideAngular(() => {
      this.store.add(this.generateMockNotification());

      this.mockInterval = setInterval(() => {
        this.zone.run(() => {
          this.store.add(this.generateMockNotification());
        });
      }, MOCK_INTERVAL_MS);
    });
  }

  private stopMockMode(): void {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }

  private generateMockNotification(): AppNotification {
    const template = MOCK_TEMPLATES[Math.floor(Math.random() * MOCK_TEMPLATES.length)];
    const randomId = String(Math.floor(1000 + Math.random() * 9000));

    return {
      id: crypto.randomUUID(),
      type: template.type,
      category: template.category,
      title: template.title(randomId),
      message: template.message(randomId),
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: template.actionUrl,
    };
  }
}
