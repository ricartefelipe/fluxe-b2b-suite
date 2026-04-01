import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStore } from '@saas-suite/shared/auth';
import { LoggerService } from '@saas-suite/shared/telemetry';
import { I18nService } from '@saas-suite/shared/i18n';
import { ProblemDetails, isProblemDetails } from '../models/problem-details.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  const auth = inject(AuthStore);
  const logger = inject(LoggerService);
  const i18n = inject(I18nService);
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const problem: ProblemDetails | null = isProblemDetails(err.error) ? err.error : null;
      const correlationId =
        (typeof problem?.correlationId === 'string' && problem.correlationId) ||
        (typeof problem?.['correlation_id'] === 'string' && problem['correlation_id']) ||
        err.headers?.get('X-Correlation-Id') ||
        'unknown';
      const m = i18n.messages().errors;

      logger.error(`HTTP ${err.status} ${req.url}`, err, { correlationId, status: err.status });

      switch (err.status) {
        case 401:
          auth.clearSession();
          if (isBrowser) sessionStorage.removeItem('dev_token');
          router.navigate(['/login']);
          snackBar.open(m.unauthorized, 'OK', { duration: 5000 });
          break;
        case 403: {
          const detail =
            typeof problem?.detail === 'string' && problem.detail.trim().length > 0
              ? ` ${problem.detail.trim()}`
              : '';
          const perm =
            typeof problem?.permissionCode === 'string' && problem.permissionCode
              ? ` Permissão: ${problem.permissionCode}`
              : '';
          snackBar.open(`${m.forbidden}${detail}${perm} [${correlationId}]`, 'OK', {
            duration: 8000,
          });
          break;
        }
        case 404:
          snackBar.open(m.notFound, 'OK', { duration: 4000 });
          break;
        case 409:
          snackBar.open(
            `${m.conflict} ${problem?.['detail'] ?? ''}`.trim(),
            'OK',
            { duration: 6000 },
          );
          break;
        case 429:
          snackBar.open(m.rateLimit, 'OK', { duration: 8000 });
          break;
        default:
          if (err.status >= 500) {
            snackBar.open(`${m.serverError} [${correlationId}]`, 'OK', { duration: 8000 });
          }
      }

      return throwError(() => err);
    }),
  );
};
