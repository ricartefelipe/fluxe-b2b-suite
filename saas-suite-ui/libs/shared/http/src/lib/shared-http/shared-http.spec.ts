import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpContext,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AuthStore } from '@saas-suite/shared/auth';
import {
  SKIP_AUTH,
  SKIP_TENANT_HEADER,
  IDEMPOTENCY_KEY,
  CORRELATION_SCOPE,
} from '@saas-suite/shared/util';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { tenantInterceptor } from '../interceptors/tenant.interceptor';
import { correlationInterceptor } from '../interceptors/correlation.interceptor';
import { idempotencyInterceptor } from '../interceptors/idempotency.interceptor';
import { TenantContextService } from '@saas-suite/shared/util';
import { CorrelationContextService } from '../services/correlation-context.service';

// ---------- authInterceptor ----------

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpCtrl: HttpTestingController;
  let store: AuthStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpCtrl = TestBed.inject(HttpTestingController);
    store = TestBed.inject(AuthStore);
  });

  it('adds Authorization header when token is present', () => {
    store.setSession({
      accessToken: 'my-jwt',
      userId: 'u',
      email: 'e',
      tenantId: null,
      roles: [],
      permissions: [],
      plan: '',
      region: '',
      expiresAt: Date.now() + 600_000,
    });
    http.get('/api/test').subscribe();
    const req = httpCtrl.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt');
  });

  it('does not add Authorization header when no session', () => {
    http.get('/api/test').subscribe();
    const req = httpCtrl.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
  });

  it('skips auth header when SKIP_AUTH is set', () => {
    store.setSession({
      accessToken: 'tok',
      userId: 'u',
      email: 'e',
      tenantId: null,
      roles: [],
      permissions: [],
      plan: '',
      region: '',
      expiresAt: Date.now() + 600_000,
    });
    const ctx = new HttpContext().set(SKIP_AUTH, true);
    http.get('/api/public', { context: ctx }).subscribe();
    const req = httpCtrl.expectOne('/api/public');
    expect(req.request.headers.has('Authorization')).toBe(false);
  });
});

// ---------- tenantInterceptor ----------

describe('tenantInterceptor', () => {
  let http: HttpClient;
  let httpCtrl: HttpTestingController;
  let tenantCtx: TenantContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([tenantInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpCtrl = TestBed.inject(HttpTestingController);
    tenantCtx = TestBed.inject(TenantContextService);
  });

  it('adds X-Tenant-Id header when tenant is active', () => {
    tenantCtx.setActiveTenantId('t-abc');
    http.get('/api/data').subscribe();
    const req = httpCtrl.expectOne('/api/data');
    expect(req.request.headers.get('X-Tenant-Id')).toBe('t-abc');
  });

  it('does not add X-Tenant-Id when no active tenant', () => {
    tenantCtx.setActiveTenantId(null);
    http.get('/api/data').subscribe();
    const req = httpCtrl.expectOne('/api/data');
    expect(req.request.headers.has('X-Tenant-Id')).toBe(false);
  });

  it('skips tenant header when SKIP_TENANT_HEADER is set', () => {
    tenantCtx.setActiveTenantId('t-abc');
    const ctx = new HttpContext().set(SKIP_TENANT_HEADER, true);
    http.get('/api/login', { context: ctx }).subscribe();
    const req = httpCtrl.expectOne('/api/login');
    expect(req.request.headers.has('X-Tenant-Id')).toBe(false);
  });
});

// ---------- correlationInterceptor ----------

describe('correlationInterceptor', () => {
  let http: HttpClient;
  let httpCtrl: HttpTestingController;
  let corrCtx: CorrelationContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([correlationInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpCtrl = TestBed.inject(HttpTestingController);
    corrCtx = TestBed.inject(CorrelationContextService);
  });

  it('always sets X-Correlation-Id header', () => {
    http.get('/api/x').subscribe();
    const req = httpCtrl.expectOne('/api/x');
    expect(req.request.headers.has('X-Correlation-Id')).toBe(true);
    expect((req.request.headers.get('X-Correlation-Id') ?? '').length).toBeGreaterThan(0);
  });

  it('uses the active scope from CorrelationContextService', () => {
    const scopeId = corrCtx.openScope();
    http.get('/api/y').subscribe();
    const req = httpCtrl.expectOne('/api/y');
    expect(req.request.headers.get('X-Correlation-Id')).toBe(scopeId);
    corrCtx.closeScope();
  });

  it('uses CORRELATION_SCOPE context override when set', () => {
    const ctx = new HttpContext().set(CORRELATION_SCOPE, 'override-id');
    http.get('/api/z', { context: ctx }).subscribe();
    const req = httpCtrl.expectOne('/api/z');
    expect(req.request.headers.get('X-Correlation-Id')).toBe('override-id');
  });
});

