import { ErrorHandler, Injectable, NgZone, inject } from '@angular/core';
import { captureClientError } from '@saas-suite/shared/telemetry';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly zone = inject(NgZone);

  handleError(error: unknown): void {
    const err = error instanceof Error ? error : new Error(String(error));

    this.zone.runOutsideAngular(() => {
      console.error('[GlobalErrorHandler]', err.message, err);
      captureClientError(err);
    });
  }
}
