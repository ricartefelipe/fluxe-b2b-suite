import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthStore } from '../auth.store';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const store = inject(AuthStore);
  const router = inject(Router);
  const required: string[] = route.data['permissions'] ?? [];
  if (!required.length || store.hasAnyPermission(required)) return true;
  return router.createUrlTree(['/403']);
};
