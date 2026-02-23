export interface AppConfig {
  coreApiBaseUrl: string;
  ordersApiBaseUrl: string;
  paymentsApiBaseUrl: string;
  authMode: 'oidc' | 'dev';
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
  coreApiBaseUrl: 'http://localhost:8080',
  ordersApiBaseUrl: 'http://localhost:3000',
  paymentsApiBaseUrl: 'http://localhost:8000',
  authMode: 'dev',
  logLevel: 'debug',
  version: '0.0.0',
};
