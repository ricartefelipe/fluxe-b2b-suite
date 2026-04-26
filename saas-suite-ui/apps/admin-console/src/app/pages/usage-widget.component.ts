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
            [color]="usageBarColor(u)"
            class="usage-bar"
          />
          @if (usageSeverity(u) !== 'ok') {
            <div
              class="usage-governance-message"
              [class.usage-warning]="usageSeverity(u) === 'warn'"
              [class.usage-block]="usageSeverity(u) === 'block'"
              [attr.role]="usageSeverity(u) === 'block' ? 'alert' : 'status'"
            >
              <mat-icon>{{ usageSeverity(u) === 'block' ? 'block' : 'warning' }}</mat-icon>
              <span>{{ usageMessage(u) }}</span>
            </div>
          }
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
    .usage-governance-message {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      font-size: 13px;
      font-weight: 500;
    }
    .usage-governance-message mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .usage-warning {
      color: #e65100;
    }
    .usage-block {
      color: #c62828;
    }
  `],
})
export class UsageWidgetComponent {
  @Input() usage: UsageSummary | null = null;

  private i18n = inject(I18nService);

  title = () => this.i18n.messages()?.usage?.title ?? 'Seu uso este mês';
  usersLabel = () => this.i18n.messages()?.usage?.users ?? 'Usuários';
  nearLimitMessage = () => this.i18n.messages()?.usage?.nearLimit ?? 'Perto do limite de usuários do plano.';
  limitReachedMessage = () => this.i18n.messages()?.usage?.limitReached ?? 'Limite atingido para usuários do plano.';

  usersPercent(u: UsageSummary): number {
    if (u.usersLimit <= 0) return 0;
    return Math.min(100, Math.round((u.usersUsed / u.usersLimit) * 100));
  }

  usageSeverity(u: UsageSummary): 'ok' | 'warn' | 'block' {
    if (u.usersLimit <= 0) return 'ok';
    if (u.usersUsed >= u.usersLimit) return 'block';
    return this.usersPercent(u) >= 90 ? 'warn' : 'ok';
  }

  usageBarColor(u: UsageSummary): 'primary' | 'accent' | 'warn' {
    const severity = this.usageSeverity(u);
    if (severity === 'block') return 'warn';
    if (severity === 'warn') return 'accent';
    return 'primary';
  }

  usageMessage(u: UsageSummary): string {
    const severity = this.usageSeverity(u);
    if (severity === 'block') return this.limitReachedMessage();
    if (severity === 'warn') return this.nearLimitMessage();
    return '';
  }
}
