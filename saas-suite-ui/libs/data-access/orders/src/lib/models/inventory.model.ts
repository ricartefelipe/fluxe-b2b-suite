export type AdjustmentType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface InventoryItem {
  sku: string;
  tenantId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  updatedAt: string;
}

export interface InventoryAdjustment {
  id: string;
  tenantId: string;
  sku: string;
  type: AdjustmentType;
  quantity: number;
  reason: string;
  correlationId?: string;
  createdAt: string;
}

export interface CreateAdjustmentRequest {
  sku: string;
  type: AdjustmentType;
  quantity: number;
  reason: string;
}

export interface AdjustmentListParams {
  sku?: string;
  type?: AdjustmentType;
  page?: number;
  pageSize?: number;
}
