import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '@saas-suite/shared/i18n';

export interface ChangelogEntry {
  version: string;
  date: string;
  items: string[];
}

const DEFAULT_CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.2.0',
    date: '2026-03-18',
    items: [
      'Checklist de onboarding no admin (criar tenant, convidar usuário, configurar billing).',
      'Painel de uso no billing (uso vs limite do plano).',
      'Páginas Status e Changelog no admin.',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-03-18',
    items: [
      'Tela de ajuste de senha no menu do usuário (admin e ops).',
      'Rota /account/password dentro do shell.',
    ],
  },
];

@Component({
  selector: 'app-changelog-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="changelog-page">
      <header class="changelog-header">
        <mat-icon class="header-icon">history</mat-icon>
        <h1>{{ title() }}</h1>
      </header>
      <mat-card class="changelog-card">
        <mat-card-content>
          @for (entry of entries; track entry.version) {
            <div class="changelog-entry">
              <div class="entry-header">
                <span class="entry-version">v{{ entry.version }}</span>
                <span class="entry-date">{{ entry.date }}</span>
              </div>
              <ul class="entry-items">
                @for (item of entry.items; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .changelog-page { padding: 24px; max-width: 720px; margin: 0 auto; }
    .changelog-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .header-icon { font-size: 32px; width: 32px; height: 32px; color: var(--app-primary, #1565c0); }
    .changelog-header h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .changelog-card { border-radius: 12px; }
    .changelog-entry { padding: 16px 0; border-bottom: 1px solid #eee; }
    .changelog-entry:last-child { border-bottom: none; }
    .entry-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .entry-version { font-weight: 600; font-size: 16px; color: var(--app-text, #212121); }
    .entry-date { font-size: 13px; color: var(--app-text-secondary, #666); }
    .entry-items { margin: 0; padding-left: 20px; color: var(--app-text-secondary, #546e7a); font-size: 14px; line-height: 1.6; }
  `],
})
export class ChangelogPage {
  entries: ChangelogEntry[] = DEFAULT_CHANGELOG;
  private i18n = inject(I18nService);

  title = () => this.i18n.messages()?.changelog?.title ?? 'Changelog';
}
