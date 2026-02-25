import { APP_INITIALIZER, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AuthService } from './auth.service';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { OidcAuthService } from './oidc-auth.service';

export function provideAuth(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService, config: RuntimeConfigService, oidcAuth: OidcAuthService) =>
        () => authInitializer(auth, config, oidcAuth),
      deps: [AuthService, RuntimeConfigService, OidcAuthService],
      multi: true,
    },
  ]);
}

async function authInitializer(
  auth: AuthService,
  config: RuntimeConfigService,
  oidcAuth: OidcAuthService
): Promise<void> {
  await config.load();
  if (config.get('authMode') === 'oidc') {
    await oidcAuth.configureAndTryLogin();
  } else {
    await auth.restoreSession();
  }
}
