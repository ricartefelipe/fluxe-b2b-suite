import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { PageResponse, toParams } from '@saas-suite/shared/http';
import {
  Tenant, CreateTenantRequest, UpdateTenantRequest, TenantListParams, TenantHealth,
  Policy, CreatePolicyRequest, PolicyListParams,
  FeatureFlag, CreateFlagRequest, UpdateFlagRequest,
  AuditLog, AuditListParams,
  BillingInvoice, PlanDefinition, Subscription,
} from './models';

function normalizePage<T>(raw: Record<string, unknown>): PageResponse<T> {
  const rawData = raw['data'] ?? raw['items'] ?? raw['content'];
  const data = Array.isArray(rawData) ? (rawData as T[]) : [];
  const total = (raw['total'] ?? raw['totalElements'] ?? data.length) as number;
  const page = (raw['page'] ?? raw['number'] ?? 0) as number;
  const pageSize = (raw['pageSize'] ?? raw['size'] ?? data.length) as number;
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

  getTenantHealth(tenantId: string): Observable<TenantHealth> {
    return this.http.get<TenantHealth>(`${this.base}/v1/tenants/${tenantId}/health`);
  }

  exportTenantData(tenantId: string): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.base}/v1/tenants/${tenantId}/export`);
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

  listPlans(): Observable<PlanDefinition[]> {
    return this.http.get<PlanDefinition[]>(`${this.base}/v1/billing/plans`);
  }

  getCurrentSubscription(): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.base}/v1/subscriptions/current`);
  }

  listBillingInvoices(): Observable<BillingInvoice[]> {
    return this.http.get<BillingInvoice[]>(`${this.base}/v1/billing/invoices`);
  }

  createPortalSession(returnUrl: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.base}/v1/billing/portal-session`, { returnUrl });
  }

  startTrial(planSlug: string): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.base}/v1/subscriptions/trial`, { planSlug });
  }

  scheduleCancelAtPeriodEnd(): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.base}/v1/subscriptions/schedule-cancel`, {});
  }

  undoScheduleCancelAtPeriodEnd(): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.base}/v1/subscriptions/undo-schedule-cancel`, {});
  }

  /** List users for the current tenant (tenant from auth context). */
  listUsers(): Observable<Array<{ id: string }>> {
    return this.http.get<Array<{ id: string }>>(`${this.base}/v1/users`);
  }
}
