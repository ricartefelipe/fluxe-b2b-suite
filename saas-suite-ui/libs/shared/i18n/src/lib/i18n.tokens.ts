import { InjectionToken } from '@angular/core';

export interface Messages {
  common: { save: string; cancel: string; confirm: string; delete: string; loading: string; noData: string; };
  errors: { unauthorized: string; forbidden: string; notFound: string; conflict: string; rateLimit: string; serverError: string; };
  tenant: { selectTenant: string; noTenantSelected: string; };
}

export const MESSAGES = new InjectionToken<Messages>('MESSAGES');
