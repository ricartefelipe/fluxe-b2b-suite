import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CoreApiClient } from './core-api.client';
import { FeatureFlag, CreateFlagRequest, UpdateFlagRequest } from './models/flag.model';
import { LoggerService } from '@saas-suite/shared/telemetry';

@Injectable({ providedIn: 'root' })
export class FlagsFacade {
  private api = inject(CoreApiClient);
  private logger = inject(LoggerService);

  private readonly _flags = signal<FeatureFlag[]>([]);
  private readonly _loading = signal(false);
  private _cacheKey: string | null = null;
  private _cacheTime = 0;
  private readonly TTL_MS = 60_000;

  readonly flags = this._flags.asReadonly();
  readonly loading = this._loading.asReadonly();

  async loadFlags(tenantId: string, forceRefresh = false): Promise<void> {
    const now = Date.now();
    if (!forceRefresh && this._cacheKey === tenantId && now - this._cacheTime < this.TTL_MS) return;
    this._loading.set(true);
    try {
      const flags = await firstValueFrom(this.api.listFlags(tenantId));
      this._flags.set(flags); this._cacheKey = tenantId; this._cacheTime = now;
    } catch (e) { this.logger.error('loadFlags failed', e); }
    finally { this._loading.set(false); }
  }

  async createFlag(tenantId: string, req: CreateFlagRequest): Promise<void> {
    const f = await firstValueFrom(this.api.createFlag(tenantId, req));
    this._flags.update(list => [...list, f]);
  }

  async updateFlag(tenantId: string, flagName: string, req: UpdateFlagRequest): Promise<void> {
    const f = await firstValueFrom(this.api.updateFlag(tenantId, flagName, req));
    this._flags.update(list => list.map(x => x.name === flagName ? f : x));
  }

  async deleteFlag(tenantId: string, flagName: string): Promise<void> {
    await firstValueFrom(this.api.deleteFlag(tenantId, flagName));
    this._flags.update(list => list.filter(x => x.name !== flagName));
  }

  isEnabled(flagName: string): boolean {
    return this._flags().some(f => f.name === flagName && f.enabled);
  }
}
