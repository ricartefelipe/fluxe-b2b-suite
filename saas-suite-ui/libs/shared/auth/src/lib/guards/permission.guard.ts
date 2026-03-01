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
  // Em modo dev: se o usuário está autenticado mas o token não tem permissões (ex.: backend fora, token antigo), permite acesso.
  if (config.get('authMode') === 'dev' && store.isAuthenticated() && store.permissions().length === 0) {
    return true;
  }
  return router.createUrlTree(['/403']);
};
