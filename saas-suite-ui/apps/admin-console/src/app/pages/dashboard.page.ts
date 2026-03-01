import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { TenantsFacade, PoliciesFacade, AuditFacade } from '@saas-suite/data-access/core';
import { I18nService } from '@saas-suite/shared/i18n';
import { formatDateTime } from '@saas-suite/shared/util';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatListModule,
  ],
  template: `
    <div class="dashboard">
      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <h1 class="page-title">{{ i18n.messages().admin.overviewTitle }}</h1>

      <div class="kpi-row">
        <a mat-card class="kpi-card" routerLink="/tenants">
          <mat-card-content class="kpi-content">
            <div class="kpi-icon kpi-icon--blue"><mat-icon>business</mat-icon></div>
            <div class="kpi-data">
              <span class="kpi-value">{{ tenantsFacade.total() }}</span>
              <span class="kpi-label">{{ i18n.messages().nav.tenants }}</span>
            </div>
          </mat-card-content>
        </a>
        <a mat-card class="kpi-card" routerLink="/policies">
          <mat-card-content class="kpi-content">
            <div class="kpi-icon kpi-icon--green"><mat-icon>policy</mat-icon></div>
            <div class="kpi-data">
              <span class="kpi-value">{{ policiesFacade.total() }}</span>
              <span class="kpi-label">{{ i18n.messages().nav.policies }}</span>
            </div>
          </mat-card-content>
        </a>
        <a mat-card class="kpi-card" routerLink="/flags">
          <mat-card-content class="kpi-content">
            <div class="kpi-icon kpi-icon--amber"><mat-icon>flag</mat-icon></div>
            <div class="kpi-data">
              <span class="kpi-value">{{ i18n.messages().nav.featureFlags }}</span>
              <span class="kpi-label">{{ i18n.messages().admin.perTenant }}</span>
            </div>
          </mat-card-content>
        </a>
        <a mat-card class="kpi-card" routerLink="/audit">
          <mat-card-content class="kpi-content">
            <div class="kpi-icon kpi-icon--orange"><mat-icon>history</mat-icon></div>
            <div class="kpi-data">
              <span class="kpi-value">{{ auditFacade.total() }}</span>
              <span class="kpi-label">{{ i18n.messages().admin.auditRecords }}</span>
            </div>
          </mat-card-content>
        </a>
      </div>

      <div class="bottom-row">
        <mat-card class="table-card">
          <mat-card-header>
            <mat-card-title>{{ i18n.messages().admin.recentActivity }}</mat-card-title>
            <a mat-button routerLink="/audit">{{ i18n.messages().admin.viewAll }}</a>
          </mat-card-header>
          <mat-card-content>
            @if (auditFacade.logs().length > 0) {
              <mat-list>
                @for (log of auditFacade.logs(); track log.id) {
                  <mat-list-item>
                    <mat-icon matListItemIcon>history</mat-icon>
                    <span matListItemTitle>{{ log.action }}</span>
                    <span matListItemLine>{{ log.outcome }} · {{ fmtDate(log.createdAt) }}</span>
                  </mat-list-item>
                }
              </mat-list>
            } @else {
              <p class="empty-hint">{{ i18n.messages().admin.noRecentActivity }}</p>
            }
          </mat-card-content>
        </mat-card>

        <mat-card class="actions-card">
          <mat-card-header>
            <mat-card-title>{{ i18n.messages().admin.quickActions }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="quick-actions">
              <a mat-raised-button color="primary" routerLink="/onboarding">
                <mat-icon>add_business</mat-icon> {{ i18n.messages().admin.newTenant }}
              </a>
              <a mat-stroked-button routerLink="/policies">
                <mat-icon>policy</mat-icon> {{ i18n.messages().admin.managePolicies }}
              </a>
              <a mat-stroked-button routerLink="/tenants">
                <mat-icon>list</mat-icon> {{ i18n.messages().admin.listTenants }}
              </a>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { padding: var(--app-space-8, 8px) 0; }
    .page-title { margin: 0 0 var(--app-space-24, 24px); font-size: var(--app-font-size-headline, 22px); font-weight: 500; color: var(--app-text); }

    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--app-space-16, 16px);
      margin-bottom: var(--app-space-24, 24px);
    }
    .kpi-card {
      text-decoration: none;
      color: inherit;
      border-radius: 14px;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
    .kpi-content { display: flex; align-items: center; gap: var(--app-space-16, 16px); padding: var(--app-space-8, 8px) 0 !important; }
    .kpi-icon {
      display: flex; align-items: center; justify-content: center;
      width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
    }
    .kpi-icon mat-icon { color: var(--app-surface); font-size: 24px; width: 24px; height: 24px; }
    .kpi-icon--blue { background: var(--app-primary-light); }
    .kpi-icon--green { background: var(--app-chip-allow-text); }
    .kpi-icon--amber { background: var(--app-chip-warn-text); }
    .kpi-icon--orange { background: var(--app-chip-warn-text); }
    .kpi-data { display: flex; flex-direction: column; }
    .kpi-value { font-size: 22px; font-weight: 600; color: var(--app-text); line-height: 1.2; }
    .kpi-label { font-size: var(--app-font-size-body, 14px); color: var(--app-text-secondary); margin-top: 2px; }

    .bottom-row { display: grid; grid-template-columns: 3fr 2fr; gap: var(--app-space-16, 16px); }
    .table-card, .actions-card { border-radius: 14px; }
    .table-card mat-card-header { display: flex; justify-content: space-between; align-items: center; }
    .empty-hint { font-size: var(--app-font-size-body, 14px); color: var(--app-text-secondary); margin: 0; }
    .quick-actions { display: flex; flex-direction: column; gap: 10px; }

    @media (max-width: 1200px) {
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
      .bottom-row { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) { .kpi-row { grid-template-columns: 1fr; } }
  `],
})
export class AdminDashboardPage implements OnInit {
  protected tenantsFacade = inject(TenantsFacade);
  protected policiesFacade = inject(PoliciesFacade);
  protected auditFacade = inject(AuditFacade);
  protected i18n = inject(I18nService);

  loading = () =>
    this.tenantsFacade.loading() || this.policiesFacade.loading() || this.auditFacade.loading();

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.tenantsFacade.loadTenants({ page: 1, pageSize: 1 }),
      this.policiesFacade.loadPolicies({ pageSize: 1 }),
      this.auditFacade.loadAuditLogs({ pageSize: 5 }),
    ]);
  }

  fmtDate(d: string): string {
    return formatDateTime(d);
  }
}
