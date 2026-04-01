import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthStore } from '../auth.store';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const store = inject(AuthStore);
  const router = inject(Router);
  const required: string[] = route.data['permissions'] ?? [];
  const mode = route.data['permissionsMode'] === 'all' ? 'all' : 'any';
  if (!required.length) return true;
  const ok =
    mode === 'all' ? store.hasAllPermissions(required) : store.hasAnyPermission(required);
  if (ok) return true;
  return router.createUrlTree(['/403']);
};
