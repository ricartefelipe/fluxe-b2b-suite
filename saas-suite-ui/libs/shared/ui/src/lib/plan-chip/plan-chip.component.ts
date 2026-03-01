import { Component, Input, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '@saas-suite/shared/i18n';

export type TenantPlan = 'starter' | 'professional' | 'enterprise';

@Component({
  selector: 'saas-plan-chip',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <span
      [class]="'plan-chip plan-chip--' + planKey()"
      role="status"
      [attr.aria-label]="'Plano: ' + label()">
      <mat-icon class="plan-chip-icon" aria-hidden="true">{{ icon() }}</mat-icon>
      {{ label() }}
    </span>
  `,
  styles: [`
    .plan-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: capitalize;
      letter-spacing: 0.02em;
      line-height: 1.4;
    }
    .plan-chip-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .plan-chip--starter {
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      color: #1b5e20;
    }
    .plan-chip--professional {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      color: #0d47a1;
    }
    .plan-chip--enterprise {
      background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
      color: #4a148c;
    }
    :host-context(.dark-theme) .plan-chip--starter {
      background: linear-gradient(135deg, #1b3a1b 0%, #2e5c2e 100%);
      color: #a5d6a7;
    }
    :host-context(.dark-theme) .plan-chip--professional {
      background: linear-gradient(135deg, #0d2b4a 0%, #1a3a5c 100%);
      color: #90caf9;
    }
    :host-context(.dark-theme) .plan-chip--enterprise {
      background: linear-gradient(135deg, #2d1b3d 0%, #4a2c5c 100%);
      color: #ce93d8;
    }
  `],
})
export class PlanChipComponent {
  @Input() plan: TenantPlan | string = 'starter';

  private i18n = inject(I18nService);

  planKey = computed(() => String(this.plan).toLowerCase());

  label = computed(() => {
    const key = this.planKey();
    const m = this.i18n.messages().tenant;
    switch (key) {
      case 'starter': return m.planStarter;
      case 'professional': return m.planProfessional;
      case 'enterprise': return m.planEnterprise;
      default: return this.plan;
    }
  });

  icon = computed(() => {
    const key = this.planKey();
    switch (key) {
      case 'starter': return 'rocket_launch';
      case 'professional': return 'workspace_premium';
      case 'enterprise': return 'diamond';
      default: return 'subscriptions';
    }
  });
}
