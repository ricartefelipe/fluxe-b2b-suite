import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { IDEMPOTENCY_KEY } from '@saas-suite/shared/util';
import { PaymentIntent, CreatePaymentIntentRequest, PaymentListParams } from './models/payment.model';
import { LedgerEntry, LedgerBalance, LedgerParams } from './models/ledger.model';

export interface PageResponse<T> { data: T[]; total: number; page: number; pageSize: number; }

@Injectable({ providedIn: 'root' })
export class PaymentsApiClient {
  private http = inject(HttpClient);
  private config = inject(RuntimeConfigService);

  private get base(): string { return this.config.get('paymentsApiBaseUrl'); }

  private toParams(obj?: Record<string, unknown>): HttpParams {
    let params = new HttpParams();
    if (!obj) return params;
    Object.entries(obj).forEach(([k, v]) => { if (v != null && v !== '') params = params.set(k, String(v)); });
    return params;
  }

  listPayments(p?: PaymentListParams): Observable<PageResponse<PaymentIntent>> {
    return this.http.get<PageResponse<PaymentIntent>>(`${this.base}/v1/payment-intents`, { params: this.toParams(p as Record<string, unknown>) });
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
  listLedgerEntries(p?: LedgerParams): Observable<PageResponse<LedgerEntry>> {
    return this.http.get<PageResponse<LedgerEntry>>(`${this.base}/v1/ledger/entries`, { params: this.toParams(p as Record<string, unknown>) });
  }
  getLedgerBalances(p?: LedgerParams): Observable<LedgerBalance[]> {
    return this.http.get<LedgerBalance[]>(`${this.base}/v1/ledger/balances`, { params: this.toParams(p as Record<string, unknown>) });
  }
}
