import { APP_INITIALIZER, EnvironmentProviders, Provider, inject, makeEnvironmentProviders } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { LiveAnnouncerService } from './live-announcer.service';

function accessibilityInitializerFactory(): () => void {
  const router = inject(Router);
  const title = inject(Title);
  const announcer = inject(LiveAnnouncerService);

  return () => {
    router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        const pageTitle = title.getTitle() || 'Page';
        announcer.announcePageChange(pageTitle);
      });
  };
}

export function provideAccessibility(): EnvironmentProviders {
  const providers: Provider[] = [
    {
      provide: APP_INITIALIZER,
      useFactory: accessibilityInitializerFactory,
      multi: true,
    },
  ];

  return makeEnvironmentProviders(providers);
}
