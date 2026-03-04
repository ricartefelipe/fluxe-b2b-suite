import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SelectivePreloadStrategy implements PreloadingStrategy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (route.data?.['preload']) {
      return load();
    }

    if (!this.isBrowser || typeof requestIdleCallback === 'undefined') {
      return load();
    }

    return new Observable(subscriber => {
      const id = requestIdleCallback(
        () => {
          load().subscribe(subscriber);
        },
        { timeout: 3000 }
      );
      return () => cancelIdleCallback(id);
    });
  }
}
