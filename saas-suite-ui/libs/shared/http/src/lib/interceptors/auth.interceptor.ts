import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
/* eslint-disable-next-line @nx/enforce-module-boundaries -- circular with shared-auth (AuthStore); see auth.service.ts */
import { AuthStore } from '@saas-suite/shared/auth';
import { SKIP_AUTH } from '@saas-suite/shared/util';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_AUTH)) return next(req);
  const store = inject(AuthStore);
  const token = store.accessToken();
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
