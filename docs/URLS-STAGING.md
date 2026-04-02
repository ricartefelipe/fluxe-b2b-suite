# URLs — Staging (Railway)

Os hosts abaixo (`*-staging.up.railway.app`) pertencem ao projecto Railway **Fluxe B2B Suite — Production**, ambiente **staging** (não confundir com o projecto separado **Fluxe B2B Suite — Staging**, que tem outros `*.up.railway.app`). Se o Ops ou o Admin mostrarem a UI do Shop, veja [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md) e o script `scripts/railway-fix-front-service-configfiles.py --legacy-staging --deploy-v2`.

## Links para acessar

| App | URL |
|-----|-----|
| **Admin Console** | https://admin-console-staging-b1ab.up.railway.app |
| **Ops Portal** | https://ops-portal-staging.up.railway.app |
| **Shop** | https://shop-frontend-staging.up.railway.app |

## APIs (backends)

| Serviço | URL | Health |
|---------|-----|--------|
| spring-saas-core | https://spring-saas-core-staging.up.railway.app | `/actuator/health` |
| node-b2b-orders | https://node-b2b-orders-staging.up.railway.app | `/v1/healthz` |
| py-payments-ledger | https://py-payments-ledger-staging.up.railway.app | `/healthz` |

## Login (Staging)

- **Modo:** `authMode=hs256` (login com perfis rápidos ou e-mail/senha)
- **Usuário demo (seed):** `admin@local` / `admin123` (ou perfis rápidos na tela)

## Se as páginas não funcionam

1. **Abra o DevTools do navegador** (F12) → aba **Console** e **Network**. Veja se há erros (CORS, 401, 404, etc.).

2. **Verifique no Railway Dashboard:**
   - Cada serviço **admin-console** e **shop** tem domínio próprio? (Settings → Networking)
   - Variáveis do **spring-saas-core:** `APP_DEV_TOKEN_ENABLED=true` (ou não definida) para login por perfis
   - Variáveis dos **frontends:** `CORE_API_BASE_URL`, `ORDERS_API_BASE_URL`, `PAYMENTS_API_BASE_URL` com as URLs corretas das APIs

3. **CORS:** No spring-saas-core (e node, py), `CORS_ALLOWED_ORIGINS` deve incluir as origens dos frontends:
   ```
   https://ops-portal-staging.up.railway.app,https://admin-console-staging.up.railway.app,https://shop-staging.up.railway.app
   ```
   Ou deixe vazio em staging (usa `*` por padrão no application.yml).

4. **Config do frontend:** Acesse `https://ops-portal-staging.up.railway.app/assets/config.json` — deve mostrar as URLs das APIs corretas.

5. **Dashboard Railway:** https://railway.com/project/b3912187-cdc0-4d3e-b924-1cb74b519cbc
