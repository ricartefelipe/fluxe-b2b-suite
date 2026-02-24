import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '@saas-suite/shared/i18n';
import { Locale } from '@saas-suite/shared/i18n';

interface LocaleOption {
  code: Locale;
  label: string;
  flag: string;
}

const LOCALE_OPTIONS: LocaleOption[] = [
  { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
  { code: 'en-US', label: 'English', flag: '🇺🇸' },
];

@Component({
  selector: 'saas-language-switcher',
  standalone: true,
  imports: [MatButtonModule, MatMenuModule, MatIconModule],
  template: `
    <button mat-button [matMenuTriggerFor]="langMenu" class="lang-btn" aria-label="Switch language">
      <span class="lang-flag">{{ activeOption().flag }}</span>
      <span class="lang-code">{{ activeOption().code }}</span>
      <mat-icon>arrow_drop_down</mat-icon>
    </button>
    <mat-menu #langMenu="matMenu">
      @for (option of options; track option.code) {
        <button
          mat-menu-item
          (click)="switchLocale(option.code)"
          [class.active]="option.code === i18n.locale()"
        >
          <span class="lang-flag">{{ option.flag }}</span>
          <span>{{ option.label }}</span>
        </button>
      }
    </mat-menu>
  `,
  styles: [`
    .lang-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-width: auto;
      padding: 0 8px;
      font-size: 13px;
    }
    .lang-flag { font-size: 16px; line-height: 1; }
    .lang-code { font-weight: 500; }
    .active { background: rgba(0, 0, 0, 0.04); }
  `],
})
export class LanguageSwitcherComponent {
  readonly i18n = inject(I18nService);
  readonly options = LOCALE_OPTIONS;

  readonly activeOption = () =>
    LOCALE_OPTIONS.find(o => o.code === this.i18n.locale()) ?? LOCALE_OPTIONS[0];

  switchLocale(locale: Locale): void {
    this.i18n.setLocale(locale);
  }
}
