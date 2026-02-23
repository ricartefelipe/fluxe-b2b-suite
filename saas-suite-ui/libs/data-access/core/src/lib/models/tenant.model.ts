export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';
export type TenantPlan = 'starter' | 'professional' | 'enterprise';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  region: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
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
  page?: number;
  pageSize?: number;
}
