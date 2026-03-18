import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth.store';

export const authGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (!store.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  const path = router.url.split('?')[0] ?? '';
  const sess = store.session();
  if (sess?.mustChangePassword && !path.includes('change-password')) {
    return router.createUrlTree(['/change-password']);
  }
  return true;
};
