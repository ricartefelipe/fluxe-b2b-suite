export interface AppConfig {
  coreApiBaseUrl: string;
  ordersApiBaseUrl: string;
  paymentsApiBaseUrl: string;
  authMode: 'oidc' | 'dev' | 'hs256';
  /** E-mail de suporte (Fale conosco). Se vazio, usa valor do i18n. */
  supportEmail?: string;
  /** URL da documentação/ajuda (ex.: help center). Se vazio, link "Ajuda" leva para /contact. */
  supportDocsUrl?: string;
  /** URL externa da documentação da plataforma (contratos, pipelines). Opcional; exibida em Ajuda. */
  platformDocsUrl?: string;
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
  /** DSN do Sentry (browser). Vazio ou omitido desativa o envio. */
  sentryDsn?: string;
  sentryEnvironment?: string;
  /** 0–1; fora desse intervalo usa 0. */
  sentryTracesSampleRate?: number;
}

export const DEFAULT_CONFIG: AppConfig = {
  coreApiBaseUrl: '/api/core',
  ordersApiBaseUrl: '/api/orders',
  paymentsApiBaseUrl: '/api/payments',
  authMode: 'dev',
  logLevel: 'debug',
  version: '0.0.0',
};
