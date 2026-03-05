import {
  ApplicationConfig,
  ErrorHandler,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  importProvidersFrom,
} from '@angular/core';
import {
  provideRouter,
  withPreloading,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { OAuthModule } from 'angular-oauth2-oidc';
import { appRoutes } from './app.routes';
import { provideRuntimeConfig } from '@saas-suite/shared/config';
import { provideAuth } from '@saas-suite/shared/auth';
import { provideHttpLayer } from '@saas-suite/shared/http';
import { SelectivePreloadStrategy, providePerformanceMonitoring } from '@union.solutions/shop/performance';
import { MESSAGES, PT_BR_MESSAGES } from '@saas-suite/shared/i18n';
import { GlobalErrorHandler } from '@saas-suite/shared/util';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    importProvidersFrom(OAuthModule.forRoot()),
    provideRouter(
      appRoutes,
      withPreloading(SelectivePreloadStrategy),
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    provideRuntimeConfig(),
    provideHttpLayer(),
    provideAuth(),
    providePerformanceMonitoring(),
    { provide: MESSAGES, useValue: PT_BR_MESSAGES },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
