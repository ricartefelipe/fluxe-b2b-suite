import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from './auth.store';
import { sessionFromJwt } from './models/auth-session.model';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { SKIP_AUTH, SKIP_TENANT_HEADER } from '@saas-suite/shared/util';

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
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly store = inject(AuthStore);
  private readonly config = inject(RuntimeConfigService);

  async loginWithDevToken(params: DevTokenRequest): Promise<void> {
    const baseUrl = this.config.get('coreApiBaseUrl');
    const ctx = new HttpContext()
      .set(SKIP_AUTH, true)
      .set(SKIP_TENANT_HEADER, true);
    const resp = await firstValueFrom(
      this.http.post<TokenResponse>(`${baseUrl}/v1/dev/token`, params, { context: ctx })
    );
    const session = sessionFromJwt(resp.access_token);
    this.store.setSession(session);
    sessionStorage.setItem('dev_token', resp.access_token);
    await this.router.navigate(['/']);
  }

  async restoreSession(): Promise<void> {
    const token = sessionStorage.getItem('dev_token');
    if (token) {
      const session = sessionFromJwt(token);
      if (Date.now() < session.expiresAt) {
        this.store.setSession(session);
      } else {
        sessionStorage.removeItem('dev_token');
      }
    }
  }

  async logout(): Promise<void> {
    this.store.clearSession();
    sessionStorage.removeItem('dev_token');
    await this.router.navigate(['/login']);
  }
}
