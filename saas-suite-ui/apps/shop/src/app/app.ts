import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { CookieBannerComponent } from '@saas-suite/shared/ui';

@Component({
  imports: [RouterModule, CookieBannerComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    this.titleService.setTitle('Fluxe B2B Suite – Shop');

    this.meta.addTags([
      { name: 'description', content: 'Fluxe B2B Suite – Multi-tenant B2B e-commerce platform' },
      { name: 'theme-color', content: '#1565c0' },
      { property: 'og:title', content: 'Fluxe B2B Suite – Shop' },
      { property: 'og:description', content: 'Multi-tenant B2B e-commerce platform' },
      { property: 'og:type', content: 'website' },
    ]);

    if (isPlatformBrowser(this.platformId)) {
      this.prefetchCriticalResources();
    }
  }

  private prefetchCriticalResources(): void {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = window.location.origin;
    document.head.appendChild(link);
  }
}
