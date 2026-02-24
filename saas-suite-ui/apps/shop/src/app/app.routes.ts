import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full',
  },
  {
    path: 'products',
    title: 'Products | Fluxe Shop',
    data: { preload: true },
    loadChildren: () =>
      import('@union.solutions/shop/feature-products').then(m => m.featureProductsRoutes),
  },
  {
    path: 'product',
    title: 'Product Details | Fluxe Shop',
    data: { preload: true },
    loadChildren: () =>
      import('@union.solutions/shop/feature-product-detail').then(
        m => m.featureProductDetailRoutes
      ),
  },
  {
    path: 'checkout',
    title: 'Checkout | Fluxe Shop',
    loadComponent: () =>
      import('./checkout/checkout.component').then((m) => m.CheckoutComponent),
  },
  {
    path: 'orders',
    title: 'My Orders | Fluxe Shop',
    loadComponent: () =>
      import('./orders/orders.component').then((m) => m.OrdersComponent),
  },
  {
    path: '**',
    redirectTo: 'products',
  },
];
