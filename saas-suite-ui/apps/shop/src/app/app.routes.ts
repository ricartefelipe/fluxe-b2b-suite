import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full',
  },
  {
    path: 'products',
    loadChildren: () =>
      import('@union.solutions/shop/feature-products').then(m => m.featureProductsRoutes),
  },
  {
    path: 'products',
    loadChildren: () =>
      import('@union.solutions/shop/feature-product-detail').then(
        m => m.featureProductDetailRoutes
      ),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./checkout/checkout.component').then((m) => m.CheckoutComponent),
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./orders/orders.component').then((m) => m.OrdersComponent),
  },
  {
    path: '**',
    redirectTo: 'products',
  },
];
