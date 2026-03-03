import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
  HostListener,
} from '@angular/core';
import { isPlatformBrowser, CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CartService } from '@union.solutions/shop/data';
import { ThemeToggleComponent, LanguageSwitcherComponent } from '@saas-suite/shared/ui';
import { OfflineIndicatorComponent, InstallPromptComponent } from '@union.solutions/shop/pwa';
import { NotificationStore } from '@saas-suite/shared/notifications';
import { AuthStore } from '@saas-suite/shared/auth';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  imports: [
    RouterModule,
    CurrencyPipe,
    MatBadgeModule,
    MatIconModule,
    MatButtonModule,
    ThemeToggleComponent,
    LanguageSwitcherComponent,
    OfflineIndicatorComponent,
    InstallPromptComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  protected readonly cart = inject(CartService);
  protected readonly notifications = inject(NotificationStore);
  protected readonly auth = inject(AuthStore);
  protected readonly i18n = inject(I18nService);
  protected readonly router = inject(Router);

  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly minicartOpen = signal(false);
  protected readonly mobileMenuOpen = signal(false);
  protected readonly mobileSearchOpen = signal(false);

  protected get userName(): string {
    const session = this.auth.session();
    if (session?.email) {
      const name = session.email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return '';
  }

  protected get userInitial(): string {
    const name = this.userName;
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

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

  toggleMinicart(): void {
    this.minicartOpen.update(v => !v);
  }

  closeMinicart(): void {
    this.minicartOpen.set(false);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
    if (this.mobileMenuOpen()) {
      this.mobileSearchOpen.set(false);
    }
  }

  toggleMobileSearch(): void {
    this.mobileSearchOpen.update(v => !v);
    if (this.mobileSearchOpen()) {
      this.mobileMenuOpen.set(false);
    }
  }

  incrementQty(item: { product: { id: string }; quantity: number }): void {
    this.cart.updateQuantity(item.product.id, item.quantity + 1);
  }

  decrementQty(item: { product: { id: string }; quantity: number }): void {
    this.cart.updateQuantity(item.product.id, item.quantity - 1);
  }

  goToCheckout(): void {
    this.closeMinicart();
    this.router.navigate(['/checkout']);
  }

  goToCart(): void {
    this.closeMinicart();
    this.router.navigate(['/checkout']);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMinicart();
    this.mobileMenuOpen.set(false);
    this.mobileSearchOpen.set(false);
  }

  private prefetchCriticalResources(): void {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = window.location.origin;
    document.head.appendChild(link);
  }
}
