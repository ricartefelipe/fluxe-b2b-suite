import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
/* eslint-disable-next-line @nx/enforce-module-boundaries -- circular with shared-auth (AuthStore); see auth.service.ts */
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

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const problem: ProblemDetails | null = isProblemDetails(err.error) ? err.error : null;
      const correlationId =
        problem?.['correlationId'] ?? err.headers?.get('X-Correlation-Id') ?? 'unknown';
      const m = i18n.messages().errors;

      logger.error(`HTTP ${err.status} ${req.url}`, err, { correlationId, status: err.status });

      switch (err.status) {
        case 401:
          auth.clearSession();
          sessionStorage.removeItem('dev_token');
          router.navigate(['/login']);
          snackBar.open(m.unauthorized, 'OK', { duration: 5000 });
          break;
        case 403:
          snackBar.open(
            `${m.forbidden}${problem?.['permissionCode'] ? ` Permissão: ${problem['permissionCode']}` : ''} [${correlationId}]`,
            'OK',
            { duration: 8000 },
          );
          break;
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
