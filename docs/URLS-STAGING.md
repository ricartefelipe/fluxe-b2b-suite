# URLs — Staging (Railway)

Os hosts abaixo (`*-staging.up.railway.app`) pertencem ao projecto Railway **Fluxe B2B Suite — Production**, ambiente **staging** (não confundir com o projecto separado **Fluxe B2B Suite — Staging**, que tem outros `*.up.railway.app`). Se o Ops ou o Admin mostrarem a UI do Shop, veja [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md) e o script `scripts/railway-fix-front-service-configfiles.py --legacy-staging --deploy-v2`. Se o **build** já estiver certo mas o hostname público ainda servir o Shop, no projecto **Fluxe B2B Suite — Staging** use `scripts/railway-alias-staging-public-domains.py` (mutation `serviceDomainUpdate`).

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

- **Modo:** `authMode=hs256` (login com e-mail e senha)
- **Utilizador demo (seed, só em staging):** `admin@local` / `admin123`

## Se as páginas não funcionam

1. **Abra o DevTools do navegador** (F12) → aba **Console** e **Network**. Veja se há erros (CORS, 401, 404, etc.).

2. **Verifique no Railway Dashboard:**
   - Cada serviço **admin-console** e **shop** tem domínio próprio? (Settings → Networking)
   - Variáveis do **spring-saas-core:** `APP_DEV_TOKEN_ENABLED=true` (ou não definida) para login por perfis
   - Variáveis dos **frontends:** `CORE_API_BASE_URL`, `ORDERS_API_BASE_URL`, `PAYMENTS_API_BASE_URL` com as URLs corretas das APIs

3. **CORS:** No spring-saas-core (e node, py), `CORS_ALLOWED_ORIGINS` deve incluir as origens dos frontends (use **exactamente** os hosts da tabela acima):
   ```
   https://ops-portal-staging.up.railway.app,https://admin-console-staging-b1ab.up.railway.app,https://shop-frontend-staging.up.railway.app
   ```
   Ou deixe vazio em staging (usa `*` por padrão no `application.yml` do Core).

4. **Config do frontend:** Acesse `https://ops-portal-staging.up.railway.app/assets/config.json` — deve mostrar as URLs das APIs corretas.

5. **Dashboard Railway:** os três frontends costumam estar no projecto **Fluxe B2B Suite — Staging** (`https://railway.com/project/f83184d7-69fc-4a12-8920-08c433700df0`). Os backends (Core, Orders, Payments) podem estar noutro projecto Railway no mesmo workspace — confirme com `railway link` em cada repositório e [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md).
