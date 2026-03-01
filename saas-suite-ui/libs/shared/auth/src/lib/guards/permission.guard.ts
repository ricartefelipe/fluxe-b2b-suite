import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthStore } from '../auth.store';
import { RuntimeConfigService } from '@saas-suite/shared/config';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const store = inject(AuthStore);
  const router = inject(Router);
  const config = inject(RuntimeConfigService);
  const required: string[] = route.data['permissions'] ?? [];
  if (!required.length) return true;
  if (store.hasAnyPermission(required)) return true;
  // Em modo dev: usuário autenticado pode acessar todas as rotas (bypass de permissões para demo).
  if (config.get('authMode') === 'dev' && store.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/403']);
};
