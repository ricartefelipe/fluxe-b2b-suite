import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding, withPreloading, PreloadAllModules } from '@angular/router';
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
import { provideNotifications } from '@saas-suite/shared/notifications';
import { provideSearch } from '@saas-suite/shared/search';
import { provideAccessibility } from '@saas-suite/shared/ui';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    provideAnimationsAsync(),
    importProvidersFrom(OAuthModule.forRoot()),
    provideRouter(appRoutes, withComponentInputBinding(), withPreloading(PreloadAllModules)),
    provideRuntimeConfig(),
    provideHttpLayer(),
    provideAuth(),
    provideTelemetry(),
    provideTenancyContext(),
    { provide: MESSAGES, useValue: PT_BR_MESSAGES },
    provideNotifications(),
    provideSearch({ enabledEntities: ['order', 'payment', 'inventory'], maxResultsPerEntity: 5, debounceMs: 300 }),
    provideAccessibility(),
  ],
};
