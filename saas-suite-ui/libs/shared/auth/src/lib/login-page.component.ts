import { Component, OnInit, inject } from '@angular/core';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { DevLoginComponent } from './dev-auth/dev-login.component';
import { OidcAuthService } from './oidc-auth.service';

@Component({
  selector: 'saas-login-page',
  standalone: true,
  imports: [DevLoginComponent],
  template: `
    @if (authMode === 'dev') {
      <saas-dev-login />
    } @else {
      <div class="oidc-loading">
        <p>Redirecionando para login...</p>
      </div>
    }
  `,
  styles: [
    `
      .oidc-loading {
        display: flex;
        align-items: center;
        justify-content: center;
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
    if (this.authMode === 'oidc' && this.oidcAuth) {
      this.oidcAuth.initLoginFlow();
    }
  }
}
