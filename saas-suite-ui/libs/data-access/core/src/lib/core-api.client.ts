import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { PageResponse, toParams } from '@saas-suite/shared/http';
import {
  Tenant, CreateTenantRequest, UpdateTenantRequest, TenantListParams,
  Policy, CreatePolicyRequest, PolicyListParams,
  FeatureFlag, CreateFlagRequest, UpdateFlagRequest,
  AuditLog, AuditListParams,
} from './models';

function normalizePage<T>(raw: Record<string, unknown>): PageResponse<T> {
  const data = (raw['data'] ?? raw['items'] ?? raw['content'] ?? []) as T[];
  const total = (raw['total'] ?? raw['totalElements'] ?? (data as T[]).length) as number;
  const page = (raw['page'] ?? raw['number'] ?? 0) as number;
  const pageSize = (raw['pageSize'] ?? raw['size'] ?? (data as T[]).length) as number;
  return { data, total, page, pageSize };
}

@Injectable({ providedIn: 'root' })
export class CoreApiClient {
  private http = inject(HttpClient);
  private config = inject(RuntimeConfigService);

  private get base(): string { return this.config.get('coreApiBaseUrl'); }

  listTenants(p?: TenantListParams): Observable<PageResponse<Tenant>> {
    return this.http.get<Record<string, unknown>>(`${this.base}/v1/tenants`, { params: toParams(p as Record<string, unknown>) })
      .pipe(map(r => normalizePage<Tenant>(r)));
  }
  getTenant(id: string): Observable<Tenant> {
    return this.http.get<Tenant>(`${this.base}/v1/tenants/${id}`);
  }
  createTenant(req: CreateTenantRequest): Observable<Tenant> {
    return this.http.post<Tenant>(`${this.base}/v1/tenants`, req);
  }
  updateTenant(id: string, req: UpdateTenantRequest): Observable<Tenant> {
    return this.http.patch<Tenant>(`${this.base}/v1/tenants/${id}`, req);
  }
  deleteTenant(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/v1/tenants/${id}`);
  }

  listPolicies(p?: PolicyListParams): Observable<PageResponse<Policy>> {
    return this.http.get<Record<string, unknown>>(`${this.base}/v1/policies`, { params: toParams(p as Record<string, unknown>) })
      .pipe(map(r => normalizePage<Policy>(r)));
  }
  getPolicy(id: string): Observable<Policy> {
    return this.http.get<Policy>(`${this.base}/v1/policies/${id}`);
  }
  createPolicy(req: CreatePolicyRequest): Observable<Policy> {
    return this.http.post<Policy>(`${this.base}/v1/policies`, req);
  }
  updatePolicy(id: string, req: Partial<CreatePolicyRequest>): Observable<Policy> {
    return this.http.patch<Policy>(`${this.base}/v1/policies/${id}`, req);
  }
  deletePolicy(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/v1/policies/${id}`);
  }

  listFlags(tenantId: string): Observable<FeatureFlag[]> {
    return this.http.get<FeatureFlag[]>(`${this.base}/v1/tenants/${tenantId}/flags`);
  }
  createFlag(tenantId: string, req: CreateFlagRequest): Observable<FeatureFlag> {
    return this.http.post<FeatureFlag>(`${this.base}/v1/tenants/${tenantId}/flags`, req);
  }
  updateFlag(tenantId: string, flagName: string, req: UpdateFlagRequest): Observable<FeatureFlag> {
    return this.http.patch<FeatureFlag>(`${this.base}/v1/tenants/${tenantId}/flags/${flagName}`, req);
  }
  deleteFlag(tenantId: string, flagName: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/v1/tenants/${tenantId}/flags/${flagName}`);
  }

  listAuditLogs(p?: AuditListParams): Observable<PageResponse<AuditLog>> {
    return this.http.get<Record<string, unknown>>(`${this.base}/v1/audit`, { params: toParams(p as Record<string, unknown>) })
      .pipe(map(r => normalizePage<AuditLog>(r)));
  }
}
