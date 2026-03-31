import { Route } from '@angular/router';
import { shopAuthGuard } from './guards/shop-auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'welcome',
    title: 'Fluxe B2B Suite',
    loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'terms',
    title: 'Termos de Uso | Fluxe B2B Suite',
    loadComponent: () => import('./legal/terms.component').then(m => m.TermsComponent),
  },
  {
    path: 'privacy',
    title: 'Política de Privacidade | Fluxe B2B Suite',
    loadComponent: () => import('./legal/privacy.component').then(m => m.PrivacyComponent),
  },
  {
    path: 'contact',
    title: 'Fale conosco | Fluxe B2B Suite',
    loadComponent: () => import('./legal/contact.component').then(m => m.ContactComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('@saas-suite/shared/auth').then(m => m.LoginPageComponent),
  },
  {
    path: 'forgot-password',
    title: 'Recuperar senha | Fluxe Shop',
    loadComponent: () =>
      import('@saas-suite/shared/auth').then(m => m.ForgotPasswordPageComponent),
  },
  {
    path: 'reset-password',
    title: 'Nova senha | Fluxe Shop',
    loadComponent: () =>
      import('@saas-suite/shared/auth').then(m => m.ResetPasswordPageComponent),
  },
  {
    path: '',
    loadComponent: () => import('./shop-shell.component').then(m => m.ShopShellComponent),
    canActivate: [shopAuthGuard],
    children: [
      { path: '', redirectTo: 'products', pathMatch: 'full' },
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
        path: 'profile',
        title: 'My Profile | Fluxe Shop',
        loadComponent: () =>
          import('./profile/profile.component').then((m) => m.ProfileComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
