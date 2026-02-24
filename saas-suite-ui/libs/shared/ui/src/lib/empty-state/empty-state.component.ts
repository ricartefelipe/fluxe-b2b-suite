import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'saas-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="empty" role="status" [attr.aria-label]="title">
      <div class="empty-icon-wrapper" aria-hidden="true">
        <mat-icon class="empty-icon">{{ icon }}</mat-icon>
      </div>
      <p class="empty-title">{{ title }}</p>
      @if (subtitle) { <p class="empty-sub">{{ subtitle }}</p> }
    </div>
  `,
  styles: [`
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 24px;
      color: #90a4ae;
    }
    .empty-icon-wrapper {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #eceff1;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .empty-icon { font-size: 36px; width: 36px; height: 36px; color: #b0bec5; }
    .empty-title { font-size: 16px; font-weight: 500; margin: 0 0 4px; color: #78909c; }
    .empty-sub { font-size: 13px; margin: 0; color: #b0bec5; }
  `],
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Nenhum dado encontrado';
  @Input() subtitle = '';
}
