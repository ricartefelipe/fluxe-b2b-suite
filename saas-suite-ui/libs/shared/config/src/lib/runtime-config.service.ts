import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AppConfig, DEFAULT_CONFIG } from './app-config.model';

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private readonly _config = signal<AppConfig>(DEFAULT_CONFIG);
  readonly config = this._config.asReadonly();

  constructor(private http: HttpClient) {}

  async load(): Promise<void> {
    try {
      const cfg = await firstValueFrom(this.http.get<Partial<AppConfig>>('/assets/config.json'));
      this._config.set({ ...DEFAULT_CONFIG, ...cfg });
    } catch {
      console.warn('[RuntimeConfig] Could not load config.json — using defaults');
      this._config.set(DEFAULT_CONFIG);
    }
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this._config()[key];
  }
}
