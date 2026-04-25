import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import { createProxyMiddleware } from 'http-proxy-middleware';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

function trimSlash(s: string): string {
  return s.replace(/\/$/, '');
}

/**
 * No Railway, config.json costuma apontar para /api/core (mesmo host). O Express SSR não tinha
 * proxy, pelo que o browser recebia HTML em vez de JSON. Variáveis definidas no entrypoint do
 * container quando CORE_API_BASE_URL (etc.) for URL absoluta.
 */
function useUpstreamProxy(
  localMount: string,
  envName: 'CORE_API_PROXY_TARGET' | 'ORDERS_API_PROXY_TARGET' | 'PAYMENTS_API_PROXY_TARGET',
): void {
  const raw = process.env[envName]?.trim();
  if (!raw || !/^https?:\/\//.test(raw)) {
    return;
  }
  const target = trimSlash(raw);
  const mount = localMount;
  app.use(
    mount,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: (path) => {
        if (path === mount || path === `${mount}/`) {
          return '/';
        }
        if (path.startsWith(`${mount}/`)) {
          return path.slice(mount.length) || '/';
        }
        return path;
      },
    }),
  );
}

app.get('/assets/config.json', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(resolve(browserDistFolder, 'assets/config.json'));
});

useUpstreamProxy('/api/core', 'CORE_API_PROXY_TARGET');
useUpstreamProxy('/api/orders', 'ORDERS_API_PROXY_TARGET');
useUpstreamProxy('/api/payments', 'PAYMENTS_API_PROXY_TARGET');

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next()
    )
    .catch(next);
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
