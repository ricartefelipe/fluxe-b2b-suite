import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { AuthStore } from './auth.store';
import { sessionFromJwt } from './models/auth-session.model';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { TenantContextService } from '@saas-suite/shared/util';
import { OidcAuthService } from './oidc-auth.service';
import { SKIP_AUTH, SKIP_TENANT_HEADER } from '@saas-suite/shared/util';

const DEV_TOKEN_TIMEOUT_MS = 3_000;
/** Login com e-mail/senha no Core; não usar o timeout curto de dev (cold start, rede). */
const CREDENTIALS_LOGIN_TIMEOUT_MS = 30_000;

interface DevTokenRequest {
  sub: string;
  email?: string;
  tid?: string;
  roles?: string[];
  perms?: string[];
  plan?: string;
  region?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  must_change_password?: boolean;
}

function base64url(obj: object): string {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function createLocalDevJwt(params: DevTokenRequest): string {
  const header = { alg: 'none', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: params.sub,
    email: params.email ?? params.sub,
    tid: params.tid ?? null,
    roles: params.roles ?? [],
    perms: params.perms ?? [],
    plan: params.plan ?? 'starter',
    region: params.region ?? 'us-east-1',
    iat: now,
    exp: now + 86400,
  };
  return `${base64url(header)}.${base64url(payload)}.dev`;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly store = inject(AuthStore);
  private readonly config = inject(RuntimeConfigService);
  private readonly tenantCtx = inject(TenantContextService, { optional: true });
  private readonly oidcAuth = inject(OidcAuthService, { optional: true });
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  async loginWithDevToken(params: DevTokenRequest): Promise<void> {
    let token: string;

    if (this.config.get('authMode') === 'dev') {
      token = await this.tryBackendDevToken(params);
    } else {
      const baseUrl = this.config.get('coreApiBaseUrl');
      const ctx = new HttpContext()
        .set(SKIP_AUTH, true)
        .set(SKIP_TENANT_HEADER, true);
      const resp = await firstValueFrom(
        this.http.post<TokenResponse>(`${baseUrl}/v1/dev/token`, params, {
          context: ctx,
        }).pipe(timeout(DEV_TOKEN_TIMEOUT_MS))
      );
      token = resp.access_token;
    }

    const session = sessionFromJwt(token);
    this.store.setSession(session);
    if (session.tenantId && this.tenantCtx) {
      this.tenantCtx.setActiveTenantId(session.tenantId);
    }
    if (this.isBrowser) sessionStorage.setItem('dev_token', token);
    await this.router.navigate(['/']);
  }

  private async tryBackendDevToken(params: DevTokenRequest): Promise<string> {
    const coreUrl = this.config.get('coreApiBaseUrl');
    if (!coreUrl) {
      return createLocalDevJwt(params);
    }

    const ctx = new HttpContext()
      .set(SKIP_AUTH, true)
      .set(SKIP_TENANT_HEADER, true);
    const body = {
      sub: params.sub,
      tid: params.tid ?? '*',
      roles: params.roles ?? [],
      perms: params.perms ?? [],
      plan: params.plan ?? 'starter',
      region: params.region ?? 'us-east-1',
    };

    const resp = await firstValueFrom(
      this.http.post<TokenResponse>(`${coreUrl}/v1/dev/token`, body, { context: ctx }).pipe(
        timeout(DEV_TOKEN_TIMEOUT_MS),
        catchError(() => of(null)),
      )
    );

    return resp?.access_token ?? createLocalDevJwt(params);
  }

  async loginWithCredentials(email: string, password: string): Promise<void> {
    const baseUrl = this.config.get('coreApiBaseUrl');
    const ctx = new HttpContext()
      .set(SKIP_AUTH, true)
      .set(SKIP_TENANT_HEADER, true);

    const resp = await firstValueFrom(
      this.http.post<TokenResponse & { user?: Record<string, unknown> }>(
        `${baseUrl}/v1/auth/login`,
        { email, password },
        { context: ctx },
      ).pipe(timeout(CREDENTIALS_LOGIN_TIMEOUT_MS)),
    );

    const token = resp.access_token;
    const session = sessionFromJwt(token);
    this.store.setSession(session);
    if (session.tenantId && this.tenantCtx) {
      this.tenantCtx.setActiveTenantId(session.tenantId);
    }
    if (this.isBrowser) sessionStorage.setItem('dev_token', token);
    const mustChange =
      resp.must_change_password === true || session.mustChangePassword === true;
    if (mustChange) {
      await this.router.navigate(['/change-password']);
    } else {
      await this.router.navigate(['/']);
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const baseUrl = this.config.get('coreApiBaseUrl');
    const resp = await firstValueFrom(
      this.http
        .post<TokenResponse & { message?: string }>(`${baseUrl}/v1/auth/change-password`, {
          currentPassword,
          newPassword,
        })
        .pipe(timeout(10_000))
    );
    if (resp.access_token) {
      const session = sessionFromJwt(resp.access_token);
      this.store.setSession(session);
      if (session.tenantId && this.tenantCtx) {
        this.tenantCtx.setActiveTenantId(session.tenantId);
      }
      if (this.isBrowser) sessionStorage.setItem('dev_token', resp.access_token);
    }
    await this.router.navigate(['/']);
  }

  async restoreSession(): Promise<void> {
    if (this.config.get('authMode') === 'oidc' && this.oidcAuth) {
      await this.oidcAuth.configureAndTryLogin();
      return;
    }

    if (this.isBrowser) {
      const token = sessionStorage.getItem('dev_token');
      if (token) {
        const session = sessionFromJwt(token);
        if (Date.now() < session.expiresAt) {
          this.store.setSession(session);
          if (session.tenantId && this.tenantCtx) {
            this.tenantCtx.setActiveTenantId(session.tenantId);
          }
        } else {
          sessionStorage.removeItem('dev_token');
        }
      }
    }
  }

  async logout(): Promise<void> {
    if (this.config.get('authMode') === 'oidc' && this.oidcAuth) {
      this.oidcAuth.logout();
      return;
    }
    this.store.clearSession();
    if (this.tenantCtx) {
      this.tenantCtx.setActiveTenantId(null);
    }
    if (this.isBrowser) sessionStorage.removeItem('dev_token');
    await this.router.navigate(['/login']);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const baseUrl = this.config.get('coreApiBaseUrl');
    const ctx = new HttpContext()
      .set(SKIP_AUTH, true)
      .set(SKIP_TENANT_HEADER, true);
    try {
      await firstValueFrom(
        this.http
          .post(`${baseUrl}/v1/auth/password-reset/request`, { email }, { context: ctx })
          .pipe(timeout(15_000)),
      );
    } catch (e: unknown) {
      throw this.mapAuthHttpError(e, 'Não foi possível enviar o e-mail. Tente novamente.');
    }
  }

  async confirmPasswordReset(
    tokenId: string,
    token: string,
    newPassword: string,
  ): Promise<void> {
    const baseUrl = this.config.get('coreApiBaseUrl');
    const ctx = new HttpContext()
      .set(SKIP_AUTH, true)
      .set(SKIP_TENANT_HEADER, true);
    try {
      await firstValueFrom(
        this.http
          .post(
            `${baseUrl}/v1/auth/password-reset/confirm`,
            { tokenId, token, newPassword },
            { context: ctx },
          )
          .pipe(timeout(15_000)),
      );
    } catch (e: unknown) {
      throw this.mapAuthHttpError(
        e,
        'Link inválido ou expirado. Solicite um novo e-mail de recuperação.',
      );
    }
  }

  private mapAuthHttpError(err: unknown, fallback: string): Error {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      if (body && typeof body === 'object') {
        const detail = (body as Record<string, unknown>)['detail'];
        if (typeof detail === 'string' && detail.length > 0) {
          return new Error(detail);
        }
      }
      if (err.status === 0) {
        return new Error('Sem conexão. Verifique sua rede.');
      }
    }
    if (err instanceof Error) {
      return err;
    }
    return new Error(fallback);
  }
}
