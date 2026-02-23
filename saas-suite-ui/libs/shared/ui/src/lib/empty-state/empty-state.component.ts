import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'saas-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="empty">
      <mat-icon class="empty-icon">{{ icon }}</mat-icon>
      <p class="empty-title">{{ title }}</p>
      @if (subtitle) { <p class="empty-sub">{{ subtitle }}</p> }
    </div>
  `,
  styles: [`
    .empty { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #999; }
    .empty-icon { font-size: 64px; width: 64px; height: 64px; }
    .empty-title { font-size: 18px; font-weight: 500; margin-top: 16px; }
    .empty-sub { font-size: 14px; }
  `],
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Nenhum dado encontrado';
  @Input() subtitle = '';
}
