import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  HostListener,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CartService } from '@union.solutions/shop/data';
import { ThemeToggleComponent, LanguageSwitcherComponent } from '@saas-suite/shared/ui';
import { OfflineIndicatorComponent, InstallPromptComponent } from '@union.solutions/shop/pwa';
import { NotificationStore } from '@saas-suite/shared/notifications';
import { AuthStore, AuthService } from '@saas-suite/shared/auth';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'app-shop-shell',
  standalone: true,
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
  templateUrl: './shop-shell.component.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopShellComponent {
  protected readonly cart = inject(CartService);
  protected readonly notifications = inject(NotificationStore);
  protected readonly auth = inject(AuthStore);
  protected readonly i18n = inject(I18nService);
  protected readonly router = inject(Router);

  private readonly authService = inject(AuthService);

  protected readonly minicartOpen = signal(false);
  protected readonly mobileMenuOpen = signal(false);
  protected readonly mobileSearchOpen = signal(false);
  protected readonly userMenuOpen = signal(false);

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

  toggleUserMenu(): void {
    this.userMenuOpen.update(v => !v);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  async doLogout(): Promise<void> {
    this.closeUserMenu();
    await this.authService.logout();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMinicart();
    this.closeUserMenu();
    this.mobileMenuOpen.set(false);
    this.mobileSearchOpen.set(false);
  }
}
