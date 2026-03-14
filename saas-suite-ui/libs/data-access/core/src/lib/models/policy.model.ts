export type PolicyEffect = 'ALLOW' | 'DENY';

export interface Policy {
  id: string;
  permissionCode: string;
  effect: PolicyEffect;
  tenantId?: string;
  allowedPlans?: string;
  allowedRegions?: string;
  enabled: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePolicyRequest {
  permissionCode: string;
  effect: PolicyEffect;
  tenantId?: string;
  allowedPlans?: string;
  allowedRegions?: string;
  enabled?: boolean;
  notes?: string;
}

export interface PolicyListParams {
  permissionCode?: string;
  effect?: PolicyEffect;
  enabled?: boolean;
  cursor?: string;
  limit?: number;
}
