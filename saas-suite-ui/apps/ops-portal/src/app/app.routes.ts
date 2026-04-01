import { Route } from '@angular/router';
import { authGuard, permissionGuard } from '@saas-suite/shared/auth';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('@saas-suite/shared/auth').then(m => m.LoginPageComponent),
    data: { showSignupLink: false },
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('@saas-suite/shared/auth').then(m => m.ForgotPasswordPageComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('@saas-suite/shared/auth').then(m => m.ResetPasswordPageComponent),
  },
  {
    path: 'change-password',
    loadComponent: () => import('@saas-suite/shared/auth').then(m => m.ChangePasswordPageComponent),
    canActivate: [authGuard],
  },
  {
    path: '',
    loadComponent: () => import('./ops-shell.component').then(m => m.OpsShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'orders', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard.page').then(m => m.DashboardPage),
        canActivate: [permissionGuard],
        data: {
          permissions: ['orders:read', 'payments:read', 'inventory:read'],
          permissionsMode: 'all',
        },
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/orders-list.page').then(m => m.OrdersListPage),
        canActivate: [permissionGuard],
        data: { permissions: ['orders:read'] },
      },
      {
        path: 'orders/new',
        loadComponent: () => import('./pages/order-create.page').then(m => m.OrderCreatePage),
        canActivate: [permissionGuard],
        data: { permissions: ['orders:write'] },
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./pages/order-detail.page').then(m => m.OrderDetailPage),
        canActivate: [permissionGuard],
        data: { permissions: ['orders:read'] },
      },
      {
        path: 'inventory/adjustments',
        loadComponent: () => import('./pages/adjustments-list.page').then(m => m.AdjustmentsListPage),
        canActivate: [permissionGuard],
        data: { permissions: ['inventory:read'] },
      },
      {
        path: 'inventory/adjustments/new',
        loadComponent: () => import('./pages/adjustment-create.page').then(m => m.AdjustmentCreatePage),
        canActivate: [permissionGuard],
        data: { permissions: ['inventory:write'] },
      },
      {
        path: 'payments',
        loadComponent: () => import('./pages/payments-list.page').then(m => m.PaymentsListPage),
        canActivate: [permissionGuard],
        data: { permissions: ['payments:read'] },
      },
      {
        path: 'ledger/entries',
        loadComponent: () => import('./pages/ledger-entries.page').then(m => m.LedgerEntriesPage),
        canActivate: [permissionGuard],
        data: { permissions: ['ledger:read'] },
      },
      {
        path: 'ledger/balances',
        loadComponent: () => import('./pages/ledger-balances.page').then(m => m.LedgerBalancesPage),
        canActivate: [permissionGuard],
        data: { permissions: ['ledger:read'] },
      },
      {
        path: 'account/password',
        loadComponent: () => import('@saas-suite/shared/auth').then(m => m.ChangePasswordPageComponent),
        data: { fullPage: false, useOptionalSubtitle: true },
      },
      {
        path: '403',
        loadComponent: () => import('@saas-suite/shared/ui').then(m => m.ErrorPageComponent),
        data: { code: 403, title: 'Acesso Negado', message: 'Você não tem permissão para acessar este recurso.' },
      },
      {
        path: '404',
        loadComponent: () => import('@saas-suite/shared/ui').then(m => m.ErrorPageComponent),
        data: { code: 404 },
      },
      { path: '**', redirectTo: '404' },
    ],
  },
  {
    path: '404',
    loadComponent: () => import('@saas-suite/shared/ui').then(m => m.ErrorPageComponent),
    data: { code: 404 },
  },
  { path: '**', redirectTo: '404', pathMatch: 'full' },
];
