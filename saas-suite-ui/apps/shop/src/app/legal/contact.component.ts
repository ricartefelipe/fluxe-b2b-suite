import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'app-legal-contact',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="legal-page">
      <a mat-stroked-button routerLink="/welcome" class="back-link">{{ i18n.messages().legal.backToHome }}</a>
      <h1 class="legal-title">{{ i18n.messages().legal.contactTitle }}</h1>
      <p class="legal-desc">{{ i18n.messages().legal.contactDesc }}</p>
      <a mat-raised-button color="primary" [href]="'mailto:' + i18n.messages().legal.contactEmail" class="contact-cta">
        <mat-icon>email</mat-icon>
        {{ i18n.messages().legal.contactEmail }}
      </a>
    </div>
  `,
  styles: [`
    .legal-page {
      max-width: 520px;
      margin: 0 auto;
      padding: 32px 24px 64px;
      font-family: 'Inter', 'Roboto', sans-serif;
      color: var(--app-text, #1a1a2e);
      text-align: center;
    }
    .back-link { margin-bottom: 24px; }
    .legal-title { font-size: 28px; font-weight: 700; margin: 0 0 16px; }
    .legal-desc { font-size: 15px; line-height: 1.6; margin: 0 0 32px; color: var(--app-text-secondary, #555); }
    .contact-cta {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
  `],
})
export class ContactComponent {
  protected readonly i18n = inject(I18nService);
}
