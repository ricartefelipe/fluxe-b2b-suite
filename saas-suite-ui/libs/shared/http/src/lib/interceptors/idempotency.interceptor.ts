import { HttpInterceptorFn } from '@angular/common/http';
import { IDEMPOTENCY_KEY, generateIdempotencyKey } from '@saas-suite/shared/util';

const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export const idempotencyInterceptor: HttpInterceptorFn = (req, next) => {
  if (!MUTATING_METHODS.includes(req.method)) return next(req);
  const key = req.context.get(IDEMPOTENCY_KEY) ?? generateIdempotencyKey('req');
  return next(req.clone({ setHeaders: { 'Idempotency-Key': key } }));
};
