import { Route } from '@angular/router';
import { shopAuthGuard } from './guards/shop-auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('@saas-suite/shared/auth').then(m => m.LoginPageComponent),
  },
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
    canActivate: [shopAuthGuard],
    loadComponent: () =>
      import('./checkout/checkout.component').then((m) => m.CheckoutComponent),
  },
  {
    path: 'orders',
    canActivate: [shopAuthGuard],
    children: [
      {
        path: '',
        title: 'My Orders | Fluxe Shop',
        loadComponent: () =>
          import('./orders/orders.component').then((m) => m.OrdersComponent),
      },
      {
        path: ':id',
        title: 'Order Detail | Fluxe Shop',
        loadComponent: () =>
          import('./orders/order-detail.component').then((m) => m.OrderDetailComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'products',
  },
];
