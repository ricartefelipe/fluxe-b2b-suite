import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthStore } from '../auth.store';
import { isKnownPaymentsAbacPermission, sessionPaymentsAbacAllows } from '../payments-abac.policy';

/** Rota pode definir `paymentsAbacPermission: 'ledger:read'` para alinhar ao ABAC do py-payments-ledger. */
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const store = inject(AuthStore);
  const router = inject(Router);
  const required: string[] = route.data['permissions'] ?? [];
  const mode = route.data['permissionsMode'] === 'all' ? 'all' : 'any';
  if (!required.length) return true;
  const ok =
    mode === 'all' ? store.hasAllPermissions(required) : store.hasAnyPermission(required);
  if (!ok) return router.createUrlTree(['/403']);

  const abac = route.data['paymentsAbacPermission'] as string | undefined;
  if (abac && isKnownPaymentsAbacPermission(abac)) {
    if (!sessionPaymentsAbacAllows(store.session(), abac)) {
      return router.createUrlTree(['/403']);
    }
  }
  return true;
};
