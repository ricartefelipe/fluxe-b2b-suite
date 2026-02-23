import { HttpInterceptorFn } from '@angular/common/http';
import { IDEMPOTENCY_KEY } from '@saas-suite/shared/util';

export const idempotencyInterceptor: HttpInterceptorFn = (req, next) => {
  const key = req.context.get(IDEMPOTENCY_KEY);
  if (!key || req.method !== 'POST') return next(req);
  return next(req.clone({ setHeaders: { 'Idempotency-Key': key } }));
};
