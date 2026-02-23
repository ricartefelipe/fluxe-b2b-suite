import { HttpContextToken } from '@angular/common/http';

export const IDEMPOTENCY_KEY = new HttpContextToken<string | null>(() => null);

export const SKIP_TENANT_HEADER = new HttpContextToken<boolean>(() => false);

export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

export const CORRELATION_SCOPE = new HttpContextToken<string | null>(() => null);
