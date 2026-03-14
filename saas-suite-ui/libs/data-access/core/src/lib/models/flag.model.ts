export interface FeatureFlag {
  id: string;
  tenantId: string;
  name: string;
  enabled: boolean;
  rolloutPercent?: number;
  allowedRoles?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlagRequest {
  name: string;
  enabled: boolean;
  rolloutPercent?: number;
  allowedRoles?: string;
}

export interface UpdateFlagRequest {
  enabled?: boolean;
  rolloutPercent?: number;
  allowedRoles?: string;
}
