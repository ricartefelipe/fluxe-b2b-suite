import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'saas-empty-state',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="empty" role="status" [attr.aria-label]="titleDisplay">
      <div class="empty-icon-wrapper" aria-hidden="true">
        <ng-content select="[illustration]"></ng-content>
        <mat-icon class="empty-icon">{{ icon }}</mat-icon>
      </div>
      <p class="empty-title">{{ titleDisplay }}</p>
      @if (subtitle) { <p class="empty-sub">{{ subtitle }}</p> }
      @if (actionLabel) {
        <button mat-flat-button color="primary" class="empty-action" (click)="action.emit()">
          <mat-icon>{{ actionIcon }}</mat-icon>
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-16, 64px) var(--space-6, 24px);
      color: var(--app-text-secondary, var(--shop-text-secondary, #546e7a));
      animation: fadeIn var(--transition-slow, 300ms ease) both;
    }
    .empty-icon-wrapper {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: var(--app-surface-variant, #f8fafc);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--space-5, 20px);
    }
    .empty-icon {
      font-size: 44px;
      width: 44px;
      height: 44px;
      color: var(--app-text-secondary, var(--shop-text-secondary, #546e7a));
      opacity: 0.7;
    }
    .empty-title {
      font-size: var(--text-lg, 1.125rem);
      font-weight: var(--font-medium, 500);
      margin: 0 0 var(--space-1, 4px);
      color: var(--app-text, var(--shop-text, #263238));
    }
    .empty-sub {
      font-size: var(--text-sm, 0.875rem);
      margin: 0;
      color: var(--app-text-secondary, var(--shop-text-secondary, #546e7a));
    }
    .empty-action {
      margin-top: var(--space-6, 24px);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() actionLabel = '';
  @Input() actionIcon = 'add';
  @Output() action = new EventEmitter<void>();

  protected i18n = inject(I18nService);
  get titleDisplay(): string {
    return this.title || this.i18n.messages().common.noData;
  }
}
