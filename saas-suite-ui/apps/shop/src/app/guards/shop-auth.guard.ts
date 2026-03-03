import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '@saas-suite/shared/auth';

export const shopAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  return router.createUrlTree(['/products'], {
    queryParams: { returnUrl: router.getCurrentNavigation()?.extractedUrl.toString() },
  });
};
