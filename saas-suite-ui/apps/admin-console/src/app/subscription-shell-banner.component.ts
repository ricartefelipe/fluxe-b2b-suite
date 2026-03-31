import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { CoreApiClient, Subscription } from '@saas-suite/data-access/core';
import { I18nService } from '@saas-suite/shared/i18n';
import { AuthStore } from '@saas-suite/shared/auth';

@Component({
  selector: 'app-subscription-shell-banner',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      @if (variant() === 'trial') {
        <div class="banner banner--trial" role="status">
          <mat-icon class="banner-icon">schedule</mat-icon>
          <span class="banner-text">{{ trialText() }}</span>
          @if (canBilling()) {
            <a mat-button color="primary" routerLink="/billing">{{ b().shellBannerViewBilling }}</a>
            <button mat-flat-button color="primary" type="button" (click)="openPortal()">
              {{ b().trialCtaAddCard }}
            </button>
          }
        </div>
      }
      @if (variant() === 'pastDue') {
        <div class="banner banner--past-due" role="alert">
          <mat-icon class="banner-icon">warning</mat-icon>
          <span class="banner-text">{{ b().shellBannerPastDue }}</span>
          @if (canBilling()) {
            <a mat-flat-button color="primary" routerLink="/billing">{{ b().shellBannerViewBilling }}</a>
            <button mat-stroked-button type="button" (click)="openPortal()">
              {{ b().manageBilling }}
            </button>
          }
        </div>
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
        margin-bottom: 16px;
      }
      .banner {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px 12px;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.45;
      }
      .banner--trial {
        background: linear-gradient(135deg, #e3f2fd 0%, #f0f9ff 100%);
        border: 1px solid #90caf9;
        color: #0d47a1;
      }
      .banner--past-due {
        background: linear-gradient(135deg, #fff3e0 0%, #fff8e1 100%);
        border: 1px solid #ffb74d;
        color: #e65100;
      }
      .banner-icon {
        flex-shrink: 0;
        font-size: 22px;
        width: 22px;
        height: 22px;
      }
      .banner-text {
        flex: 1;
        min-width: 200px;
        font-weight: 500;
      }
    `,
  ],
})
export class SubscriptionShellBannerComponent implements OnInit {
  private readonly api = inject(CoreApiClient);
  private readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthStore);

  readonly visible = signal(false);
  readonly variant = signal<'trial' | 'pastDue' | null>(null);
  readonly trialText = signal('');

  protected b = () => this.i18n.messages().billing;

  protected canBilling = () => this.auth.hasPermission('tenants:read');

  async ngOnInit(): Promise<void> {
    try {
      const sub = await firstValueFrom(this.api.getCurrentSubscription());
      if (!sub) return;

      if (sub.status === 'PAST_DUE') {
        this.variant.set('pastDue');
        this.visible.set(true);
        return;
      }

      if (sub.status === 'TRIAL' && sub.trialEndsAt) {
        const days = this.trialDaysLeft(sub);
        if (days > 0) {
          const msg = this.i18n
            .messages()
            .billing.trialBannerMessage.replace('{{days}}', String(days));
          this.trialText.set(msg);
          this.variant.set('trial');
          this.visible.set(true);
        }
      }
    } catch {
      /* API indisponível ou sem assinatura */
    }
  }

  private trialDaysLeft(sub: Subscription): number {
    if (!sub.trialEndsAt) return 0;
    const end = new Date(sub.trialEndsAt).getTime();
    const days = Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000));
    return Math.max(0, days);
  }

  openPortal(): void {
    this.api.createPortalSession(window.location.href).subscribe({
      next: res => {
        window.location.href = res.url;
      },
    });
  }
}
