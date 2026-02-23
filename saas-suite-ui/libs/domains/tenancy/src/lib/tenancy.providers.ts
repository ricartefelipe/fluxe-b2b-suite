import { APP_INITIALIZER, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { TenantContextStore } from './tenant-context.store';

export function provideTenancyContext(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: APP_INITIALIZER,
      useFactory: (store: TenantContextStore) => () => store.loadTenants(),
      deps: [TenantContextStore],
      multi: true,
    },
  ]);
}
