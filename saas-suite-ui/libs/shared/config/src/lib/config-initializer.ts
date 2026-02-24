import { APP_INITIALIZER, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { RuntimeConfigService } from './runtime-config.service';

export function provideRuntimeConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: APP_INITIALIZER,
      useFactory: (cfg: RuntimeConfigService) => () => cfg.load().catch(() => {}),
      deps: [RuntimeConfigService],
      multi: true,
    },
  ]);
}
