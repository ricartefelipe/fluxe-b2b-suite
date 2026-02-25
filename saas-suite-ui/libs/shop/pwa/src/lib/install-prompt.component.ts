import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_STORAGE_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

@Component({
  selector: 'shop-install-prompt',
  standalone: true,
  imports: [MatButton, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .install-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 12px 24px;
      background: #1565c0;
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 -2px 8px rgb(0 0 0 / 15%);
      transform: translateY(100%);
      opacity: 0;
      transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1),
                  opacity 400ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .install-banner.visible {
      transform: translateY(0);
      opacity: 1;
    }

    .install-banner mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .banner-text {
      flex: 1;
      text-align: center;
    }

    .banner-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .banner-actions button {
      font-size: 13px;
    }
  `,
  template: `
    @if (showBanner()) {
      <div class="install-banner" [class.visible]="showBanner()" role="complementary">
        <mat-icon>get_app</mat-icon>
        <span class="banner-text">Install Fluxe Shop for a better experience</span>
        <div class="banner-actions">
          <button mat-button color="inherit" (click)="dismiss()">Dismiss</button>
          <button mat-raised-button (click)="install()">Install</button>
        </div>
      </div>
    }
  `,
})
export class InstallPromptComponent implements OnInit {
  readonly showBanner = signal(false);

  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private readonly destroyRef = inject(DestroyRef);

  private readonly onBeforeInstallPrompt = (e: Event): void => {
    e.preventDefault();
    this.deferredPrompt = e as BeforeInstallPromptEvent;

    if (!this.isDismissedRecently() && !this.isStandalone()) {
      this.showBanner.set(true);
    }
  };

  ngOnInit(): void {
    if (this.isStandalone()) {
      return;
    }

    window.addEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
    });
  }

  async install(): Promise<void> {
    if (!this.deferredPrompt) {
      return;
    }

    await this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      this.showBanner.set(false);
    }

    this.deferredPrompt = null;
  }

  dismiss(): void {
    this.showBanner.set(false);
    localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
  }

  private isDismissedRecently(): boolean {
    const dismissed = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!dismissed) {
      return false;
    }
    return Date.now() - Number(dismissed) < DISMISS_DURATION_MS;
  }

  private isStandalone(): boolean {
    if (typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(display-mode: standalone)').matches;
  }
}
