import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@saas-suite/shared/i18n';
import { RuntimeConfigService } from '@saas-suite/shared/config';

function joinApiUrl(base: string, path: string): string {
  const b = base.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

@Component({
  selector: 'app-help-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="help-container">
      <header class="help-header">
        <mat-icon class="header-icon">help_outline</mat-icon>
        <h1>{{ h().title }}</h1>
      </header>

      <section class="first-steps-section">
        <h2>{{ h().firstStepsTitle }}</h2>
        <mat-card class="first-steps-card">
          <mat-card-content>
            <p class="first-steps-intro">{{ h().firstStepsIntro }}</p>
            <ol class="first-steps-list">
              <li>{{ h().firstStepsStep1 }}</li>
              <li>{{ h().firstStepsStep2 }}</li>
              <li>{{ h().firstStepsStep3 }}</li>
              <li>{{ h().firstStepsStep4 }}</li>
              <li>{{ h().firstStepsStep5 }}</li>
            </ol>
            <p class="first-steps-footer">{{ h().firstStepsFooter }}</p>
          </mat-card-content>
        </mat-card>
      </section>

      <section class="faq-section">
        <h2>{{ h().faqTitle }}</h2>
        <mat-card class="faq-card">
          <mat-card-content>
            <div class="faq-item">
              <p class="faq-q">{{ h().faq1Question }}</p>
              <p class="faq-a">{{ h().faq1Answer }}</p>
            </div>
            <div class="faq-item">
              <p class="faq-q">{{ h().faq2Question }}</p>
              <p class="faq-a">{{ h().faq2Answer }}</p>
            </div>
            <div class="faq-item">
              <p class="faq-q">{{ h().faq3Question }}</p>
              <p class="faq-a">{{ h().faq3Answer }}</p>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <section class="docs-section">
        <h2>{{ h().docsSectionTitle }}</h2>
        <mat-card class="docs-card">
          <mat-card-content>
            <p class="docs-intro">{{ h().docsSectionIntro }}</p>
            <ul class="docs-links">
              <li>
                <a
                  mat-stroked-button
                  color="primary"
                  [href]="coreSwaggerUrl()"
                  target="_blank"
                  rel="noopener noreferrer"
                  [title]="h().opensInNewTabHint">
                  <mat-icon>api</mat-icon>
                  {{ h().linkCoreSwagger }}
                </a>
              </li>
              <li>
                <a
                  mat-stroked-button
                  color="primary"
                  [href]="coreOpenApiUrl()"
                  target="_blank"
                  rel="noopener noreferrer"
                  [title]="h().opensInNewTabHint">
                  <mat-icon>description</mat-icon>
                  {{ h().linkCoreOpenApi }}
                </a>
              </li>
              <li>
                <a
                  mat-stroked-button
                  color="primary"
                  [href]="ordersDocsUrl()"
                  target="_blank"
                  rel="noopener noreferrer"
                  [title]="h().opensInNewTabHint">
                  <mat-icon>shopping_cart</mat-icon>
                  {{ h().linkOrdersDocs }}
                </a>
              </li>
              <li>
                <a
                  mat-stroked-button
                  color="primary"
                  [href]="paymentsDocsUrl()"
                  target="_blank"
                  rel="noopener noreferrer"
                  [title]="h().opensInNewTabHint">
                  <mat-icon>account_balance</mat-icon>
                  {{ h().linkPaymentsDocs }}
                </a>
              </li>
              <li>
                <a
                  mat-stroked-button
                  color="primary"
                  [href]="paymentsOpenApiUrl()"
                  target="_blank"
                  rel="noopener noreferrer"
                  [title]="h().opensInNewTabHint">
                  <mat-icon>data_object</mat-icon>
                  {{ h().linkPaymentsOpenApi }}
                </a>
              </li>
            </ul>
            @if (platformDocsUrl()) {
              <div class="platform-docs">
                <a
                  mat-flat-button
                  color="primary"
                  [href]="platformDocsUrl()"
                  target="_blank"
                  rel="noopener noreferrer"
                  [title]="h().opensInNewTabHint">
                  <mat-icon>menu_book</mat-icon>
                  {{ h().linkPlatformDocs }}
                </a>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </section>

      <section class="data-section">
        <h2>{{ h().dataSectionTitle }}</h2>
        <mat-card class="data-card">
          <mat-card-content>
            <p class="data-desc">{{ h().exportLinkHint }}</p>
            <a routerLink="/billing" mat-stroked-button color="primary" class="data-cta">
              <mat-icon>download</mat-icon>
              {{ b().exportData }}
            </a>
          </mat-card-content>
        </mat-card>
      </section>

      <section class="contact-section">
        <h2>{{ legal().contactTitle }}</h2>
        <mat-card class="contact-card">
          <mat-card-content>
            <p class="contact-desc">{{ legal().contactDesc }}</p>
            <a [href]="'mailto:' + legal().contactEmail" mat-flat-button color="primary" class="contact-cta">
              <mat-icon>email</mat-icon>
              {{ legal().contactEmail }}
            </a>
          </mat-card-content>
        </mat-card>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: 24px;
        max-width: 800px;
        margin: 0 auto;
      }
      .help-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 32px;
      }
      .header-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--app-primary, #1565c0);
      }
      .help-header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 500;
      }
      .first-steps-section h2,
      .faq-section h2,
      .docs-section h2,
      .contact-section h2,
      .data-section h2 {
        font-size: 20px;
        font-weight: 500;
        margin: 0 0 16px;
      }
      .first-steps-card,
      .faq-card,
      .docs-card,
      .contact-card,
      .data-card {
        margin-bottom: 24px;
        border-radius: 12px;
      }
      .first-steps-intro,
      .first-steps-footer {
        margin: 0 0 16px;
        color: var(--app-text-secondary, #666);
        font-size: 14px;
        line-height: 1.55;
      }
      .first-steps-footer {
        margin: 16px 0 0;
      }
      .first-steps-list {
        margin: 0;
        padding-left: 22px;
        color: var(--app-text, #212121);
        font-size: 14px;
        line-height: 1.6;
      }
      .first-steps-list li {
        margin-bottom: 8px;
      }
      .first-steps-list li:last-child {
        margin-bottom: 0;
      }
      .docs-intro {
        margin: 0 0 16px;
        color: var(--app-text-secondary, #666);
        font-size: 14px;
        line-height: 1.55;
      }
      .docs-links {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
      .docs-links a {
        text-decoration: none;
      }
      .docs-links mat-icon {
        margin-right: 6px;
        vertical-align: middle;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .platform-docs {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid rgba(0, 0, 0, 0.08);
      }
      .platform-docs a {
        text-decoration: none;
      }
      .data-desc {
        margin: 0 0 16px;
        color: var(--app-text-secondary, #666);
      }
      .data-cta {
        text-decoration: none;
      }
      .faq-item {
        margin-bottom: 20px;
      }
      .faq-item:last-child {
        margin-bottom: 0;
      }
      .faq-q {
        font-weight: 600;
        margin: 0 0 8px;
        color: var(--app-text, #212121);
      }
      .faq-a {
        margin: 0;
        color: var(--app-text-secondary, #666);
        font-size: 14px;
        line-height: 1.5;
      }
      .contact-desc {
        margin: 0 0 16px;
        color: var(--app-text-secondary, #666);
      }
      .contact-cta {
        text-decoration: none;
      }
    `,
  ],
})
export class HelpPage {
  private readonly i18n = inject(I18nService);
  private readonly runtimeConfig = inject(RuntimeConfigService);

  protected h = () => this.i18n.messages().helpPage;
  protected b = () => this.i18n.messages().billing;
  protected legal = () => this.i18n.messages().legal;

  readonly coreSwaggerUrl = computed(() =>
    joinApiUrl(this.runtimeConfig.config().coreApiBaseUrl, 'swagger-ui.html'),
  );
  readonly coreOpenApiUrl = computed(() =>
    joinApiUrl(this.runtimeConfig.config().coreApiBaseUrl, 'v3/api-docs'),
  );
  readonly ordersDocsUrl = computed(() =>
    joinApiUrl(this.runtimeConfig.config().ordersApiBaseUrl, 'docs'),
  );
  readonly paymentsDocsUrl = computed(() =>
    joinApiUrl(this.runtimeConfig.config().paymentsApiBaseUrl, 'docs'),
  );
  readonly paymentsOpenApiUrl = computed(() =>
    joinApiUrl(this.runtimeConfig.config().paymentsApiBaseUrl, 'openapi.json'),
  );
  readonly platformDocsUrl = computed(() => {
    const u = this.runtimeConfig.config().platformDocsUrl?.trim();
    return u || '';
  });
}
