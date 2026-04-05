import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthStore } from '../auth.store';
import { isKnownPaymentsAbacPermission, sessionPaymentsAbacAllows } from '../payments-abac.policy';
import { isKnownOrdersAbacPermission, sessionOrdersAbacAllows } from '../orders-abac.policy';

function collectAbacKeys(
  route: ActivatedRouteSnapshot,
  singularKey: string,
  pluralKey: string,
): string[] {
  const plural = route.data[pluralKey];
  const singular = route.data[singularKey];
  const out: string[] = [];
  if (Array.isArray(plural)) {
    for (const p of plural) {
      if (typeof p === 'string' && p) out.push(p);
    }
  }
  if (typeof singular === 'string' && singular) out.push(singular);
  return out;
}

/**
 * RBAC via JWT + ABAC espelhado dos serviços (payments / orders).
 * `paymentsAbacPermission(s)` / `paymentsAbacPermissions`
 * `ordersAbacPermission(s)` / `ordersAbacPermissions`
 */
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const store = inject(AuthStore);
  const router = inject(Router);
  const required: string[] = route.data['permissions'] ?? [];
  const mode = route.data['permissionsMode'] === 'all' ? 'all' : 'any';
  if (!required.length) return true;
  const ok =
    mode === 'all' ? store.hasAllPermissions(required) : store.hasAnyPermission(required);
  if (!ok) return router.createUrlTree(['/403']);

  const session = store.session();
  for (const p of collectAbacKeys(route, 'paymentsAbacPermission', 'paymentsAbacPermissions')) {
    if (isKnownPaymentsAbacPermission(p) && !sessionPaymentsAbacAllows(session, p)) {
      return router.createUrlTree(['/403']);
    }
  }
  for (const p of collectAbacKeys(route, 'ordersAbacPermission', 'ordersAbacPermissions')) {
    if (isKnownOrdersAbacPermission(p) && !sessionOrdersAbacAllows(session, p)) {
      return router.createUrlTree(['/403']);
    }
  }
  return true;
};
