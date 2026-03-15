export interface AppConfig {
  coreApiBaseUrl: string;
  ordersApiBaseUrl: string;
  paymentsApiBaseUrl: string;
  authMode: 'oidc' | 'dev' | 'hs256';
  /** E-mail de suporte (Fale conosco). Se vazio, usa valor do i18n. */
  supportEmail?: string;
  /** URL da documentação/ajuda (ex.: help center). Se vazio, link "Ajuda" leva para /contact. */
  supportDocsUrl?: string;
  oidc?: {
    issuer: string;
    clientId: string;
    scope: string;
  };
  devAuth?: {
    jwtSecret: string;
  };
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  version: string;
}

export const DEFAULT_CONFIG: AppConfig = {
  coreApiBaseUrl: '/api/core',
  ordersApiBaseUrl: '/api/orders',
  paymentsApiBaseUrl: '/api/payments',
  authMode: 'dev',
  logLevel: 'debug',
  version: '0.0.0',
};
