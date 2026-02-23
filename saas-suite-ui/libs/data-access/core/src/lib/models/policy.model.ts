export type PolicyEffect = 'ALLOW' | 'DENY';

export interface Policy {
  id: string;
  permissionCode: string;
  effect: PolicyEffect;
  tenantId?: string;
  allowedPlans?: string[];
  allowedRegions?: string[];
  enabled: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePolicyRequest {
  permissionCode: string;
  effect: PolicyEffect;
  tenantId?: string;
  allowedPlans?: string[];
  allowedRegions?: string[];
  enabled?: boolean;
  description?: string;
}

export interface PolicyListParams {
  permissionCode?: string;
  effect?: PolicyEffect;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
}
