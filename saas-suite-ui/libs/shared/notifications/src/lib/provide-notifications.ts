import { APP_INITIALIZER, DestroyRef, EnvironmentProviders, Injectable, Injector, effect, inject, makeEnvironmentProviders } from '@angular/core';
import { NotificationStore } from './notification.store';
import { NotificationToastService } from './notification-toast.component';
import { SseService } from './sse.service';

@Injectable({ providedIn: 'root' })
class NotificationOrchestrator {
  private readonly sse = inject(SseService);
  private readonly store = inject(NotificationStore);
  private readonly toast = inject(NotificationToastService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  private lastCount = 0;

  start(): void {
    try {
      this.sse.connect();
      this.lastCount = this.store.notifications().length;

      effect(() => {
        const notifications = this.store.notifications();
        if (notifications.length > this.lastCount) {
          const newest = notifications[0];
          if (newest && !newest.read) {
            this.toast.show(newest);
          }
        }
        this.lastCount = notifications.length;
      }, { injector: this.injector });

      this.destroyRef.onDestroy(() => this.sse.disconnect());
    } catch {
      // evita quebrar bootstrap
    }
  }
}

export function provideNotifications(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: APP_INITIALIZER,
      useFactory: (orchestrator: NotificationOrchestrator) => () => {
        setTimeout(() => orchestrator.start(), 0);
      },
      deps: [NotificationOrchestrator],
      multi: true,
    },
  ]);
}
