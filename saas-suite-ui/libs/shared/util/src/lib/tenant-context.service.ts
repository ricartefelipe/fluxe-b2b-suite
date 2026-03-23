import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private activeTenantId: string | null = null;

  setActiveTenantId(id: string | null): void {
    this.activeTenantId = id;
  }

  getActiveTenantId(): string | null {
    return this.activeTenantId;
  }
}
