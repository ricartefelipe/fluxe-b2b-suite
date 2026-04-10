import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CoreApiClient } from './core-api.client';
import { Policy, CreatePolicyRequest, PolicyListParams } from './models/policy.model';
import { LoggerService } from '@saas-suite/shared/telemetry';

@Injectable({ providedIn: 'root' })
export class PoliciesFacade {
  private api = inject(CoreApiClient);
  private logger = inject(LoggerService);

  private readonly _policies = signal<Policy[]>([]);
  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _error = signal(false);

  readonly policies = this._policies.asReadonly();
  readonly total = this._total.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  async loadPolicies(params?: PolicyListParams): Promise<void> {
    this._loading.set(true);
    this._error.set(false);
    try {
      const r = await firstValueFrom(this.api.listPolicies(params));
      this._policies.set(r.data); this._total.set(r.total);
    } catch (e) {
      this.logger.error('loadPolicies failed', e);
      this._error.set(true);
    } finally { this._loading.set(false); }
  }

  async createPolicy(req: CreatePolicyRequest): Promise<Policy | null> {
    try {
      const p = await firstValueFrom(this.api.createPolicy(req));
      this._policies.update(list => [p, ...list]); return p;
    } catch (e) { this.logger.error('createPolicy failed', e); return null; }
  }

  async updatePolicy(id: string, req: Partial<CreatePolicyRequest>): Promise<Policy | null> {
    try {
      const p = await firstValueFrom(this.api.updatePolicy(id, req));
      this._policies.update(list => list.map(x => x.id === id ? p : x)); return p;
    } catch (e) { this.logger.error('updatePolicy failed', e); return null; }
  }

  async deletePolicy(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.api.deletePolicy(id));
      this._policies.update(list => list.filter(x => x.id !== id)); return true;
    } catch (e) { this.logger.error('deletePolicy failed', e); return false; }
  }
}
