import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { LoggerService } from '@saas-suite/shared/telemetry';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class WebVitalsTracker {
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  init(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.trackCoreWebVitals();
    this.trackRouteChanges();
  }

  private trackCoreWebVitals(): void {
    import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      const report = (name: string) => (metric: { value: number; rating: string }) => {
        this.logger.info(`[Performance] ${name}`, {
          value: metric.value,
          rating: metric.rating,
          url: window.location.href,
        });
      };

      onCLS(report('CLS'));
      onINP(report('INP'));
      onLCP(report('LCP'));
      onFCP(report('FCP'));
      onTTFB(report('TTFB'));
    });
  }

  private trackRouteChanges(): void {
    let navigationStart = 0;

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(event => {
        const duration = navigationStart ? performance.now() - navigationStart : 0;

        if (duration > 0) {
          this.logger.info('[Performance] Route navigation', {
            url: event.urlAfterRedirects,
            durationMs: Math.round(duration),
          });
        }

        navigationStart = performance.now();
      });
  }
}
