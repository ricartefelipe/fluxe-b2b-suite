import { Component, input, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'shop-error-message',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="error-container">
      <div class="error-icon" aria-hidden="true">
        <mat-icon class="error-mat-icon">warning</mat-icon>
      </div>
      <h3>{{ title() || i18n.messages().errors.serverError }}</h3>
      <p>{{ message() || i18n.messages().shop.unexpectedError }}</p>
      @if (showRetry()) {
        <button class="retry-button" (click)="retry.emit()">
          {{ i18n.messages().common.back }}
        </button>
      }
    </div>
  `,
  styles: [`
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
      background: #fff;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .error-icon {
      margin-bottom: 16px;
    }

    .error-mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #e65100;
    }

    h3 {
      margin: 0 0 8px 0;
      font-size: 1.5rem;
      color: #333;
    }

    p {
      margin: 0 0 24px 0;
      color: #666;
      font-size: 1rem;
      max-width: 400px;
    }

    .retry-button {
      background: #3498db;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.3s ease;
    }

    .retry-button:hover {
      background: #2980b9;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorMessageComponent {
  protected readonly i18n = inject(I18nService);
  readonly title = input<string>();
  readonly message = input<string>();
  readonly showRetry = input(true);
  readonly retry = output<void>();
}