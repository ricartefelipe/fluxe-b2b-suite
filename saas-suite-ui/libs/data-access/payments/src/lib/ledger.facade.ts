import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PaymentsApiClient } from './payments-api.client';
import { LedgerEntry, LedgerBalance, LedgerParams } from './models/ledger.model';
import { LoggerService } from '@saas-suite/shared/telemetry';

@Injectable({ providedIn: 'root' })
export class LedgerFacade {
  private api = inject(PaymentsApiClient);
  private logger = inject(LoggerService);

  private readonly _entries = signal<LedgerEntry[]>([]);
  private readonly _balances = signal<LedgerBalance[]>([]);
  private readonly _total = signal(0);
  private readonly _loading = signal(false);

  readonly entries = this._entries.asReadonly();
  readonly balances = this._balances.asReadonly();
  readonly total = this._total.asReadonly();
  readonly loading = this._loading.asReadonly();

  async loadEntries(params?: LedgerParams): Promise<void> {
    this._loading.set(true);
    try {
      const r = await firstValueFrom(this.api.listLedgerEntries(params));
      this._entries.set(r.data); this._total.set(r.total);
    } catch (e) { this.logger.error('loadLedgerEntries failed', e); }
    finally { this._loading.set(false); }
  }

  async loadBalances(params?: LedgerParams): Promise<void> {
    this._loading.set(true);
    try {
      const b = await firstValueFrom(this.api.getLedgerBalances(params));
      this._balances.set(b);
    } catch (e) { this.logger.error('loadBalances failed', e); }
    finally { this._loading.set(false); }
  }
}
