import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
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
  private readonly _loadError = signal<string | null>(null);

  readonly entries = this._entries.asReadonly();
  readonly balances = this._balances.asReadonly();
  readonly total = this._total.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loadError = this._loadError.asReadonly();

  async loadEntries(params?: LedgerParams): Promise<void> {
    this._loading.set(true);
    this._loadError.set(null);
    try {
      const journals = await firstValueFrom(this.api.listLedgerEntries(params));
      const rows = this.flattenJournals(journals);
      this._entries.set(rows);
      this._total.set(rows.length);
    } catch (e) {
      this.logger.error('loadLedgerEntries failed', e);
      this._loadError.set(this.formatLoadError(e));
    }
    finally { this._loading.set(false); }
  }

  async loadBalances(params?: LedgerParams): Promise<void> {
    this._loading.set(true);
    this._loadError.set(null);
    try {
      const b = await firstValueFrom(this.api.getLedgerBalances(params));
      this._balances.set(b);
    } catch (e) {
      this.logger.error('loadBalances failed', e);
      this._loadError.set(this.formatLoadError(e));
    }
    finally { this._loading.set(false); }
  }

  private formatLoadError(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const body = e.error;
      if (body && typeof body === 'object') {
        const d = (body as { detail?: unknown }).detail;
        if (typeof d === 'string' && d.trim().length > 0) {
          return d.trim();
        }
        if ('message' in body) {
          return String((body as { message: unknown }).message);
        }
      }
      return `${e.status} ${e.statusText}`.trim();
    }
    if (e instanceof Error) {
      return e.message;
    }
    return String(e);
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
