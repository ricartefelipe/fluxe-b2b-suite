import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UsageSummary } from '@saas-suite/data-access/core';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'app-usage-widget',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressBarModule],
  template: `
    @if (usage; as u) {
      <mat-card class="usage-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="usage-icon">analytics</mat-icon>
          <mat-card-title>{{ title() }}</mat-card-title>
          <mat-card-subtitle>{{ u.planDisplayName }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="usage-row">
            <span class="usage-label">{{ usersLabel() }}</span>
            <span class="usage-value">{{ u.usersUsed }} / {{ u.usersLimit }}</span>
          </div>
          <mat-progress-bar
            mode="determinate"
            [value]="usersPercent(u)"
            color="primary"
            class="usage-bar"
          />
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .usage-card {
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .usage-icon {
      background: rgba(21, 101, 192, 0.08);
      color: var(--app-primary, #1565c0);
      border-radius: 50%;
      padding: 8px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    .usage-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .usage-label {
      font-size: 14px;
      color: var(--app-text-secondary, #666);
    }
    .usage-value {
      font-weight: 600;
      font-size: 15px;
      color: var(--app-text, #212121);
    }
    .usage-bar {
      height: 8px;
      border-radius: 4px;
    }
  `],
})
export class UsageWidgetComponent {
  @Input() usage: UsageSummary | null = null;

  private i18n = inject(I18nService);

  title = () => this.i18n.messages()?.usage?.title ?? 'Seu uso este mês';
  usersLabel = () => this.i18n.messages()?.usage?.users ?? 'Usuários';

  usersPercent(u: UsageSummary): number {
    if (u.usersLimit <= 0) return 0;
    return Math.min(100, Math.round((u.usersUsed / u.usersLimit) * 100));
  }
}
