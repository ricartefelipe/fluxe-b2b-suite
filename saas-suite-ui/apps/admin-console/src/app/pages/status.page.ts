import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '@saas-suite/shared/i18n';

export interface ServiceStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'outage';
}

const DEFAULT_SERVICES: ServiceStatus[] = [
  { id: 'core', name: 'API Core', status: 'operational' },
  { id: 'admin', name: 'Admin Console', status: 'operational' },
  { id: 'ops', name: 'Ops Portal', status: 'operational' },
  { id: 'shop', name: 'Shop', status: 'operational' },
];

@Component({
  selector: 'app-status-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="status-page">
      <header class="status-header">
        <mat-icon class="header-icon">info</mat-icon>
        <h1>{{ title() }}</h1>
      </header>
      <mat-card class="status-card">
        <mat-card-content>
          <ul class="service-list">
            @for (svc of services; track svc.id) {
              <li class="service-item">
                <mat-icon class="status-icon" [class]="'status-' + svc.status">
                  {{ statusIcon(svc.status) }}
                </mat-icon>
                <span class="service-name">{{ svc.name }}</span>
                <span class="service-badge" [class]="'badge-' + svc.status">
                  {{ statusLabel(svc.status) }}
                </span>
              </li>
            }
          </ul>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .status-page { padding: 24px; max-width: 640px; margin: 0 auto; }
    .status-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .header-icon { font-size: 32px; width: 32px; height: 32px; color: var(--app-primary, #1565c0); }
    .status-header h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .status-card { border-radius: 12px; }
    .service-list { list-style: none; padding: 0; margin: 0; }
    .service-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 0; border-bottom: 1px solid #eee;
    }
    .service-item:last-child { border-bottom: none; }
    .status-icon { font-size: 20px; width: 20px; height: 20px; }
    .status-operational { color: #2e7d32; }
    .status-degraded { color: #ed6c02; }
    .status-outage { color: #c62828; }
    .service-name { flex: 1; font-size: 15px; }
    .service-badge { font-size: 12px; font-weight: 500; text-transform: uppercase; }
    .badge-operational { color: #2e7d32; }
    .badge-degraded { color: #ed6c02; }
    .badge-outage { color: #c62828; }
  `],
})
export class StatusPage {
  services: ServiceStatus[] = DEFAULT_SERVICES;
  private i18n = inject(I18nService);

  title = () => this.i18n.messages()?.status?.title ?? 'Status dos serviços';
  statusLabel = (s: ServiceStatus['status']) =>
    this.i18n.messages()?.status?.[s === 'operational' ? 'operational' : s === 'degraded' ? 'degraded' : 'outage'] ?? s;
  statusIcon = (s: ServiceStatus['status']) =>
    s === 'operational' ? 'check_circle' : s === 'degraded' ? 'warning' : 'error';
}
