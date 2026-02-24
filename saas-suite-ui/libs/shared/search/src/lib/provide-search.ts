import { InjectionToken, Provider } from '@angular/core';

import { SearchConfig } from './search.model';

export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  enabledEntities: ['order', 'product', 'tenant', 'payment', 'inventory', 'audit'],
  maxResultsPerEntity: 5,
  debounceMs: 300,
};

export const SEARCH_CONFIG = new InjectionToken<SearchConfig>('SEARCH_CONFIG');

export function provideSearch(config?: Partial<SearchConfig>): Provider[] {
  return [
    {
      provide: SEARCH_CONFIG,
      useValue: { ...DEFAULT_SEARCH_CONFIG, ...config },
    },
  ];
}
