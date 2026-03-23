import { Component, OnInit, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { DevLoginComponent } from './dev-auth/dev-login.component';
import { OidcAuthService } from './oidc-auth.service';

@Component({
  selector: 'lib-login-page',
  standalone: true,
  imports: [DevLoginComponent, MatProgressSpinnerModule],
  template: `
    @if (showLoginForm) {
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

  showLoginForm = true;

  ngOnInit(): void {
    const mode = this.config.get('authMode') as string;

    this.showLoginForm = mode === 'dev' || mode === 'hs256';

    if (!this.showLoginForm && this.oidcAuth) {
      this.oidcAuth.initLoginFlow();
    }
  }
}
