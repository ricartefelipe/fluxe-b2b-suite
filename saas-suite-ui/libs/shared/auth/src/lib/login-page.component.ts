import { Component, OnInit, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { I18nService } from '@saas-suite/shared/i18n';
import { DevLoginComponent } from './dev-auth/dev-login.component';
import { OidcAuthService } from './oidc-auth.service';

@Component({
  selector: 'lib-login-page',
  standalone: true,
  imports: [DevLoginComponent, MatProgressSpinnerModule, MatIconModule],
  template: `
    @if (showLoginForm) {
      <lib-dev-login />
    } @else {
      <div class="auth-premium auth-premium--oidc">
        <div class="oidc-card">
          <div class="flow-icon" aria-hidden="true">
            <mat-icon>verified_user</mat-icon>
          </div>
          <mat-spinner diameter="40" />
          <p>{{ i18n.messages().auth.oidcRedirecting }}</p>
        </div>
      </div>
    }
  `,
  styleUrls: ['./styles/auth-premium.scss'],
})
export class LoginPageComponent implements OnInit {
  private readonly config = inject(RuntimeConfigService);
  private readonly oidcAuth = inject(OidcAuthService, { optional: true });
  protected readonly i18n = inject(I18nService);

  showLoginForm = true;

  ngOnInit(): void {
    const mode = this.config.get('authMode') as string;

    this.showLoginForm = mode === 'dev' || mode === 'hs256';

    if (!this.showLoginForm && this.oidcAuth) {
      this.oidcAuth.initLoginFlow();
    }
  }
}
