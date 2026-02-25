import { Injectable, InjectionToken, inject, isDevMode } from '@angular/core';

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

export type LogHandler = (entry: LogEntry) => void;
export const LOG_HANDLERS = new InjectionToken<LogHandler[]>('LOG_HANDLERS');

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private handlers = inject(LOG_HANDLERS, { optional: true }) ?? [];
  private isDev = isDevMode();

  private log(level: LogEntry['level'], message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = { level, message, context, timestamp: new Date().toISOString() };

    if (this.isDev) {
      const fn: (arg: string, ...rest: unknown[]) => void =
        level === 'error' ? console.error
        : level === 'warn' ? console.warn
        : level === 'debug' ? console.debug
        : console.info;
      const logFn = typeof fn === 'function' ? fn : console.log;
      logFn(`[${entry.timestamp}] [${level.toUpperCase()}] ${message}`, context ?? '');
    }

    this.handlers.forEach(h => h(entry));
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.isDev) this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    this.log('error', message, {
      ...context,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    });
  }
}
