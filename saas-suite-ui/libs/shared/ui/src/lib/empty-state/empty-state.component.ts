import { Component, Input, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'saas-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="empty" role="status" [attr.aria-label]="titleDisplay">
      <div class="empty-icon-wrapper" aria-hidden="true">
        <mat-icon class="empty-icon">{{ icon }}</mat-icon>
      </div>
      <p class="empty-title">{{ titleDisplay }}</p>
      @if (subtitle) { <p class="empty-sub">{{ subtitle }}</p> }
    </div>
  `,
  styles: [`
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 24px;
      color: var(--app-text-secondary, #546e7a);
    }
    .empty-icon-wrapper {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--app-surface-variant, #f8fafc);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .empty-icon { font-size: 36px; width: 36px; height: 36px; color: var(--app-text-secondary, #546e7a); }
    .empty-title { font-size: 16px; font-weight: 500; margin: 0 0 4px; color: var(--app-text, #263238); }
    .empty-sub { font-size: 13px; margin: 0; color: var(--app-text-secondary, #546e7a); }
  `],
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = '';
  @Input() subtitle = '';

  protected i18n = inject(I18nService);
  get titleDisplay(): string {
    return this.title || this.i18n.messages().common.noData;
  }
}
