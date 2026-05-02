import * as Sentry from '@sentry/angular';

export interface SentryBrowserInitOptions {
  readonly dsn?: string;
  readonly environment?: string;
  readonly tracesSampleRate?: number;
}

let initialized = false;

export function initSentryBrowser(opts: SentryBrowserInitOptions): void {
  if (initialized) {
    return;
  }
  const dsn = opts.dsn?.trim();
  if (!dsn) {
    return;
  }
  initialized = true;
  const rate =
    typeof opts.tracesSampleRate === 'number' && Number.isFinite(opts.tracesSampleRate)
      ? opts.tracesSampleRate
      : 0;
  Sentry.init({
    dsn,
    environment: opts.environment?.trim() || undefined,
    tracesSampleRate: rate,
    sendDefaultPii: false,
  });
}

export function captureClientError(error: unknown): void {
  const err = error instanceof Error ? error : new Error(String(error));
  Sentry.captureException(err);
}
