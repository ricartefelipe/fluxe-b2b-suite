import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { OAuthModule } from 'angular-oauth2-oidc';
import { appRoutes } from './app.routes';
import { provideRuntimeConfig } from '@saas-suite/shared/config';
import { provideAuth } from '@saas-suite/shared/auth';
import { provideHttpLayer } from '@saas-suite/shared/http';
import { provideTelemetry } from '@saas-suite/shared/telemetry';
import { provideTenancyContext } from '@saas-suite/domains/tenancy';
import { MESSAGES } from '@saas-suite/shared/i18n';
import { PT_BR_MESSAGES } from '@saas-suite/shared/i18n';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    importProvidersFrom(OAuthModule.forRoot()),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideRuntimeConfig(),
    provideHttpLayer(),
    provideAuth(),
    provideTelemetry(),
    provideTenancyContext(),
    { provide: MESSAGES, useValue: PT_BR_MESSAGES },
  ],
};
