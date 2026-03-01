import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'saas-error-page',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="error-page">
      <mat-icon class="error-icon">{{ icon }}</mat-icon>
      <h1>{{ code }}</h1>
      <h2>{{ titleDisplay }}</h2>
      <p>{{ messageDisplay }}</p>
      @if (correlationId) { <code>{{ i18n.messages().errorPage.correlationIdLabel }}: {{ correlationId }}</code> }
      <button mat-raised-button color="primary" routerLink="/">{{ i18n.messages().errorPage.backToHome }}</button>
    </div>
  `,
  styles: [`
    .error-page { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; text-align: center; color: var(--app-text, #263238); background: var(--app-bg, #f4f6f9); }
    .error-icon { font-size: 80px; width: 80px; height: 80px; color: var(--app-chip-deny-text, #c62828); }
    .error-page h1 { font-size: 72px; margin: 0; }
    .error-page code { display: block; margin: 16px 0; font-size: 12px; color: var(--app-text-secondary, #546e7a); }
  `],
})
export class ErrorPageComponent {
  @Input() code = '500';
  @Input() title = '';
  @Input() message = '';
  @Input() icon = 'error_outline';
  @Input() correlationId?: string;

  protected i18n = inject(I18nService);

  get titleDisplay(): string {
    return this.title || this.i18n.messages().errorPage.defaultTitle;
  }
  get messageDisplay(): string {
    return this.message || this.i18n.messages().errorPage.defaultMessage;
  }
}
