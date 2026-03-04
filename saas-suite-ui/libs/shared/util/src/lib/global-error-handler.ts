import { ErrorHandler, Injectable, NgZone, inject } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly zone = inject(NgZone);

  handleError(error: unknown): void {
    const err = error instanceof Error ? error : new Error(String(error));

    this.zone.runOutsideAngular(() => {
      console.error('[GlobalErrorHandler]', err.message, err);
    });
  }
}
