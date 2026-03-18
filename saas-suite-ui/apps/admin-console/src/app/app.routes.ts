import { Route } from '@angular/router';
import { authGuard, permissionGuard } from '@saas-suite/shared/auth';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('@saas-suite/shared/auth').then(m => m.LoginPageComponent),
  },
  {
    path: 'signup',
    loadComponent: () => import('@saas-suite/shared/auth').then(m => m.SignupPageComponent),
  },
  {
    path: 'change-password',
    loadComponent: () => import('@saas-suite/shared/auth').then(m => m.ChangePasswordPageComponent),
    canActivate: [authGuard],
  },
  {
    path: '',
    loadComponent: () => import('./admin-shell.component').then(m => m.AdminShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'tenants', pathMatch: 'full' },
      {
        path: 'tenants',
        loadComponent: () => import('./pages/tenants-list.page').then(m => m.TenantsListPage),
        canActivate: [permissionGuard],
        data: { permissions: ['tenants:read'] },
      },
      {
        path: 'tenants/:id',
        loadComponent: () => import('./pages/tenant-detail.page').then(m => m.TenantDetailPage),
        canActivate: [permissionGuard],
        data: { permissions: ['tenants:read'] },
      },
      {
        path: 'policies',
        loadComponent: () => import('./pages/policies-list.page').then(m => m.PoliciesListPage),
        canActivate: [permissionGuard],
        data: { permissions: ['policies:read'] },
      },
      {
        path: 'flags',
        loadComponent: () => import('./pages/flags-list.page').then(m => m.FlagsListPage),
        canActivate: [permissionGuard],
        data: { permissions: ['flags:read'] },
      },
      {
        path: 'audit',
        loadComponent: () => import('./pages/audit-list.page').then(m => m.AuditListPage),
        canActivate: [permissionGuard],
        data: { permissions: ['audit:read'] },
      },
      {
        path: 'ai',
        loadComponent: () => import('./pages/ai.page').then(m => m.AiPage),
        canActivate: [permissionGuard],
        data: { permissions: ['analytics:read'] },
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users-list.page').then(m => m.UsersListPage),
        canActivate: [permissionGuard],
        data: { permissions: ['admin:write'] },
      },
      {
        path: 'onboarding',
        loadComponent: () => import('./pages/tenant-onboarding.page').then(m => m.TenantOnboardingPage),
        canActivate: [permissionGuard],
        data: { permissions: ['tenants:write'] },
      },
      {
        path: 'billing',
        loadComponent: () => import('./pages/billing.page').then(m => m.BillingPage),
        canActivate: [permissionGuard],
        data: { permissions: ['tenants:read'] },
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
