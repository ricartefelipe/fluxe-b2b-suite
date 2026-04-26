import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PaymentsApiClient } from './payments-api.client';
import { PaymentIntent, CreatePaymentIntentRequest, PaymentListParams } from './models/payment.model';
import { LoggerService } from '@saas-suite/shared/telemetry';
import { generateIdempotencyKey } from '@saas-suite/shared/util';

@Injectable({ providedIn: 'root' })
export class PaymentsFacade {
  private api = inject(PaymentsApiClient);
  private logger = inject(LoggerService);

  private readonly _payments = signal<PaymentIntent[]>([]);
  private readonly _total = signal(0);
  private readonly _loading = signal(false);

  readonly payments = this._payments.asReadonly();
  readonly total = this._total.asReadonly();
  readonly loading = this._loading.asReadonly();

  async loadPayments(params?: PaymentListParams): Promise<void> {
    this._loading.set(true);
    try {
      const r = await firstValueFrom(this.api.listPayments(params));
      this._payments.set(r.data); this._total.set(r.total);
    } catch (e) { this.logger.error('loadPayments failed', e); }
    finally { this._loading.set(false); }
  }

  async loadAllPayments(params?: PaymentListParams): Promise<PaymentIntent[]> {
    this._loading.set(true);
    try {
      const pageSize = params?.limit ?? 500;
      let offset = params?.offset ?? 0;
      let total = Number.POSITIVE_INFINITY;
      const payments: PaymentIntent[] = [];
      while (payments.length < total) {
        const r = await firstValueFrom(this.api.listPayments({ ...params, limit: pageSize, offset }));
        payments.push(...r.data);
        total = r.total;
        if (r.data.length === 0) break;
        offset += r.data.length;
      }
      this._payments.set(payments); this._total.set(total === Number.POSITIVE_INFINITY ? payments.length : total);
      return payments;
    } catch (e) {
      this.logger.error('loadAllPayments failed', e);
      return [];
    } finally { this._loading.set(false); }
  }

  async createPayment(req: CreatePaymentIntentRequest): Promise<PaymentIntent | null> {
    const key = generateIdempotencyKey('pay-create');
    try {
      const p = await firstValueFrom(this.api.createPayment(req, key));
      this._payments.update(list => [p, ...list]); return p;
    } catch (e) { this.logger.error('createPayment failed', e); return null; }
  }

  async confirmPayment(id: string): Promise<PaymentIntent | null> {
    const key = generateIdempotencyKey('pay-confirm');
    try {
      const p = await firstValueFrom(this.api.confirmPayment(id, key));
      this._payments.update(list => list.map(x => x.id === id ? p : x)); return p;
    } catch (e) { this.logger.error('confirmPayment failed', e); return null; }
  }
}
