import { Route } from '@angular/router';
import { authGuard } from '@saas-suite/shared/auth';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('@saas-suite/shared/auth').then(m => m.DevLoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./ops-shell.component').then(m => m.OpsShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'orders', pathMatch: 'full' },
      {
        path: 'orders',
        loadComponent: () => import('./pages/orders-list.page').then(m => m.OrdersListPage),
        data: { permissions: ['orders:read'] },
      },
      {
        path: 'orders/new',
        loadComponent: () => import('./pages/order-create.page').then(m => m.OrderCreatePage),
        data: { permissions: ['orders:write'] },
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./pages/order-detail.page').then(m => m.OrderDetailPage),
        data: { permissions: ['orders:read'] },
      },
      {
        path: 'inventory/adjustments',
        loadComponent: () => import('./pages/adjustments-list.page').then(m => m.AdjustmentsListPage),
        data: { permissions: ['inventory:read'] },
      },
      {
        path: 'inventory/adjustments/new',
        loadComponent: () => import('./pages/adjustment-create.page').then(m => m.AdjustmentCreatePage),
        data: { permissions: ['inventory:write'] },
      },
      {
        path: 'payments',
        loadComponent: () => import('./pages/payments-list.page').then(m => m.PaymentsListPage),
        data: { permissions: ['payments:read'] },
      },
      {
        path: 'ledger/entries',
        loadComponent: () => import('./pages/ledger-entries.page').then(m => m.LedgerEntriesPage),
        data: { permissions: ['ledger:read'] },
      },
      {
        path: 'ledger/balances',
        loadComponent: () => import('./pages/ledger-balances.page').then(m => m.LedgerBalancesPage),
        data: { permissions: ['ledger:read'] },
      },
      {
        path: '403',
        loadComponent: () => import('@saas-suite/shared/ui').then(m => m.ErrorPageComponent),
        data: { code: 403, title: 'Acesso Negado', message: 'Você não tem permissão para acessar este recurso.' },
      },
    ],
  },
];
