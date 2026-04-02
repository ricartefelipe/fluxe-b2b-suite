# URLs — Staging (Railway)

Os hosts `*.up.railway.app` são **gerados por serviço** no projeto [Fluxe B2B Suite — Staging](https://railway.com/project/f83184d7-69fc-4a12-8920-08c433700df0). O Railway pode incluir o segmento `production-` no subdomínio mesmo no ambiente de staging — isso **não** é produção real; o que importa é o **serviço** ao qual o domínio está associado.

**Não** use hosts antigos do tipo `ops-portal-staging.up.railway.app` ou `admin-console-staging-b1ab.up.railway.app` para este projeto: na rede pública eles **não** apontam para os serviços admin/ops corretos (costumam servir o Shop ou 404). Confirme sempre com `railway domain --json -s <serviço>` no repo ligado ao projeto.

## Links para acessar (canónicos)

| App | URL |
|-----|-----|
| **Admin Console** | https://admin-console-production-f309.up.railway.app |
| **Ops Portal** | https://ops-portal-production-ee28.up.railway.app |
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

3. **CORS:** No spring-saas-core (e node, py), `CORS_ALLOWED_ORIGINS` deve incluir as origens dos frontends (use as URLs canónicas desta página).
   Ou deixe vazio em staging (usa `*` por padrão no application.yml).

4. **Config do frontend:** Acesse `https://ops-portal-production-ee28.up.railway.app/assets/config.json` — deve mostrar as URLs das APIs corretas.

5. **Dashboard Railway (Fluxe B2B Suite — Staging):** https://railway.com/project/f83184d7-69fc-4a12-8920-08c433700df0
