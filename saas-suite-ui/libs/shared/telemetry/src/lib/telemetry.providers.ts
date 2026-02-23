import { APP_INITIALIZER, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { WebVitalsService } from './web-vitals.service';

export function provideTelemetry(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: APP_INITIALIZER,
      useFactory: (wv: WebVitalsService) => () => wv.init(),
      deps: [WebVitalsService],
      multi: true,
    },
  ]);
}
