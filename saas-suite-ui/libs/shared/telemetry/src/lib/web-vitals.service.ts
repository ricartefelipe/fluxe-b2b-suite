import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class WebVitalsService {
  private logger = inject(LoggerService);

  init(): void {
    import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      const report = (name: string) => (metric: { value: number; rating: string }) => {
        this.logger.info(`[WebVitals] ${name}`, { value: metric.value, rating: metric.rating });
      };
      onCLS(report('CLS'));
      onINP(report('INP'));
      onLCP(report('LCP'));
      onFCP(report('FCP'));
      onTTFB(report('TTFB'));
    });
  }
}
