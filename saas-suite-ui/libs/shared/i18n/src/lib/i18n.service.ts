import { Injectable, computed, signal } from '@angular/core';
import { Locale, Messages } from './i18n.tokens';
import { PT_BR_MESSAGES } from './pt-br.messages';
import { EN_US_MESSAGES } from './en-us.messages';

const LOCALE_STORAGE_KEY = 'locale';
const DEFAULT_LOCALE: Locale = 'pt-BR';

const MESSAGES_MAP: Record<Locale, Messages> = {
  'pt-BR': PT_BR_MESSAGES,
  'en-US': EN_US_MESSAGES,
};

function isValidLocale(value: string | null): value is Locale {
  return value === 'pt-BR' || value === 'en-US';
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly _locale = signal<Locale>(this.resolveInitialLocale());
  readonly locale = this._locale.asReadonly();
  readonly messages = computed<Messages>(() => MESSAGES_MAP[this._locale()]);

  setLocale(locale: Locale): void {
    this._locale.set(locale);
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }

  private resolveInitialLocale(): Locale {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    return isValidLocale(saved) ? saved : DEFAULT_LOCALE;
  }
}
