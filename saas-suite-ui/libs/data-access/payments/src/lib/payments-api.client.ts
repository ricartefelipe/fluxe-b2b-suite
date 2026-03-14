import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { IDEMPOTENCY_KEY } from '@saas-suite/shared/util';
import { PageResponse, toParams } from '@saas-suite/shared/http';
import { PaymentIntent, CreatePaymentIntentRequest, PaymentListParams } from './models/payment.model';
import { LedgerJournalEntry, LedgerBalance, LedgerParams } from './models/ledger.model';

@Injectable({ providedIn: 'root' })
export class PaymentsApiClient {
  private http = inject(HttpClient);
  private config = inject(RuntimeConfigService);

  private get base(): string { return this.config.get('paymentsApiBaseUrl'); }

  listPayments(p?: PaymentListParams): Observable<PageResponse<PaymentIntent>> {
    return this.http.get<PageResponse<PaymentIntent>>(`${this.base}/v1/payment-intents`, { params: toParams(p as Record<string, unknown>) });
  }
  getPayment(id: string): Observable<PaymentIntent> {
    return this.http.get<PaymentIntent>(`${this.base}/v1/payment-intents/${id}`);
  }
  createPayment(req: CreatePaymentIntentRequest, idempotencyKey: string): Observable<PaymentIntent> {
    return this.http.post<PaymentIntent>(`${this.base}/v1/payment-intents`, req, {
      context: new HttpContext().set(IDEMPOTENCY_KEY, idempotencyKey),
    });
  }
  confirmPayment(id: string, idempotencyKey: string): Observable<PaymentIntent> {
    return this.http.post<PaymentIntent>(`${this.base}/v1/payment-intents/${id}/confirm`, {}, {
      context: new HttpContext().set(IDEMPOTENCY_KEY, idempotencyKey),
    });
  }
  listLedgerEntries(p?: LedgerParams): Observable<LedgerJournalEntry[]> {
    return this.http.get<LedgerJournalEntry[]>(`${this.base}/v1/ledger/entries`, { params: toParams(p as Record<string, unknown>) });
  }
  getLedgerBalances(p?: LedgerParams): Observable<LedgerBalance[]> {
    return this.http.get<LedgerBalance[]>(`${this.base}/v1/ledger/balances`, { params: toParams(p as Record<string, unknown>) });
  }
}
