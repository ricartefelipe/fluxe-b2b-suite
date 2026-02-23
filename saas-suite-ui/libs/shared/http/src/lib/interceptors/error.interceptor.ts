import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStore } from '@saas-suite/shared/auth';
import { LoggerService } from '@saas-suite/shared/telemetry';
import { ProblemDetails, isProblemDetails } from '../models/problem-details.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  const auth = inject(AuthStore);
  const logger = inject(LoggerService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const problem: ProblemDetails | null = isProblemDetails(err.error) ? err.error : null;
      const correlationId =
        problem?.['correlationId'] ?? err.headers?.get('X-Correlation-Id') ?? 'unknown';

      logger.error(`HTTP ${err.status} ${req.url}`, err, { correlationId, status: err.status });

      switch (err.status) {
        case 401:
          auth.clearSession();
          sessionStorage.removeItem('dev_token');
          router.navigate(['/login']);
          snackBar.open('Sessão expirada. Faça login novamente.', 'OK', { duration: 5000 });
          break;
        case 403:
          snackBar.open(
            `Sem permissão. ${problem?.['permissionCode'] ? `Permissão: ${problem['permissionCode']}` : ''} [${correlationId}]`,
            'OK',
            { duration: 8000 },
          );
          break;
        case 404:
          snackBar.open('Recurso não encontrado.', 'OK', { duration: 4000 });
          break;
        case 409:
          snackBar.open(
            `Conflito: ${problem?.['detail'] ?? 'Este recurso já existe ou foi modificado.'}`,
            'OK',
            { duration: 6000 },
          );
          break;
        case 429:
          snackBar.open('Muitas requisições. Aguarde antes de tentar novamente.', 'OK', {
            duration: 8000,
          });
          break;
        default:
          if (err.status >= 500) {
            snackBar.open(`Erro interno do servidor. [${correlationId}]`, 'OK', { duration: 8000 });
          }
      }

      return throwError(() => err);
    }),
  );
};
