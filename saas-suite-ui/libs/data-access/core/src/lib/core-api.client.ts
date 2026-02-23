import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import {
  Tenant, CreateTenantRequest, UpdateTenantRequest, TenantListParams,
  Policy, CreatePolicyRequest, PolicyListParams,
  FeatureFlag, CreateFlagRequest, UpdateFlagRequest,
  AuditLog, AuditListParams,
} from './models';

export interface PageResponse<T> { data: T[]; total: number; page: number; pageSize: number; }

@Injectable({ providedIn: 'root' })
export class CoreApiClient {
  private http = inject(HttpClient);
  private config = inject(RuntimeConfigService);

  private get base(): string { return this.config.get('coreApiBaseUrl'); }

  private toParams(obj?: Record<string, unknown>): HttpParams {
    let params = new HttpParams();
    if (!obj) return params;
    Object.entries(obj).forEach(([k, v]) => {
      if (v != null && v !== '') params = params.set(k, String(v));
    });
    return params;
  }

  listTenants(p?: TenantListParams): Observable<PageResponse<Tenant>> {
    return this.http.get<PageResponse<Tenant>>(`${this.base}/v1/tenants`, { params: this.toParams(p as Record<string, unknown>) });
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
    return this.http.get<PageResponse<Policy>>(`${this.base}/v1/policies`, { params: this.toParams(p as Record<string, unknown>) });
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
    return this.http.get<PageResponse<AuditLog>>(`${this.base}/v1/audit`, { params: this.toParams(p as Record<string, unknown>) });
  }
}
