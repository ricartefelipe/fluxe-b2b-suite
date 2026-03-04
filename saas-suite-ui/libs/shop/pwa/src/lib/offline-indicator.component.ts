import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'shop-offline-indicator',
  standalone: true,
  imports: [MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }

    .offline-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 6px 16px;
      background: #ff9800;
      color: #fff;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.01em;
      transform: translateY(-100%);
      opacity: 0;
      transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1),
                  opacity 300ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .offline-banner.visible {
      transform: translateY(0);
      opacity: 1;
    }

    .offline-banner mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `,
  template: `
    <div class="offline-banner" [class.visible]="offline()" role="status" aria-live="polite">
      <mat-icon>cloud_off</mat-icon>
      <span>You're offline. Some features may be limited.</span>
    </div>
  `,
})
export class OfflineIndicatorComponent implements OnInit {
  readonly offline = signal(false);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly onOnline = (): void => this.offline.set(false);
  private readonly onOffline = (): void => this.offline.set(true);

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.offline.set(!navigator.onLine);

    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('online', this.onOnline);
      window.removeEventListener('offline', this.onOffline);
    });
  }
}
