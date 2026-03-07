import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { CoreApiClient } from '../core-api.client';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import type { Tenant, CreateTenantRequest } from '../models/tenant.model';
import type { Policy, CreatePolicyRequest } from '../models/policy.model';
import type { FeatureFlag } from '../models/flag.model';
import type { AuditLog } from '../models/audit.model';
import type { PageResponse } from '@saas-suite/shared/http';

const BASE = 'http://localhost:8080';

function stubTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 'tid-1',
    name: 'Acme',
    slug: 'acme',
    plan: 'starter',
    region: 'us-east-1',
    status: 'ACTIVE',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function stubPolicy(overrides: Partial<Policy> = {}): Policy {
  return {
    id: 'pol-1',
    permissionCode: 'tenant:read',
    effect: 'ALLOW',
    enabled: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function pageOf<T>(items: T[]): PageResponse<T> {
  return { data: items, total: items.length, page: 0, pageSize: 20 };
}

describe('CoreApiClient', () => {
  let api: CoreApiClient;
  let httpCtrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(CoreApiClient);
    httpCtrl = TestBed.inject(HttpTestingController);
  });

  // ---------- Tenants ----------

  describe('tenants', () => {
    it('listTenants sends GET /v1/tenants', () => {
      const expected = pageOf([stubTenant()]);
      api.listTenants().subscribe((res) => {
        expect(res.data).toHaveLength(1);
        expect(res.data[0].name).toBe('Acme');
      });
      const req = httpCtrl.expectOne(`${BASE}/v1/tenants`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);
    });

    it('listTenants sends query params', () => {
      api.listTenants({ status: 'ACTIVE', page: 1, pageSize: 10 }).subscribe();
      const req = httpCtrl.expectOne((r) => r.url === `${BASE}/v1/tenants`);
      expect(req.request.params.get('status')).toBe('ACTIVE');
      expect(req.request.params.get('page')).toBe('1');
      req.flush(pageOf([]));
    });

    it('getTenant sends GET /v1/tenants/:id', () => {
      const t = stubTenant({ id: 'abc' });
      api.getTenant('abc').subscribe((res) => {
        expect(res.id).toBe('abc');
      });
      const req = httpCtrl.expectOne(`${BASE}/v1/tenants/abc`);
      expect(req.request.method).toBe('GET');
      req.flush(t);
    });

    it('createTenant sends POST /v1/tenants', () => {
      const body: CreateTenantRequest = {
        name: 'New',
        slug: 'new',
        plan: 'professional',
        region: 'eu-west-1',
      };
      api.createTenant(body).subscribe((res) => {
        expect(res.name).toBe('New');
      });
      const req = httpCtrl.expectOne(`${BASE}/v1/tenants`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(stubTenant({ name: 'New', slug: 'new' }));
    });

    it('updateTenant sends PATCH /v1/tenants/:id', () => {
      api.updateTenant('tid-1', { name: 'Updated' }).subscribe((res) => {
        expect(res.name).toBe('Updated');
      });
      const req = httpCtrl.expectOne(`${BASE}/v1/tenants/tid-1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ name: 'Updated' });
      req.flush(stubTenant({ name: 'Updated' }));
    });

    it('deleteTenant sends DELETE /v1/tenants/:id', () => {
      api.deleteTenant('tid-1').subscribe();
      const req = httpCtrl.expectOne(`${BASE}/v1/tenants/tid-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // ---------- Policies ----------

  describe('policies', () => {
    it('listPolicies sends GET /v1/policies', () => {
      api.listPolicies().subscribe((res) => {
        expect(res.data).toHaveLength(1);
      });
      const req = httpCtrl.expectOne(`${BASE}/v1/policies`);
      expect(req.request.method).toBe('GET');
      req.flush(pageOf([stubPolicy()]));
    });

    it('getPolicy sends GET /v1/policies/:id', () => {
      api.getPolicy('pol-1').subscribe((res) => {
        expect(res.permissionCode).toBe('tenant:read');
      });
      httpCtrl.expectOne(`${BASE}/v1/policies/pol-1`).flush(stubPolicy());
    });

    it('createPolicy sends POST /v1/policies', () => {
      const body: CreatePolicyRequest = {
        permissionCode: 'flag:write',
        effect: 'DENY',
      };
      api.createPolicy(body).subscribe();
      const req = httpCtrl.expectOne(`${BASE}/v1/policies`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(stubPolicy({ permissionCode: 'flag:write', effect: 'DENY' }));
    });

    it('deletePolicy sends DELETE /v1/policies/:id', () => {
      api.deletePolicy('pol-1').subscribe();
      const req = httpCtrl.expectOne(`${BASE}/v1/policies/pol-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // ---------- Feature Flags ----------

  describe('flags', () => {
    const flag: FeatureFlag = {
      id: 'f1',
      tenantId: 't1',
      name: 'dark-mode',
      enabled: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    it('listFlags sends GET /v1/tenants/:tid/flags', () => {
      api.listFlags('t1').subscribe((res) => {
        expect(res).toHaveLength(1);
        expect(res[0].name).toBe('dark-mode');
      });
      httpCtrl.expectOne(`${BASE}/v1/tenants/t1/flags`).flush([flag]);
    });

    it('createFlag sends POST /v1/tenants/:tid/flags', () => {
      api.createFlag('t1', { name: 'beta', enabled: false }).subscribe();
      const req = httpCtrl.expectOne(`${BASE}/v1/tenants/t1/flags`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.name).toBe('beta');
      req.flush({ ...flag, name: 'beta', enabled: false });
    });

    it('updateFlag sends PATCH /v1/tenants/:tid/flags/:name', () => {
      api.updateFlag('t1', 'dark-mode', { enabled: false }).subscribe();
      const req = httpCtrl.expectOne(`${BASE}/v1/tenants/t1/flags/dark-mode`);
      expect(req.request.method).toBe('PATCH');
      req.flush({ ...flag, enabled: false });
    });

    it('deleteFlag sends DELETE /v1/tenants/:tid/flags/:name', () => {
      api.deleteFlag('t1', 'dark-mode').subscribe();
      const req = httpCtrl.expectOne(`${BASE}/v1/tenants/t1/flags/dark-mode`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // ---------- Audit Logs ----------

  describe('audit', () => {
    const auditEntry: AuditLog = {
      id: 'a1',
      action: 'TENANT_CREATED',
      outcome: 'SUCCESS',
      createdAt: '2025-01-01T00:00:00Z',
    };

    it('listAuditLogs sends GET /v1/audit', () => {
      api.listAuditLogs().subscribe((res) => {
        expect(res.data).toHaveLength(1);
      });
      httpCtrl.expectOne(`${BASE}/v1/audit`).flush(pageOf([auditEntry]));
    });

    it('passes query params for audit filtering', () => {
      api
        .listAuditLogs({ action: 'TENANT_CREATED', outcome: 'SUCCESS', page: 0 })
        .subscribe();
      const req = httpCtrl.expectOne((r) => r.url === `${BASE}/v1/audit`);
      expect(req.request.params.get('action')).toBe('TENANT_CREATED');
      expect(req.request.params.get('outcome')).toBe('SUCCESS');
      req.flush(pageOf([]));
    });
  });
});