// ---------- idempotencyInterceptor ----------

describe('idempotencyInterceptor', () => {
  let http: HttpClient;
  let httpCtrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([idempotencyInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpCtrl = TestBed.inject(HttpTestingController);
  });

  it('adds Idempotency-Key header for POST requests', () => {
    http.post('/api/items', {}).subscribe();
    const req = httpCtrl.expectOne('/api/items');
    expect(req.request.headers.has('Idempotency-Key')).toBe(true);
    expect(req.request.headers.get('Idempotency-Key')).toMatch(/^req-/);
  });

  it('adds Idempotency-Key for PATCH requests', () => {
    http.patch('/api/items/1', {}).subscribe();
    const req = httpCtrl.expectOne('/api/items/1');
    expect(req.request.headers.has('Idempotency-Key')).toBe(true);
  });

  it('adds Idempotency-Key for DELETE requests', () => {
    http.delete('/api/items/1').subscribe();
    const req = httpCtrl.expectOne('/api/items/1');
    expect(req.request.headers.has('Idempotency-Key')).toBe(true);
  });

  it('does NOT add Idempotency-Key for GET requests', () => {
    http.get('/api/items').subscribe();
    const req = httpCtrl.expectOne('/api/items');
    expect(req.request.headers.has('Idempotency-Key')).toBe(false);
  });

  it('uses explicit IDEMPOTENCY_KEY from context', () => {
    const ctx = new HttpContext().set(IDEMPOTENCY_KEY, 'custom-key-123');
    http.post('/api/items', {}, { context: ctx }).subscribe();
    const req = httpCtrl.expectOne('/api/items');
    expect(req.request.headers.get('Idempotency-Key')).toBe('custom-key-123');
  });
});

// ---------- TenantContextService ----------

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TenantContextService);
  });

  it('starts with null tenant id', () => {
    expect(service.getActiveTenantId()).toBeNull();
  });

  it('stores and retrieves tenant id', () => {
    service.setActiveTenantId('t-1');
    expect(service.getActiveTenantId()).toBe('t-1');
  });

  it('can be cleared back to null', () => {
    service.setActiveTenantId('t-1');
    service.setActiveTenantId(null);
    expect(service.getActiveTenantId()).toBeNull();
  });
});

// ---------- CorrelationContextService ----------

describe('CorrelationContextService', () => {
  let service: CorrelationContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CorrelationContextService);
  });

  it('starts with no scope', () => {
    expect(service.getCurrentScope()).toBeNull();
  });

  it('openScope returns a UUID-like string', () => {
    const id = service.openScope();
    expect(id).toBeTruthy();
    expect(id.length).toBeGreaterThan(8);
  });

  it('closeScope clears the current scope', () => {
    service.openScope();
    service.closeScope();
    expect(service.getCurrentScope()).toBeNull();
  });

  it('withScope sets scope during callback and clears after', async () => {
    let captured: string | null = null;
    await service.withScope(async () => {
      captured = service.getCurrentScope();
    });
    expect(captured).toBeTruthy();
    expect(service.getCurrentScope()).toBeNull();
  });

  it('withScope clears scope even if callback throws', async () => {
    try {
      await service.withScope(async () => {
        throw new Error('boom');
      });
    } catch {
      // expected
    }
    expect(service.getCurrentScope()).toBeNull();
  });
});

// ---------- isProblemDetails ----------

import { isProblemDetails } from '../models/problem-details.model';

describe('isProblemDetails', () => {
  it('returns true for object with status field', () => {
    expect(isProblemDetails({ status: 404, title: 'Not Found' })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isProblemDetails(null)).toBe(false);
  });

  it('returns false for a string', () => {
    expect(isProblemDetails('error')).toBe(false);
  });

  it('returns false for object without status', () => {
    expect(isProblemDetails({ error: 'oops' })).toBe(false);
  });
});
