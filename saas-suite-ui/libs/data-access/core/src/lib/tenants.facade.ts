import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { CoreApiClient } from './core-api.client';
import { Tenant, CreateTenantRequest, UpdateTenantRequest, TenantListParams } from './models/tenant.model';
import { LoggerService } from '@saas-suite/shared/telemetry';

/** Evita spinner infinito quando o Core não responde (URL/CORS/rede). */
const LIST_TENANTS_TIMEOUT_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class TenantsFacade {
  private api = inject(CoreApiClient);
  private logger = inject(LoggerService);

  private readonly _tenants = signal<Tenant[]>([]);
  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly tenants = this._tenants.asReadonly();
  readonly total = this._total.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  async loadTenants(params?: TenantListParams): Promise<void> {
    this._loading.set(true); this._error.set(null);
    try {
      const r = await firstValueFrom(
        this.api.listTenants(params).pipe(timeout(LIST_TENANTS_TIMEOUT_MS))
      );
      this._tenants.set(r.data); this._total.set(r.total);
    } catch (e) {
      this._tenants.set([]);
      this._total.set(0);
      this._error.set('Falha ao carregar tenants');
      this.logger.error('loadTenants failed', e);
    } finally { this._loading.set(false); }
  }

  async createTenant(req: CreateTenantRequest): Promise<Tenant | null> {
    try {
      const t = await firstValueFrom(this.api.createTenant(req));
      this._tenants.update(list => [t, ...list]); return t;
    } catch (e) { this.logger.error('createTenant failed', e); return null; }
  }

  async updateTenant(id: string, req: UpdateTenantRequest): Promise<Tenant | null> {
    try {
      const t = await firstValueFrom(this.api.updateTenant(id, req));
      this._tenants.update(list => list.map(x => x.id === id ? t : x)); return t;
    } catch (e) { this.logger.error('updateTenant failed', e); return null; }
  }

  async deleteTenant(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.api.deleteTenant(id));
      this._tenants.update(list => list.filter(x => x.id !== id)); return true;
    } catch (e) { this.logger.error('deleteTenant failed', e); return false; }
  }
}
