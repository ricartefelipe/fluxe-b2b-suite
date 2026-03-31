import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'forgot-password', renderMode: RenderMode.Client },
  { path: 'reset-password', renderMode: RenderMode.Client },
  { path: 'profile', renderMode: RenderMode.Client },
  { path: 'orders', renderMode: RenderMode.Client },
  { path: 'orders/:id', renderMode: RenderMode.Client },
  { path: 'checkout', renderMode: RenderMode.Client },
  // Rotas autenticadas: Client evita SSR sem sessionStorage (guard falha no servidor → redirect login).
  { path: '', renderMode: RenderMode.Client },
  { path: 'product/:id', renderMode: RenderMode.Client },
  { path: 'product', renderMode: RenderMode.Client },
  { path: 'products', renderMode: RenderMode.Client },
  { path: 'products/**', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];
