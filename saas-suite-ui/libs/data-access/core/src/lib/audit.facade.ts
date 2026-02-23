import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CoreApiClient } from './core-api.client';
import { AuditLog, AuditListParams } from './models/audit.model';
import { LoggerService } from '@saas-suite/shared/telemetry';

@Injectable({ providedIn: 'root' })
export class AuditFacade {
  private api = inject(CoreApiClient);
  private logger = inject(LoggerService);

  private readonly _logs = signal<AuditLog[]>([]);
  private readonly _total = signal(0);
  private readonly _loading = signal(false);

  readonly logs = this._logs.asReadonly();
  readonly total = this._total.asReadonly();
  readonly loading = this._loading.asReadonly();

  async loadAuditLogs(params?: AuditListParams): Promise<void> {
    this._loading.set(true);
    try {
      const r = await firstValueFrom(this.api.listAuditLogs(params));
      this._logs.set(r.data); this._total.set(r.total);
    } catch (e) { this.logger.error('loadAuditLogs failed', e); }
    finally { this._loading.set(false); }
  }
}
