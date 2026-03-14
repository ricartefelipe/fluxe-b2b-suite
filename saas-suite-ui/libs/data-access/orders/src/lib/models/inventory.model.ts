export type AdjustmentType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface InventoryItem {
  sku: string;
  tenantId: string;
  qty: number;
  reservedQty: number;
  availableQty: number;
  updatedAt: string;
}

export interface InventoryAdjustment {
  id: string;
  tenantId: string;
  sku: string;
  type: AdjustmentType;
  qty: number;
  reason: string;
  correlationId?: string;
  createdAt: string;
}

export interface CreateAdjustmentRequest {
  sku: string;
  type: AdjustmentType;
  qty: number;
  reason: string;
}

export interface AdjustmentListParams {
  sku?: string;
  cursor?: string;
  limit?: number;
}
