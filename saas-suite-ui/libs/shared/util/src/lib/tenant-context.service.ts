import { Injectable, signal } from '@angular/core';

export interface TenantSwitcherOption {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private readonly _tenantOptions = signal<TenantSwitcherOption[]>([]);
  private readonly _activeTenantId = signal<string | null>(null);

  readonly tenantOptions = this._tenantOptions.asReadonly();
  readonly activeTenantId = this._activeTenantId.asReadonly();

  setTenantOptions(options: TenantSwitcherOption[]): void {
    this._tenantOptions.set(options);
  }

  setActiveTenantId(id: string | null): void {
    this._activeTenantId.set(id);
  }

  getActiveTenantId(): string | null {
    return this._activeTenantId();
  }
}
