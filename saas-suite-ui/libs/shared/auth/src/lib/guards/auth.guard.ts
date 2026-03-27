import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthStore } from '../auth.store';

/**
 * Usa `state.url` (destino da navegação), não `router.url` (ainda a rota anterior).
 * Caso contrário, ao ir de /login → /change-password com `mustChangePassword`, o guard
 * ainda vê `/login` e re-dispara redirect, podendo travar ou loopar a navegação.
 */
export const authGuard: CanActivateFn = (_route, state: RouterStateSnapshot) => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (!store.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  const path = (state.url ?? '').split('?')[0] ?? '';
  const sess = store.session();
  const onChangePasswordFlow =
    path.includes('change-password') || path.includes('account/password');
  if (sess?.mustChangePassword && !onChangePasswordFlow) {
    return router.createUrlTree(['/change-password']);
  }
  return true;
};
