import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { TenantContextStore } from './tenant-context.store';

export function provideTenancyContext(): EnvironmentProviders {
  return makeEnvironmentProviders([TenantContextStore]);
}
