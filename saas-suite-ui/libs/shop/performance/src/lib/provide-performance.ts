import {
  APP_INITIALIZER,
  EnvironmentProviders,
  makeEnvironmentProviders,
} from '@angular/core';
import { WebVitalsTracker } from './web-vitals-tracker';

export function providePerformanceMonitoring(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: APP_INITIALIZER,
      useFactory: (tracker: WebVitalsTracker) => () => tracker.init(),
      deps: [WebVitalsTracker],
      multi: true,
    },
  ]);
}
