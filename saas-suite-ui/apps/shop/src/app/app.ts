import { Component, ChangeDetectionStrategy, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CartService } from '@union.solutions/shop/data';
import { ThemeToggleComponent } from '@saas-suite/shared/ui';
import { LanguageSwitcherComponent } from '@saas-suite/shared/ui';
import { OfflineIndicatorComponent, InstallPromptComponent } from '@union.solutions/shop/pwa';

@Component({
  imports: [
    RouterModule, MatBadgeModule, MatIconModule, MatButtonModule,
    ThemeToggleComponent, LanguageSwitcherComponent,
    OfflineIndicatorComponent, InstallPromptComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  protected readonly title = 'Fluxe B2B Suite';
  protected readonly cart = inject(CartService);

  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    this.titleService.setTitle('Fluxe B2B Suite – Shop');

    this.meta.addTags([
      { name: 'description', content: 'Fluxe B2B Suite – Multi-tenant B2B e-commerce platform' },
      { name: 'theme-color', content: '#1976d2' },
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
