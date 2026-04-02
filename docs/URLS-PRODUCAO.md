# URLs — Produção (Railway)

Hosts canónicos do projeto **Fluxe B2B Suite - Production** no Railway (branch **`master`**). O Railway gera subdomínios únicos; **não** use `spring-saas-core.up.railway.app` sem o sufixo `-production` — esse padrão não corresponde ao serviço real e devolve 404.

## Frontends

| App | URL |
|-----|-----|
| **Shop** | https://shop-frontend-production-ecc9.up.railway.app |
| **Ops Portal** | https://ops-portal-production-186d.up.railway.app |
| **Admin Console** | https://admin-console-production-85eb.up.railway.app |

## APIs (backends)

| Serviço | URL base | Health |
|---------|----------|--------|
| spring-saas-core | https://spring-saas-core-production.up.railway.app | `/actuator/health` |
| node-b2b-orders | https://node-b2b-orders-production.up.railway.app | `/v1/healthz` |
| py-payments-ledger | https://py-payments-ledger-production.up.railway.app | `/healthz` |

## Variáveis nos fronts (Railway)

Nos serviços **shop**, **ops-portal** e **admin-console**, use as URLs **exatas** acima em:

- `CORE_API_BASE_URL` → `https://spring-saas-core-production.up.railway.app`
- `ORDERS_API_BASE_URL` → `https://node-b2b-orders-production.up.railway.app`
- `PAYMENTS_API_BASE_URL` → `https://py-payments-ledger-production.up.railway.app`

Ver também `saas-suite-ui/railway.prod.env.example`.

## Quando mudar estes valores

- Novo projeto Railway ou **regenerar domínio** do serviço: copie o host em **Settings → Networking** de cada serviço e actualize este ficheiro e os exemplos.

## Verificação rápida

```bash
curl -sf "https://spring-saas-core-production.up.railway.app/actuator/health"
curl -sf "https://node-b2b-orders-production.up.railway.app/v1/healthz"
curl -sf "https://py-payments-ledger-production.up.railway.app/healthz"
```
