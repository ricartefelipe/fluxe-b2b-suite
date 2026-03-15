import { Component, inject, signal, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@saas-suite/shared/i18n';

const STORAGE_KEY = 'cookieConsent';

@Component({
  selector: 'saas-cookie-banner',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="cookie-banner" role="dialog" aria-label="Aviso de cookies">
        <p class="cookie-text">
          {{ i18n.messages().legal.cookieBannerText }}
          <a routerLink="/privacy" class="cookie-link">{{ i18n.messages().legal.privacyTitle }}</a>.
        </p>
        <button mat-flat-button color="primary" (click)="accept()">
          {{ i18n.messages().legal.cookieBannerAccept }}
        </button>
      </div>
    }
  `,
  styles: [`
    .cookie-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
      padding: 12px 24px;
      background: var(--app-surface, #fff);
      border-top: 1px solid var(--app-border, #ddd);
      box-shadow: 0 -2px 8px rgba(0,0,0,0.08);
      z-index: 1000;
    }
    .cookie-text {
      margin: 0;
      font-size: 14px;
      color: var(--app-text-secondary, #555);
    }
    .cookie-link {
      color: var(--app-primary, #1565c0);
      text-decoration: none;
    }
    .cookie-link:hover { text-decoration: underline; }
  `],
})
export class CookieBannerComponent {
  protected readonly i18n = inject(I18nService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly visible = signal(true);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const accepted = localStorage.getItem(STORAGE_KEY);
      this.visible.set(accepted !== 'true');
    }
  }

  accept(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, 'true');
      this.visible.set(false);
    }
  }
}
