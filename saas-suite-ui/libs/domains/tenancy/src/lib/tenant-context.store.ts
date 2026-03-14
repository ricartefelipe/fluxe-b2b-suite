import { Injectable, inject, signal, computed } from '@angular/core';
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
