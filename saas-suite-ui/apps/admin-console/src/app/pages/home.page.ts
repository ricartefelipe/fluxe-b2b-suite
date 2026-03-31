import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '@saas-suite/shared/i18n';
import { AuthStore } from '@saas-suite/shared/auth';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home">
      <header class="hero">
        <h1>{{ h().heroTitle }}</h1>
        <p class="hero-sub">{{ h().heroSubtitle }}</p>
      </header>

      <section class="quick" [attr.aria-labelledby]="'quick-heading'">
        <h2 id="quick-heading" class="section-title">{{ h().quickLinksTitle }}</h2>
        <div class="card-grid" role="list">
          @if (auth.hasPermission('tenants:read')) {
            <a class="link-card" routerLink="/tenants" role="listitem">
              <mat-card appearance="outlined">
                <mat-card-header>
                  <mat-icon mat-card-avatar class="avatar tenants">business</mat-icon>
                  <mat-card-title>{{ nav().tenants }}</mat-card-title>
                  <mat-card-subtitle>{{ h().cardTenantsDesc }}</mat-card-subtitle>
                </mat-card-header>
              </mat-card>
            </a>
          }
          @if (auth.hasPermission('tenants:write')) {
            <a class="link-card" routerLink="/onboarding" role="listitem">
              <mat-card appearance="outlined">
                <mat-card-header>
                  <mat-icon mat-card-avatar class="avatar onboarding">add_business</mat-icon>
                  <mat-card-title>{{ nav().newTenant }}</mat-card-title>
                  <mat-card-subtitle>{{ h().cardOnboardingDesc }}</mat-card-subtitle>
                </mat-card-header>
              </mat-card>
            </a>
          }
          @if (auth.hasPermission('tenants:read')) {
            <a class="link-card" routerLink="/billing" role="listitem">
              <mat-card appearance="outlined">
                <mat-card-header>
                  <mat-icon mat-card-avatar class="avatar billing">credit_card</mat-icon>
                  <mat-card-title>{{ nav().billing }}</mat-card-title>
                  <mat-card-subtitle>{{ h().cardBillingDesc }}</mat-card-subtitle>
                </mat-card-header>
              </mat-card>
            </a>
          }
          @if (auth.hasPermission('admin:write')) {
            <a class="link-card" routerLink="/users" role="listitem">
              <mat-card appearance="outlined">
                <mat-card-header>
                  <mat-icon mat-card-avatar class="avatar users">people</mat-icon>
                  <mat-card-title>{{ nav().users }}</mat-card-title>
                  <mat-card-subtitle>{{ h().cardUsersDesc }}</mat-card-subtitle>
                </mat-card-header>
              </mat-card>
            </a>
          }
          @if (auth.hasPermission('policies:read')) {
            <a class="link-card" routerLink="/policies" role="listitem">
              <mat-card appearance="outlined">
                <mat-card-header>
                  <mat-icon mat-card-avatar class="avatar policies">policy</mat-icon>
                  <mat-card-title>{{ nav().policies }}</mat-card-title>
                  <mat-card-subtitle>{{ h().cardPoliciesDesc }}</mat-card-subtitle>
                </mat-card-header>
              </mat-card>
            </a>
          }
          @if (auth.hasPermission('audit:read')) {
            <a class="link-card" routerLink="/audit" role="listitem">
              <mat-card appearance="outlined">
                <mat-card-header>
                  <mat-icon mat-card-avatar class="avatar audit">history</mat-icon>
                  <mat-card-title>{{ nav().auditLog }}</mat-card-title>
                  <mat-card-subtitle>{{ h().cardAuditDesc }}</mat-card-subtitle>
                </mat-card-header>
              </mat-card>
            </a>
          }
          <a class="link-card" routerLink="/help" role="listitem">
            <mat-card appearance="outlined">
              <mat-card-header>
                <mat-icon mat-card-avatar class="avatar help">help_outline</mat-icon>
                <mat-card-title>{{ nav().help }}</mat-card-title>
                <mat-card-subtitle>{{ h().cardHelpDesc }}</mat-card-subtitle>
              </mat-card-header>
            </mat-card>
          </a>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .home {
        max-width: 960px;
      }
      .hero {
        margin-bottom: 28px;
      }
      .hero h1 {
        margin: 0 0 10px;
        font-size: clamp(1.5rem, 2.5vw, 1.85rem);
        font-weight: 700;
        letter-spacing: -0.03em;
        color: var(--app-text-primary, #0f172a);
      }
      .hero-sub {
        margin: 0;
        font-size: 15px;
        line-height: 1.6;
        color: var(--app-text-secondary, #64748b);
        max-width: 52ch;
      }
      .section-title {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--app-text-secondary, #64748b);
        margin: 0 0 14px;
      }
      .card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 14px;
      }
      .link-card {
        text-decoration: none;
        color: inherit;
        display: block;
        border-radius: 12px;
        outline-offset: 2px;
      }
      .link-card mat-card {
        height: 100%;
        transition:
          box-shadow 0.2s ease,
          border-color 0.2s ease,
          transform 0.15s ease;
      }
      .link-card:hover mat-card {
        box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
        transform: translateY(-2px);
      }
      .link-card:focus-visible mat-card {
        box-shadow: 0 0 0 2px var(--app-primary, #1565c0);
      }
      .avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px !important;
        height: 40px !important;
        border-radius: 10px;
        font-size: 22px;
        color: #fff;
      }
      .avatar.tenants {
        background: linear-gradient(145deg, #0284c7, #0369a1);
      }
      .avatar.onboarding {
        background: linear-gradient(145deg, #059669, #047857);
      }
      .avatar.billing {
        background: linear-gradient(145deg, #7c3aed, #6d28d9);
      }
      .avatar.users {
        background: linear-gradient(145deg, #ea580c, #c2410c);
      }
      .avatar.policies {
        background: linear-gradient(145deg, #0d9488, #0f766e);
      }
      .avatar.audit {
        background: linear-gradient(145deg, #4f46e5, #4338ca);
      }
      .avatar.help {
        background: linear-gradient(145deg, #64748b, #475569);
      }
      mat-card-header {
        padding-bottom: 8px !important;
      }
      mat-card-title {
        font-size: 1rem !important;
        font-weight: 600 !important;
      }
      mat-card-subtitle {
        margin-top: 6px !important;
        line-height: 1.45 !important;
        white-space: normal !important;
      }
    `,
  ],
})
export class AdminHomePage {
  private readonly i18n = inject(I18nService);
  protected readonly auth = inject(AuthStore);

  protected h = () => this.i18n.messages().adminHome;
  protected nav = () => this.i18n.messages().adminNav;
}
