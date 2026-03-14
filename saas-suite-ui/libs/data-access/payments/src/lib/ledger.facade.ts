import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PaymentsApiClient } from './payments-api.client';
import { LedgerJournalEntry, LedgerEntryRow, LedgerBalance, LedgerParams } from './models/ledger.model';
import { LoggerService } from '@saas-suite/shared/telemetry';

@Injectable({ providedIn: 'root' })
export class LedgerFacade {
  private api = inject(PaymentsApiClient);
  private logger = inject(LoggerService);

  private readonly _entries = signal<LedgerEntryRow[]>([]);
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
      const journals = await firstValueFrom(this.api.listLedgerEntries(params));
      const rows = this.flattenJournals(journals);
      this._entries.set(rows);
      this._total.set(rows.length);
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

  private flattenJournals(journals: LedgerJournalEntry[]): LedgerEntryRow[] {
    const rows: LedgerEntryRow[] = [];
    for (const j of journals) {
      for (const line of j.lines) {
        rows.push({
          id: j.id,
          postedAt: j.posted_at,
          side: line.side,
          account: line.account,
          amount: parseFloat(line.amount),
          currency: line.currency,
          paymentIntentId: j.payment_intent_id,
        });
      }
    }
    return rows;
  }
}
