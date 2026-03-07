import { Component, OnInit, inject, isDevMode } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { DevLoginComponent } from './dev-auth/dev-login.component';
import { OidcAuthService } from './oidc-auth.service';

@Component({
  selector: 'lib-login-page',
  standalone: true,
  imports: [DevLoginComponent, MatProgressSpinnerModule],
  template: `
    @if (authMode === 'dev') {
      <lib-dev-login />
    } @else {
      <div class="oidc-loading">
        <mat-spinner diameter="36" />
        <p>Redirecting to identity provider&hellip;</p>
      </div>
    }
  `,
  styles: [
    `
      .oidc-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        min-height: 100vh;
        background: #f4f6f9;
      }
      .oidc-loading p {
        color: #78909c;
        font-size: 16px;
      }
    `,
  ],
})
export class LoginPageComponent implements OnInit {
  private readonly config = inject(RuntimeConfigService);
  private readonly oidcAuth = inject(OidcAuthService, { optional: true });

  authMode: 'dev' | 'oidc' = 'dev';

  ngOnInit(): void {
    this.authMode = this.config.get('authMode');

    if (this.authMode === 'dev' && !isDevMode()) {
      console.error('[Auth] Dev auth disabled in production mode — forcing OIDC redirect.');
      this.authMode = 'oidc';
    }

    if (this.authMode === 'oidc' && this.oidcAuth) {
      this.oidcAuth.initLoginFlow();
    }
  }
}
