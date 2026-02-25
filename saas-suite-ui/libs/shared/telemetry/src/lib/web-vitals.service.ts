import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class WebVitalsService {
  private logger = inject(LoggerService);

  init(): void {
    import('web-vitals').then((mod) => {
      const report = (name: string) => (metric: { value: number; rating: string }) => {
        this.logger.info(`[WebVitals] ${name}`, { value: metric.value, rating: metric.rating });
      };
      const bind = (fn: ((cb: (m: { value: number; rating: string }) => void) => void) | undefined, name: string) => {
        if (typeof fn === 'function') fn(report(name));
      };
      bind(mod.onCLS, 'CLS');
      bind(mod.onINP, 'INP');
      bind(mod.onLCP, 'LCP');
      bind(mod.onFCP, 'FCP');
      bind(mod.onTTFB, 'TTFB');
    }).catch(() => { /* ignore load error */ });
  }
}
