import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'shop-loading-spinner',
  imports: [CommonModule],
  template: `
    <div class="spinner-container" role="status" aria-live="polite" [attr.aria-label]="ariaLabel">
      <div class="spinner" aria-hidden="true"></div>
      <p>{{ label }}</p>
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    p {
      margin-top: 16px;
      color: #666;
      font-size: 1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinnerComponent {
  @Input() label = 'Carregando...';
  @Input() ariaLabel = 'Carregando conteúdo';
}