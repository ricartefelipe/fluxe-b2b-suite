import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'product/:id', renderMode: RenderMode.Server },
  { path: 'product', renderMode: RenderMode.Server },
  { path: 'products', renderMode: RenderMode.Server },
  { path: 'products/**', renderMode: RenderMode.Server },
  { path: 'checkout', renderMode: RenderMode.Server },
  { path: 'orders', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Server },
];
