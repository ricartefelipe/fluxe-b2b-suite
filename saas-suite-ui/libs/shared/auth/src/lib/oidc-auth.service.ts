import { Injectable, inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { AuthStore } from './auth.store';
import { sessionFromJwt } from './models/auth-session.model';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { TenantContextService } from '@saas-suite/shared/http';

@Injectable({ providedIn: 'root' })
export class OidcAuthService {
  private readonly oauth = inject(OAuthService);
  private readonly store = inject(AuthStore);
  private readonly config = inject(RuntimeConfigService);
  private readonly tenantCtx = inject(TenantContextService, { optional: true });

  async configureAndTryLogin(): Promise<boolean> {
    const oidc = this.config.get('oidc');
    if (!oidc) {
      return false;
    }
    this.oauth.configure({
      issuer: oidc.issuer,
      clientId: oidc.clientId,
      scope: oidc.scope ?? 'openid profile email',
      redirectUri: window.location.origin + '/',
      responseType: 'code',
      showDebugInformation: this.config.get('logLevel') === 'debug',
    });
    await this.oauth.loadDiscoveryDocumentAndTryLogin();
    if (this.oauth.hasValidAccessToken()) {
      const token = this.oauth.getAccessToken();
      if (token) {
        const session = sessionFromJwt(token);
        this.store.setSession(session);
        if (session.tenantId && this.tenantCtx) {
          this.tenantCtx.setActiveTenantId(session.tenantId);
        }
      }
      return true;
    }
    return false;
  }

  initLoginFlow(): void {
    this.oauth.initCodeFlow();
  }

  logout(): void {
    this.oauth.logOut();
    this.store.clearSession();
    if (this.tenantCtx) {
      this.tenantCtx.setActiveTenantId(null);
    }
  }
}
