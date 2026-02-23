import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { generateUUID, CORRELATION_SCOPE } from '@saas-suite/shared/util';
import { CorrelationContextService } from '../services/correlation-context.service';

export const correlationInterceptor: HttpInterceptorFn = (req, next) => {
  const ctx = inject(CorrelationContextService);
  const scopeOverride = req.context.get(CORRELATION_SCOPE);
  const correlationId = scopeOverride ?? ctx.getCurrentScope() ?? generateUUID();
  return next(req.clone({ setHeaders: { 'X-Correlation-Id': correlationId } }));
};
