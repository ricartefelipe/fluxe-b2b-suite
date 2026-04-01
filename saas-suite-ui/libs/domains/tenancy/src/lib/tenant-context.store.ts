import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { TenantsFacade, Tenant } from '@saas-suite/data-access/core';
import { TenantContextService } from '@saas-suite/shared/http';

@Injectable({ providedIn: 'root' })
export class TenantContextStore {
  private readonly tenantsFacade = inject(TenantsFacade);
  private readonly tenantCtx = inject(TenantContextService);
  private readonly _activeTenant = signal<Tenant | null>(null);

  readonly activeTenant = this._activeTenant.asReadonly();
  readonly activeTenantId = computed(() => this._activeTenant()?.id ?? null);
  readonly tenants = this.tenantsFacade.tenants;
  readonly loading = this.tenantsFacade.loading;

  constructor() {
    effect(() => {
      const list = this.tenants();
      const active = this._activeTenant();
      const fromList = list.map((t) => ({ id: t.id, name: t.name }));
      const seen = new Set(fromList.map((o) => o.id));
      if (active && !seen.has(active.id)) {
        const label = active.name?.trim() ? active.name : active.id;
        fromList.push({ id: active.id, name: label });
      }
      this.tenantCtx.setTenantOptions(fromList);
    });

    effect(() => {
      const id = this.tenantCtx.activeTenantId();
      if (id === null) {
        if (this._activeTenant() !== null) {
          this._activeTenant.set(null);
        }
        return;
      }
      if (this._activeTenant()?.id === id) {
        return;
      }
      const t = this.tenants().find((x) => x.id === id);
      if (t) {
        this._activeTenant.set(t);
      }
    });
  }

  async loadTenants(): Promise<void> {
    await this.tenantsFacade.loadTenants({ limit: 100 });
  }

  selectTenant(tenant: Tenant): void {
    this._activeTenant.set(tenant);
    this.tenantCtx.setActiveTenantId(tenant.id);
  }

  clearTenant(): void {
    this._activeTenant.set(null);
    this.tenantCtx.setActiveTenantId(null);
  }
}
