import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, EMPTY } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SelectivePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (route.data?.['preload']) {
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
