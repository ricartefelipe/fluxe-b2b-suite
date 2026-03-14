import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SKIP_TENANT_HEADER } from '@saas-suite/shared/util';
import { AuthStore } from '@saas-suite/shared/auth';
import { TenantContextService } from '../services/tenant-context-ref.service';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_TENANT_HEADER)) return next(req);
  const tenantCtx = inject(TenantContextService, { optional: true });
  const authStore = inject(AuthStore, { optional: true });
  const tenantId = tenantCtx?.getActiveTenantId() ?? authStore?.session()?.tenantId ?? null;
  if (!tenantId) return next(req);
  return next(req.clone({ setHeaders: { 'X-Tenant-Id': tenantId } }));
};
