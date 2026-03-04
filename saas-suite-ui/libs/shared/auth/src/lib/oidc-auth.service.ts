import { Injectable, inject, NgZone, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OAuthService, OAuthErrorEvent } from 'angular-oauth2-oidc';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthStore } from './auth.store';
import { sessionFromJwt } from './models/auth-session.model';
import { RuntimeConfigService } from '@saas-suite/shared/config';
// eslint-disable-next-line @nx/enforce-module-boundaries -- circular with shared-http (see auth.service)
import { TenantContextService } from '@saas-suite/shared/http';

@Injectable({ providedIn: 'root' })
export class OidcAuthService implements OnDestroy {
  private readonly oauth = inject(OAuthService);
  private readonly store = inject(AuthStore);
  private readonly config = inject(RuntimeConfigService);
  private readonly tenantCtx = inject(TenantContextService, { optional: true });
  private readonly zone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private eventsSub: Subscription | null = null;

  private get origin(): string {
    return this.isBrowser ? window.location.origin : '';
  }

  async configureAndTryLogin(): Promise<boolean> {
    const oidc = this.config.get('oidc');
    if (!oidc) {
      return false;
    }

    this.oauth.configure({
      issuer: oidc.issuer,
      clientId: oidc.clientId,
      scope: oidc.scope ?? 'openid profile email',
      redirectUri: this.origin + '/',
      postLogoutRedirectUri: this.origin + '/login',
      responseType: 'code',
      useSilentRefresh: true,
      silentRefreshRedirectUri: this.origin + '/silent-refresh.html',
      showDebugInformation: this.config.get('logLevel') === 'debug',
      sessionChecksEnabled: true,
      timeoutFactor: 0.75,
    });

    this.subscribeToTokenEvents();

    await this.oauth.loadDiscoveryDocumentAndTryLogin();

    if (this.oauth.hasValidAccessToken()) {
      this.applySession();
      this.oauth.setupAutomaticSilentRefresh();
      return true;
    }

    return false;
  }

  initLoginFlow(): void {
    this.oauth.initCodeFlow();
  }

  logout(): void {
    const postLogoutUrl = this.origin + '/login';
    this.store.clearSession();
    if (this.tenantCtx) {
      this.tenantCtx.setActiveTenantId(null);
    }
    this.oauth.logOut({ postLogoutRedirectUri: postLogoutUrl });
  }

  refreshToken(): Promise<object> {
    return this.oauth.refreshToken();
  }

  ngOnDestroy(): void {
    this.eventsSub?.unsubscribe();
  }

  private applySession(): void {
    const token = this.oauth.getAccessToken();
    if (!token) {
      return;
    }
    const session = sessionFromJwt(token);
    this.store.setSession(session);
    if (session.tenantId && this.tenantCtx) {
      this.tenantCtx.setActiveTenantId(session.tenantId);
    }
  }

  private subscribeToTokenEvents(): void {
    this.eventsSub?.unsubscribe();

    this.eventsSub = this.oauth.events
      .pipe(filter((e) => e.type === 'token_received' || e.type === 'token_refreshed'))
      .subscribe(() => {
        this.zone.run(() => this.applySession());
      });

    this.oauth.events
      .pipe(filter((e): e is OAuthErrorEvent => e.type === 'token_refresh_error'))
      .subscribe(() => {
        this.zone.run(() => {
          this.store.clearSession();
          if (this.tenantCtx) {
            this.tenantCtx.setActiveTenantId(null);
          }
        });
      });
  }
}
