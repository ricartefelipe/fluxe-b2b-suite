import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AppConfig, DEFAULT_CONFIG } from './app-config.model';

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private readonly _config = signal<AppConfig>(DEFAULT_CONFIG);
  readonly config = this._config.asReadonly();

  private readonly http = inject(HttpClient);

  async load(): Promise<void> {
    try {
      const cfg = await firstValueFrom(this.http.get<Record<string, unknown>>('/assets/config.json'));
      const merged = { ...DEFAULT_CONFIG, ...cfg } as AppConfig;
      const r = cfg as Record<string, unknown>;
      if (merged.coreApiBaseUrl === DEFAULT_CONFIG.coreApiBaseUrl && typeof r['coreApiUrl'] === 'string') {
        merged.coreApiBaseUrl = r['coreApiUrl'] as string;
      }
      if (merged.ordersApiBaseUrl === DEFAULT_CONFIG.ordersApiBaseUrl && typeof r['ordersApiUrl'] === 'string') {
        merged.ordersApiBaseUrl = r['ordersApiUrl'] as string;
      }
      if (merged.paymentsApiBaseUrl === DEFAULT_CONFIG.paymentsApiBaseUrl && typeof r['paymentsApiUrl'] === 'string') {
        merged.paymentsApiBaseUrl = r['paymentsApiUrl'] as string;
      }
      this._config.set(merged);
    } catch {
      console.warn('[RuntimeConfig] Could not load config.json — using defaults');
      this._config.set(DEFAULT_CONFIG);
    }
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this._config()[key];
  }
}
