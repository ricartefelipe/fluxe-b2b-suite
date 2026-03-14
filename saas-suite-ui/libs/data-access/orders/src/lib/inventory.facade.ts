import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { OrdersApiClient } from './orders-api.client';
import { InventoryAdjustment, CreateAdjustmentRequest, AdjustmentListParams } from './models/inventory.model';
import { LoggerService } from '@saas-suite/shared/telemetry';
import { generateIdempotencyKey } from '@saas-suite/shared/util';

@Injectable({ providedIn: 'root' })
export class InventoryFacade {
  private api = inject(OrdersApiClient);
  private logger = inject(LoggerService);

  private readonly _adjustments = signal<InventoryAdjustment[]>([]);
  private readonly _total = signal(0);
  private readonly _loading = signal(false);

  readonly adjustments = this._adjustments.asReadonly();
  readonly total = this._total.asReadonly();
  readonly loading = this._loading.asReadonly();

  async loadAdjustments(params?: AdjustmentListParams): Promise<void> {
    this._loading.set(true);
    try {
      const r = await firstValueFrom(this.api.listAdjustments(params));
      this._adjustments.set(r.data); this._total.set(r.data.length);
    } catch (e) { this.logger.error('loadAdjustments failed', e); }
    finally { this._loading.set(false); }
  }

  async createAdjustment(req: CreateAdjustmentRequest): Promise<InventoryAdjustment | null> {
    const key = generateIdempotencyKey('adj');
    try {
      const a = await firstValueFrom(this.api.createAdjustment(req, key));
      this._adjustments.update(list => [a, ...list]); return a;
    } catch (e) { this.logger.error('createAdjustment failed', e); return null; }
  }
}
