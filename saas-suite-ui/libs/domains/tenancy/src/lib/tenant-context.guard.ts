import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantContextStore } from './tenant-context.store';

export const tenantRequiredGuard: CanActivateFn = () => {
  const store = inject(TenantContextStore);
  const router = inject(Router);
  if (store.activeTenantId()) return true;
  return router.createUrlTree(['/']);
};
