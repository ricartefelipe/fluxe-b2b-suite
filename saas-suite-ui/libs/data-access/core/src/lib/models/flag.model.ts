export interface FeatureFlag {
  id: string;
  tenantId: string;
  name: string;
  enabled: boolean;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlagRequest {
  name: string;
  enabled: boolean;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateFlagRequest {
  enabled?: boolean;
  description?: string;
  metadata?: Record<string, unknown>;
}
