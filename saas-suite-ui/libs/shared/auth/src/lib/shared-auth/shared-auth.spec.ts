import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthStore } from '../auth.store';
import {
  AuthSession,
  isExpired,
  parseJwtPayload,
  sessionFromJwt,
} from '../models/auth-session.model';

function makeJwtPayload(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${header}.${body}.sig`;
}

function validSession(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    accessToken: 'tok',
    userId: 'user1',
    email: 'a@b.com',
    tenantId: 'tid1',
    roles: ['admin'],
    permissions: ['tenant:read', 'tenant:write'],
    plan: 'starter',
    region: 'us-east-1',
    expiresAt: Date.now() + 600_000,
    ...overrides,
  };
}

// ---------- auth-session.model ----------

describe('auth-session model', () => {
  describe('isExpired', () => {
    it('returns false for a session expiring in the future', () => {
      const s = validSession({ expiresAt: Date.now() + 600_000 });
      expect(isExpired(s)).toBe(false);
    });

    it('returns true for a session that already expired', () => {
      const s = validSession({ expiresAt: Date.now() - 1000 });
      expect(isExpired(s)).toBe(true);
    });

    it('returns true when within the 30s safety margin', () => {
      const s = validSession({ expiresAt: Date.now() + 20_000 });
      expect(isExpired(s)).toBe(true);
    });
  });

  describe('parseJwtPayload', () => {
    it('extracts payload from a JWT-like token', () => {
      const token = makeJwtPayload({ sub: 'u1', email: 'x@y.com' });
      const payload = parseJwtPayload(token);
      expect(payload['sub']).toBe('u1');
      expect(payload['email']).toBe('x@y.com');
    });

    it('returns empty object for a malformed token', () => {
      expect(parseJwtPayload('not-a-jwt')).toEqual({});
    });

    it('returns empty object for empty string', () => {
      expect(parseJwtPayload('')).toEqual({});
    });
  });

  describe('sessionFromJwt', () => {
    it('maps standard claims to AuthSession fields', () => {
      const now = Math.floor(Date.now() / 1000) + 3600;
      const token = makeJwtPayload({
        sub: 'user-42',
        email: 'u@test.com',
        tid: 'tenant-a',
        roles: ['ops'],
        perms: ['flag:read'],
        plan: 'enterprise',
        region: 'eu-west-1',
        exp: now,
      });
      const session = sessionFromJwt(token);
      expect(session.userId).toBe('user-42');
      expect(session.email).toBe('u@test.com');
      expect(session.tenantId).toBe('tenant-a');
      expect(session.roles).toEqual(['ops']);
      expect(session.permissions).toEqual(['flag:read']);
      expect(session.plan).toBe('enterprise');
      expect(session.region).toBe('eu-west-1');
      expect(session.expiresAt).toBe(now * 1000);
      expect(session.accessToken).toBe(token);
    });

    it('falls back to preferred_username when email is absent', () => {
      const token = makeJwtPayload({
        sub: 'u',
        preferred_username: 'jdoe',
        exp: Math.floor(Date.now() / 1000) + 60,
      });
      expect(sessionFromJwt(token).email).toBe('jdoe');
    });

    it('falls back to sub when email and preferred_username are absent', () => {
      const token = makeJwtPayload({
        sub: 'uid',
        exp: Math.floor(Date.now() / 1000) + 60,
      });
      expect(sessionFromJwt(token).email).toBe('uid');
    });

    it('extracts roles from realm_access (Keycloak format)', () => {
      const token = makeJwtPayload({
        sub: 'u',
        realm_access: {
          roles: ['default-roles-realm', 'admin', 'viewer'],
        },
        exp: Math.floor(Date.now() / 1000) + 60,
      });
      const session = sessionFromJwt(token);
      expect(session.roles).toEqual(['admin', 'viewer']);
    });

    it('defaults to empty arrays and null for missing optional claims', () => {
      const token = makeJwtPayload({ sub: 'u', exp: 0 });
      const session = sessionFromJwt(token);
      expect(session.tenantId).toBeNull();
      expect(session.roles).toEqual([]);
      expect(session.permissions).toEqual([]);
      expect(session.plan).toBe('');
    });
  });
});

// ---------- AuthStore ----------

describe('AuthStore', () => {
  let store: AuthStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(AuthStore);
  });

  it('starts unauthenticated', () => {
    expect(store.isAuthenticated()).toBe(false);
    expect(store.session()).toBeNull();
    expect(store.accessToken()).toBeNull();
  });

  it('setSession makes the store authenticated', () => {
    store.setSession(validSession());
    expect(store.isAuthenticated()).toBe(true);
    expect(store.accessToken()).toBe('tok');
  });

  it('clearSession reverts to unauthenticated', () => {
    store.setSession(validSession());
    store.clearSession();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.session()).toBeNull();
  });

  it('is NOT authenticated when session is expired', () => {
    store.setSession(validSession({ expiresAt: Date.now() - 1000 }));
    expect(store.isAuthenticated()).toBe(false);
  });

  describe('hasPermission / hasRole / hasAnyPermission', () => {
    beforeEach(() => {
      store.setSession(
        validSession({
          permissions: ['tenant:read', 'tenant:write'],
          roles: ['admin', 'viewer'],
        }),
      );
    });

    it('hasPermission returns true for existing permission', () => {
      expect(store.hasPermission('tenant:read')).toBe(true);
    });

    it('hasPermission returns false for missing permission', () => {
      expect(store.hasPermission('audit:delete')).toBe(false);
    });

    it('hasRole returns true for existing role', () => {
      expect(store.hasRole('admin')).toBe(true);
    });

    it('hasRole returns false for missing role', () => {
      expect(store.hasRole('superadmin')).toBe(false);
    });

    it('hasAnyPermission returns true if at least one matches', () => {
      expect(store.hasAnyPermission(['audit:delete', 'tenant:read'])).toBe(true);
    });

    it('hasAnyPermission returns false if none matches', () => {
      expect(store.hasAnyPermission(['audit:delete', 'flag:write'])).toBe(false);
    });
  });

  it('permissions() and roles() default to empty arrays when cleared', () => {
    store.clearSession();
    expect(store.permissions()).toEqual([]);
    expect(store.roles()).toEqual([]);
  });
});

// ---------- authGuard ----------

function routerState(url: string): RouterStateSnapshot {
  return { url } as RouterStateSnapshot;
}

describe('authGuard', () => {
  const route = {} as ActivatedRouteSnapshot;

  it('returns true when authenticated', async () => {
    const { authGuard } = await import('../guards/auth.guard');
    const store = TestBed.inject(AuthStore);
    store.setSession(validSession());

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, routerState('/dashboard')),
    );
    expect(result).toBe(true);
  });

  it('returns UrlTree to /login when not authenticated', async () => {
    const { authGuard } = await import('../guards/auth.guard');
    const store = TestBed.inject(AuthStore);
    store.clearSession();

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, routerState('/dashboard')),
    );
    expect(result).not.toBe(true);
    expect(result.toString()).toBe('/login');
  });

  it('allows navigation to /change-password when mustChangePassword (uses target URL)', async () => {
    const { authGuard } = await import('../guards/auth.guard');
    const store = TestBed.inject(AuthStore);
    store.setSession(validSession({ mustChangePassword: true }));

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, routerState('/change-password')),
    );
    expect(result).toBe(true);
  });

  it('allows account/password when mustChangePassword', async () => {
    const { authGuard } = await import('../guards/auth.guard');
    const store = TestBed.inject(AuthStore);
    store.setSession(validSession({ mustChangePassword: true }));

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, routerState('/account/password')),
    );
    expect(result).toBe(true);
  });

  it('redirects to /change-password when mustChangePassword and target is elsewhere', async () => {
    const { authGuard } = await import('../guards/auth.guard');
    const store = TestBed.inject(AuthStore);
    store.setSession(validSession({ mustChangePassword: true }));

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, routerState('/tenants')),
    );
    expect(result).not.toBe(true);
    expect(result.toString()).toBe('/change-password');
  });
});

// ---------- permissionGuard ----------

describe('permissionGuard', () => {
  const state = {} as RouterStateSnapshot;

  it('returns true when no permissions are required', async () => {
    const { permissionGuard } = await import('../guards/permission.guard');
    const store = TestBed.inject(AuthStore);
    store.setSession(validSession());

    const route = { data: {} } as Pick<ActivatedRouteSnapshot, 'data'> as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(route, state),
    );
    expect(result).toBe(true);
  });

  it('returns true when user has at least one required permission', async () => {
    const { permissionGuard } = await import('../guards/permission.guard');
    const store = TestBed.inject(AuthStore);
    store.setSession(validSession({ permissions: ['tenant:read'] }));

    const route = {
      data: { permissions: ['tenant:read', 'tenant:write'] },
    } as Pick<ActivatedRouteSnapshot, 'data'> as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(route, state),
    );
    expect(result).toBe(true);
  });

  it('returns true when permissionsMode all and user has every permission', async () => {
    const { permissionGuard } = await import('../guards/permission.guard');
    const store = TestBed.inject(AuthStore);
    store.setSession(
      validSession({ permissions: ['orders:read', 'payments:read', 'inventory:read'] }),
    );

    const route = {
      data: {
        permissions: ['orders:read', 'payments:read', 'inventory:read'],
        permissionsMode: 'all',
      },
    } as Pick<ActivatedRouteSnapshot, 'data'> as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(route, state),
    );
    expect(result).toBe(true);
  });

  it('returns UrlTree to /403 when permissionsMode all and user lacks one permission', async () => {
    const { permissionGuard } = await import('../guards/permission.guard');
    const store = TestBed.inject(AuthStore);
    store.setSession(validSession({ permissions: ['orders:read', 'inventory:read'] }));

    const route = {
      data: {
        permissions: ['orders:read', 'payments:read', 'inventory:read'],
        permissionsMode: 'all',
      },
    } as Pick<ActivatedRouteSnapshot, 'data'> as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(route, state),
    );
    expect(result).not.toBe(true);
    expect(result.toString()).toBe('/403');
  });

  it('returns UrlTree to /403 when user lacks permissions', async () => {
    const { permissionGuard } = await import('../guards/permission.guard');
    const store = TestBed.inject(AuthStore);
    store.setSession(validSession({ permissions: [] }));

    const route = {
      data: { permissions: ['admin:super'] },
    } as Pick<ActivatedRouteSnapshot, 'data'> as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(route, state),
    );
    expect(result).not.toBe(true);
    expect(result.toString()).toBe('/403');
  });
});
