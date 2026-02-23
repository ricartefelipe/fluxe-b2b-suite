import { Route } from '@angular/router';
import { authGuard } from '@saas-suite/shared/auth';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('@saas-suite/shared/auth').then(m => m.DevLoginComponent),
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
        data: { permissions: ['tenants:read'] },
      },
      {
        path: 'tenants/:id',
        loadComponent: () => import('./pages/tenant-detail.page').then(m => m.TenantDetailPage),
        data: { permissions: ['tenants:read'] },
      },
      {
        path: 'policies',
        loadComponent: () => import('./pages/policies-list.page').then(m => m.PoliciesListPage),
        data: { permissions: ['policies:read'] },
      },
      {
        path: 'flags',
        loadComponent: () => import('./pages/flags-list.page').then(m => m.FlagsListPage),
        data: { permissions: ['flags:read'] },
      },
      {
        path: 'audit',
        loadComponent: () => import('./pages/audit-list.page').then(m => m.AuditListPage),
        data: { permissions: ['audit:read'] },
      },
      {
        path: '403',
        loadComponent: () => import('@saas-suite/shared/ui').then(m => m.ErrorPageComponent),
        data: { code: 403, title: 'Acesso Negado', message: 'Você não tem permissão para acessar este recurso.' },
      },
    ],
  },
];
