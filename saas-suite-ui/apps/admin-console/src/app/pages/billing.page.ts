import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { CoreApiClient, PlanDefinition, Subscription, SubscriptionStatus, TenantHealth } from '@saas-suite/data-access/core';
import { I18nService } from '@saas-suite/shared/i18n';
import { TenantContextStore } from '@saas-suite/domains/tenancy';

@Component({
  selector: 'app-billing-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  template: `
    <div class="billing-container">
      <header class="billing-header">
        <mat-icon class="header-icon">credit_card</mat-icon>
        <h1>{{ b.title }}</h1>
      </header>

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40" />
        </div>
      } @else {
        @if (subscription(); as sub) {
          @if (sub.status === 'TRIAL' && sub.trialEndsAt && trialDaysLeft(sub) > 0) {
            <div class="trial-banner">
              <mat-icon>schedule</mat-icon>
              <span>{{ trialBannerText(trialDaysLeft(sub)) }}</span>
              <button mat-flat-button color="primary" (click)="openBillingPortal()">{{ b.trialCtaAddCard }}</button>
            </div>
          }
        }
        <section class="current-subscription">
          @if (subscription(); as sub) {
            <mat-card class="subscription-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>receipt_long</mat-icon>
                <mat-card-title>{{ b.currentPlan }}</mat-card-title>
                <mat-card-subtitle>{{ planDisplayName(sub.planSlug) }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="sub-details">
                  <div class="sub-row">
                    <span class="sub-label">{{ b.status }}</span>
                    <mat-chip-set>
                      <mat-chip [class]="'status-' + sub.status.toLowerCase()" highlighted>
                        {{ statusLabel(sub.status) }}
                      </mat-chip>
                    </mat-chip-set>
                  </div>
                  <mat-divider />
                  <div class="sub-row">
                    <span class="sub-label">{{ b.period }}</span>
                    <span class="sub-value">{{ sub.currentPeriodStart | date:'shortDate' }} — {{ sub.currentPeriodEnd | date:'shortDate' }}</span>
                  </div>
                  @if (sub.trialEndsAt) {
                    <mat-divider />
                    <div class="sub-row">
                      <span class="sub-label">{{ b.trial }}</span>
                      <span class="sub-value">{{ sub.trialEndsAt | date:'shortDate' }}</span>
                    </div>
                  }
                  @if (sub.cancelAtPeriodEnd && sub.currentPeriodEnd) {
                    <mat-divider />
                    <div class="sub-row sub-row-scheduled">
                      <span class="sub-value">{{ scheduledCancelMessage(sub) }}</span>
                    </div>
                  }
                </div>
              </mat-card-content>
              <mat-card-actions align="end">
                @if (sub.cancelAtPeriodEnd) {
                  <button mat-stroked-button color="primary" (click)="undoScheduleCancel()">
                    {{ b.undoScheduleCancel }}
                  </button>
                } @else if (sub.status === 'ACTIVE' || sub.status === 'TRIAL') {
                  <button mat-stroked-button (click)="scheduleCancel()">{{ b.scheduleCancel }}</button>
                }
                <button mat-flat-button color="primary" (click)="openBillingPortal()">
                  <mat-icon>open_in_new</mat-icon>
                  {{ b.manageBilling }}
                </button>
              </mat-card-actions>
            </mat-card>
          } @else {
            <mat-card class="no-subscription-card">
              <mat-card-content>
                <div class="no-sub">
                  <mat-icon class="no-sub-icon">info_outline</mat-icon>
                  <p>{{ b.noSubscription }}</p>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </section>

        @if (tenantId()) {
          <section class="health-export-section">
            <mat-card class="health-export-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>health_and_safety</mat-icon>
                <mat-card-title>{{ b.healthSection }}</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                @if (health(); as h) {
                  <div class="health-row">
                    <span class="health-label">{{ b.lastActivity }}</span>
                    <span class="health-value">{{ h.lastActivityAt ? (h.lastActivityAt | date:'short') : b.never }}</span>
                  </div>
                  <div class="health-row">
                    <span class="health-label">{{ b.activeUsers }}</span>
                    <span class="health-value">{{ h.activeUsersCount }}</span>
                  </div>
                }
                <p class="export-hint">{{ b.exportDataHint }}</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-stroked-button (click)="exportData()">
                  <mat-icon>download</mat-icon>
                  {{ b.exportData }}
                </button>
              </mat-card-actions>
            </mat-card>
          </section>
        }
        <section class="plans-section">
          <h2>{{ b.changePlan }}</h2>
          <div class="plans-grid">
            @for (plan of plans(); track plan.id) {
              <mat-card class="plan-card" [class.plan-current]="subscription()?.planSlug === plan.slug">
                @if (subscription()?.planSlug === plan.slug) {
                  <div class="current-badge">{{ b.currentPlanBadge }}</div>
                }
                <mat-card-header>
                  <mat-card-title>{{ plan.displayName }}</mat-card-title>
                  <mat-card-subtitle>
                    @if (plan.monthlyPriceCents === 0) {
                      {{ b.freePlan }}
                    } @else {
                      {{ formatPrice(plan.monthlyPriceCents) }}{{ b.perMonth }}
                    }
                  </mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="plan-features">
                    <div class="plan-feature">
                      <mat-icon>people</mat-icon>
                      <span>{{ plan.maxUsers }} {{ b.users }}</span>
                    </div>
                    <div class="plan-feature">
                      <mat-icon>folder</mat-icon>
                      <span>{{ plan.maxProjects }} {{ b.projects }}</span>
                    </div>
                    <div class="plan-feature">
                      <mat-icon>cloud</mat-icon>
                      <span>{{ plan.storageGb }} GB {{ b.storage }}</span>
                    </div>
                  </div>
                </mat-card-content>
                <mat-card-actions align="end">
                  @if (subscription()?.planSlug !== plan.slug) {
                    <button mat-stroked-button color="primary" (click)="selectPlan(plan)">
                      {{ b.changePlan }}
                    </button>
                  }
                </mat-card-actions>
              </mat-card>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 24px;
      max-width: 960px;
      margin: 0 auto;
    }

    .billing-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;
    }
    .header-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: var(--app-primary, #1565c0);
    }
    .billing-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
      color: var(--app-text, #212121);
    }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: 64px 0;
    }

    .subscription-card, .no-subscription-card {
      border-radius: 12px;
      margin-bottom: 32px;
    }
    .subscription-card mat-icon[mat-card-avatar] {
      color: var(--app-primary, #1565c0);
      background: rgba(21, 101, 192, 0.08);
      border-radius: 50%;
      padding: 8px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sub-details {
      padding-top: 8px;
    }
    .sub-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
    }
    .sub-label {
      font-size: 13px;
      color: var(--app-text-secondary, #666);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .sub-value {
      font-size: 14px;
      color: var(--app-text, #212121);
    }
    .sub-row-scheduled .sub-value {
      color: #e65100;
      font-weight: 500;
    }

    .status-trial { --mdc-chip-elevated-container-color: #e3f2fd; --mdc-chip-label-text-color: #1565c0; }
    .status-active { --mdc-chip-elevated-container-color: #e8f5e9; --mdc-chip-label-text-color: #2e7d32; }
    .status-past_due { --mdc-chip-elevated-container-color: #fff3e0; --mdc-chip-label-text-color: #e65100; }
    .status-cancelled { --mdc-chip-elevated-container-color: #fce4ec; --mdc-chip-label-text-color: #c62828; }
    .status-expired { --mdc-chip-elevated-container-color: #efebe9; --mdc-chip-label-text-color: #4e342e; }

    .no-sub {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 0;
    }
    .no-sub-icon {
      color: #f57c00;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .no-sub p {
      margin: 0;
      color: var(--app-text-secondary, #666);
      font-size: 15px;
    }

    .trial-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
      border-radius: 12px;
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border: 1px solid #90caf9;
    }
    .trial-banner mat-icon {
      color: #1565c0;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .trial-banner span {
      flex: 1;
      font-size: 15px;
      color: #0d47a1;
      font-weight: 500;
    }

    .plans-section h2 {
      font-size: 22px;
      font-weight: 500;
      margin: 0 0 20px;
      color: var(--app-text, #212121);
    }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    }

    .plan-card {
      border-radius: 12px;
      position: relative;
      transition: box-shadow 0.2s, transform 0.2s;
      border: 2px solid transparent;
    }
    .plan-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }
    .plan-current {
      border-color: var(--app-primary, #1565c0);
    }

    .current-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--app-primary, #1565c0);
      color: white;
      padding: 2px 16px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }

    .plan-features {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-top: 8px;
    }
    .plan-feature {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--app-text, #212121);
    }
    .plan-feature mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--app-primary, #1565c0);
    }

    .health-export-section { margin-bottom: 24px; }
    .health-export-card { border-radius: 12px; }
    .health-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .health-label { font-weight: 500; color: var(--app-text-secondary, #666); }
    .health-value { color: var(--app-text, #212121); }
    .export-hint { font-size: 13px; color: var(--app-text-secondary, #666); margin: 12px 0 0; }
    @media (max-width: 768px) {
      .plans-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingPage implements OnInit {
  private api = inject(CoreApiClient);
  private i18n = inject(I18nService);
  private tenantStore = inject(TenantContextStore);

  get b() { return this.i18n.messages().billing; }

  readonly loading = signal(true);
  readonly plans = signal<PlanDefinition[]>([]);
  readonly subscription = signal<Subscription | null>(null);
  readonly health = signal<TenantHealth | null>(null);
  readonly tenantId = computed(() => this.tenantStore.activeTenantId() ?? null);

  readonly currentPlan = computed(() => {
    const sub = this.subscription();
    if (!sub) return null;
    return this.plans().find(p => p.slug === sub.planSlug) ?? null;
  });

  ngOnInit(): void {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      this.api.listPlans().subscribe({
        next: plans => this.plans.set(plans),
      });
      this.api.getCurrentSubscription().subscribe({
        next: sub => this.subscription.set(sub),
        error: () => this.subscription.set(null),
      });
      const tid = this.tenantStore.activeTenantId();
      if (tid) {
        this.api.getTenantHealth(tid).subscribe({
          next: h => this.health.set(h),
          error: () => this.health.set(null),
        });
      }
    } finally {
      this.loading.set(false);
    }
  }

  statusLabel(status: SubscriptionStatus): string {
    const map: Record<SubscriptionStatus, string> = {
      TRIAL: this.b.trial,
      ACTIVE: this.b.active,
      PAST_DUE: this.b.pastDue,
      CANCELLED: this.b.cancelled,
      EXPIRED: this.b.expired,
    };
    return map[status] ?? status;
  }

  planDisplayName(slug: string): string {
    return this.plans().find(p => p.slug === slug)?.displayName ?? slug;
  }

  formatPrice(cents: number): string {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  trialDaysLeft(sub: Subscription): number {
    if (!sub.trialEndsAt) return 0;
    const end = new Date(sub.trialEndsAt).getTime();
    const now = Date.now();
    const days = Math.ceil((end - now) / (24 * 60 * 60 * 1000));
    return Math.max(0, days);
  }

  trialBannerText(days: number): string {
    return this.b.trialBannerMessage.replace('{{days}}', String(days));
  }

  scheduledCancelMessage(sub: Subscription): string {
    const date = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '';
    return this.b.scheduledCancelMessage.replace('{{date}}', date);
  }

  scheduleCancel(): void {
    this.api.scheduleCancelAtPeriodEnd().subscribe({
      next: sub => this.subscription.set(sub),
    });
  }

  undoScheduleCancel(): void {
    this.api.undoScheduleCancelAtPeriodEnd().subscribe({
      next: sub => this.subscription.set(sub),
    });
  }

  openBillingPortal(): void {
    this.api.createPortalSession(window.location.href).subscribe({
      next: res => window.location.href = res.url,
    });
  }

  selectPlan(plan: PlanDefinition): void {
    this.api.startTrial(plan.slug).subscribe({
      next: sub => this.subscription.set(sub),
    });
  }

  exportData(): void {
    const tid = this.tenantStore.activeTenantId();
    if (!tid) return;
    this.api.exportTenantData(tid).subscribe({
      next: data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tenant-export-${tid}-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }
}
