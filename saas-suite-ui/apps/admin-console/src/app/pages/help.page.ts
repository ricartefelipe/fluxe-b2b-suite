import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'app-help-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="help-container">
      <header class="help-header">
        <mat-icon class="header-icon">help_outline</mat-icon>
        <h1>{{ h.title }}</h1>
      </header>

      <section class="faq-section">
        <h2>{{ h.faqTitle }}</h2>
        <mat-card class="faq-card">
          <mat-card-content>
            <div class="faq-item">
              <p class="faq-q">{{ h.faq1Question }}</p>
              <p class="faq-a">{{ h.faq1Answer }}</p>
            </div>
            <div class="faq-item">
              <p class="faq-q">{{ h.faq2Question }}</p>
              <p class="faq-a">{{ h.faq2Answer }}</p>
            </div>
            <div class="faq-item">
              <p class="faq-q">{{ h.faq3Question }}</p>
              <p class="faq-a">{{ h.faq3Answer }}</p>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <section class="data-section">
        <h2>{{ h.dataSectionTitle }}</h2>
        <mat-card class="data-card">
          <mat-card-content>
            <p class="data-desc">{{ h.exportLinkHint }}</p>
            <a routerLink="/billing" mat-stroked-button color="primary" class="data-cta">
              <mat-icon>download</mat-icon>
              {{ b.exportData }}
            </a>
          </mat-card-content>
        </mat-card>
      </section>

      <section class="contact-section">
        <h2>{{ legal.contactTitle }}</h2>
        <mat-card class="contact-card">
          <mat-card-content>
            <p class="contact-desc">{{ legal.contactDesc }}</p>
            <a [href]="'mailto:' + legal.contactEmail" mat-flat-button color="primary" class="contact-cta">
              <mat-icon>email</mat-icon>
              {{ legal.contactEmail }}
            </a>
          </mat-card-content>
        </mat-card>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 24px; max-width: 800px; margin: 0 auto; }
    .help-header { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
    .header-icon { font-size: 32px; width: 32px; height: 32px; color: var(--app-primary, #1565c0); }
    .help-header h1 { margin: 0; font-size: 28px; font-weight: 500; }
    .faq-section h2, .contact-section h2, .data-section h2 { font-size: 20px; font-weight: 500; margin: 0 0 16px; }
    .faq-card, .contact-card, .data-card { margin-bottom: 24px; border-radius: 12px; }
    .data-desc { margin: 0 0 16px; color: var(--app-text-secondary, #666); }
    .data-cta { text-decoration: none; }
    .faq-item { margin-bottom: 20px; }
    .faq-item:last-child { margin-bottom: 0; }
    .faq-q { font-weight: 600; margin: 0 0 8px; color: var(--app-text, #212121); }
    .faq-a { margin: 0; color: var(--app-text-secondary, #666); font-size: 14px; line-height: 1.5; }
    .contact-desc { margin: 0 0 16px; color: var(--app-text-secondary, #666); }
    .contact-cta { text-decoration: none; }
  `],
})
export class HelpPage {
  private i18n = inject(I18nService);
  get h() { return this.i18n.messages().helpPage; }
  get b() { return this.i18n.messages().billing; }
  get legal() { return this.i18n.messages().legal; }
}
