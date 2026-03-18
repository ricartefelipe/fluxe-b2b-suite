export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type TenantPlan = 'starter' | 'pro' | 'enterprise';

export interface Tenant {
  id: string;
  name: string;
  plan: TenantPlan;
  region: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantRequest {
  name: string;
  plan: TenantPlan;
  region: string;
}

export interface UpdateTenantRequest {
  name?: string;
  plan?: TenantPlan;
  status?: TenantStatus;
}

export interface TenantListParams {
  status?: TenantStatus;
  plan?: TenantPlan;
  region?: string;
  name?: string;
  cursor?: string;
  limit?: number;
}

export interface TenantHealth {
  tenantId: string;
  lastActivityAt: string | null;
  activeUsersCount: number;
}
