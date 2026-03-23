import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SKIP_TENANT_HEADER } from '@saas-suite/shared/util';
import { AuthStore } from '@saas-suite/shared/auth';
import { TenantContextService } from '@saas-suite/shared/util';

/** Platform tenant UUID — Super Admin (tid "*") uses this for user management. */
const PLATFORM_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_TENANT_HEADER)) return next(req);
  const tenantCtx = inject(TenantContextService, { optional: true });
  const authStore = inject(AuthStore, { optional: true });
  let tenantId = tenantCtx?.getActiveTenantId() ?? authStore?.session()?.tenantId ?? null;
  if (!tenantId) return next(req);
  if (tenantId === '*') tenantId = PLATFORM_TENANT_ID;
  return next(req.clone({ setHeaders: { 'X-Tenant-Id': tenantId } }));
};
