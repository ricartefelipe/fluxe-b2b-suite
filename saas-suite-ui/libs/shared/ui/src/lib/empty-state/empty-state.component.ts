import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'saas-empty-state',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, RouterLink],
  template: `
    <div class="empty" role="status" [attr.aria-label]="titleDisplay">
      <div class="empty-icon-wrapper" aria-hidden="true">
        <mat-icon class="empty-icon">{{ icon }}</mat-icon>
      </div>
      <p class="empty-title">{{ titleDisplay }}</p>
      @if (subtitle) { <p class="empty-sub">{{ subtitle }}</p> }
      @if (actionLabel || actionRouterLink) {
        <div class="empty-actions">
          @if (actionRouterLink) {
            <a mat-flat-button [routerLink]="actionRouterLink" color="primary" class="empty-cta">
              <mat-icon>{{ actionIcon }}</mat-icon>
              {{ actionLabel || i18n.messages().common.create }}
            </a>
          } @else if (actionLabel) {
            <button mat-flat-button color="primary" class="empty-cta" (click)="action.emit()">
              <mat-icon>{{ actionIcon }}</mat-icon>
              {{ actionLabel }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--app-space-48, 48px) var(--app-space-24, 24px);
      color: var(--app-text-secondary, #546e7a);
      gap: var(--app-space-8, 8px);
    }
    .empty-icon-wrapper {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      background: var(--app-surface-variant, #f8fafc);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--app-space-8, 8px);
      transition: transform 0.25s ease, background-color 0.2s;
    }
    .empty:hover .empty-icon-wrapper {
      transform: scale(1.02);
    }
    .empty-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--app-text-secondary, #546e7a);
    }
    .empty-title {
      font-size: var(--app-font-size-subtitle, 16px);
      font-weight: var(--app-font-weight-semibold, 600);
      margin: 0;
      color: var(--app-text, #263238);
      text-align: center;
    }
    .empty-sub {
      font-size: var(--app-font-size-body, 14px);
      margin: 0;
      color: var(--app-text-secondary, #546e7a);
      text-align: center;
      max-width: 360px;
    }
    .empty-actions {
      margin-top: var(--app-space-16, 16px);
    }
    .empty-cta mat-icon {
      margin-right: 6px;
      vertical-align: middle;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `],
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() actionLabel = '';
  @Input() actionIcon = 'add';
  @Input() actionRouterLink: string | unknown[] | null = null;
  @Output() action = new EventEmitter<void>();

  protected i18n = inject(I18nService);
  get titleDisplay(): string {
    return this.title || this.i18n.messages().common.noData;
  }
}
