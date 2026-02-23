import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { tenantInterceptor } from './interceptors/tenant.interceptor';
import { correlationInterceptor } from './interceptors/correlation.interceptor';
import { idempotencyInterceptor } from './interceptors/idempotency.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';

export function provideHttpLayer(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        tenantInterceptor,
        correlationInterceptor,
        idempotencyInterceptor,
        errorInterceptor,
      ]),
    ),
  ]);
}
