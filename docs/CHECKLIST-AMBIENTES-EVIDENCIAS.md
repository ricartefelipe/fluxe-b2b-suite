# Checklist Operacional de Ambientes (com evidencias)

Objetivo: validar e registrar, por ambiente, se a entrega esta realmente ativa.

Preencher este documento em cada janela de release/go-live.

Referencias:
- [AMBIENTES-CONFIGURACAO.md](AMBIENTES-CONFIGURACAO.md)
- [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md)
- [URLS-STAGING.md](URLS-STAGING.md)

---

## Dados da rodada

- Data/hora: `2026-04-01T03:30:00-03:00` (validação técnica + smoke pedido)
- Responsavel: IA (execucao tecnica) + Felipe (validacao negocio / producao quando aplicavel)
- Versao/release: `develop` alinhado; tags `v1.3.0` em suite, orders, payments (core ja tinha `v1.3.0` no remoto)
- Observacoes: `curl` + `scripts/smoke-staging.sh` + `scripts/smoke-order-staging.sh`; Railway `shop-frontend` deploy **SUCCESS** (PR #127 + serviceInstance fix).

---

## 1) Branch por servico (Railway)

### Staging

| Servico | Branch configurada | Esperado | OK |
|---|---|---|---|
| spring-saas-core | `develop` | `develop` | [x] |
| node-b2b-orders (api) | `develop` | `develop` | [x] |
| node-b2b-orders-worker | `develop` | `develop` | [x] |
| py-payments-ledger | `develop` | `develop` | [x] |
| shop | `develop` | `develop` | [x] |
| admin-console | `develop` | `develop` | [x] |
| ops-portal | `develop` | `develop` | [x] |

### Producao

| Servico | Branch configurada | Esperado | OK |
|---|---|---|---|
| spring-saas-core | `develop` | `master` | [ ] |
| node-b2b-orders (api) | `develop` | `master` | [ ] |
| node-b2b-orders-worker | _nao listado no env production_ | `master` | [ ] |
| py-payments-ledger | `develop` | `master` | [ ] |
| shop | `develop` | `master` | [ ] |
| admin-console | `develop` | `master` | [ ] |
| ops-portal | `develop` | `master` | [ ] |

---

## 2) Ultimo deploy por servico

### Staging

| Servico | Status ultimo deploy | Horario | Link/evidencia | OK |
|---|---|---|---|---|
| spring-saas-core | `SUCCESS` | - | `railway status --json` (env staging) | [x] |
| node-b2b-orders (api) | `SUCCESS` | - | `railway status --json` (env staging, 2026-03-31) | [x] |
| node-b2b-orders-worker | `SUCCESS` | - | `railway status --json` (env staging) | [x] |
| py-payments-ledger | `SUCCESS` | - | `railway status --json` (env staging, 2026-03-31) | [x] |
| shop-frontend | `SUCCESS` | - | Deploy `ff3084b3-...` (2026-04-01); `configErrors` ausente; `dockerfilePath` `apps/shop/Dockerfile` | [x] |
| admin-console | `SUCCESS` | - | `railway status --json` (env staging) | [x] |
| ops-portal | `SUCCESS` | - | `railway status --json` (env staging) | [x] |

### Producao

| Servico | Status ultimo deploy | Horario | Link/evidencia | OK |
|---|---|---|---|---|
| spring-saas-core | `SUCCESS` (latest deployment) | - | `railway status --json` (env production) | [x] |
| node-b2b-orders (api) | `SUCCESS` (latest deployment) | - | `railway status --json` (env production) | [x] |
| node-b2b-orders-worker | _nao listado no env production_ | - | `railway status --json` (env production) | [ ] |
| py-payments-ledger | `SUCCESS` (latest deployment) | - | `railway status --json` (env production) | [x] |
| shop | `SUCCESS` | - | `railway status --json` (env production) | [x] |
| admin-console | `SUCCESS` | - | `railway status --json` (env production) | [x] |
| ops-portal | `SUCCESS` | - | `railway status --json` (env production) | [x] |

---

## 3) Health checks (evidencia tecnica)

### Staging (URLs base em `URLS-STAGING.md`)

- [x] Core: `GET /actuator/health` = 200
- [x] Orders: `GET /v1/healthz` = 200
- [x] Payments: `GET /healthz` = 200

Evidencias (colar resposta curta/log):

```txt
core (liveness 200):
`{"status":"UP","components":{"livenessState":{"status":"UP"}}}`
orders:
`{"status":"ok"}`
payments:
`{"status":"ok"}`
```
Rodada `2026-03-31`: `curl -sS -o /dev/null -w "%{http_code}"` → 200 nos tres endpoints em `URLS-STAGING.md`.

### Producao

- [x] Core: `GET /actuator/health` = 200
- [x] Orders: `GET /v1/healthz` = 200
- [x] Payments: `GET /healthz` = 200

Evidencias (colar resposta curta/log):

```txt
core:
`{"status":"UP","groups":["liveness","readiness"]}`
orders:
`{"status":"ok"}`
payments:
`{"status":"ok"}`
```

---

## 4) Validacao funcional minima

### Staging

- [x] Fronts carregam (shop/admin/ops) — HTTP 200 (`curl` 2026-04-01)
- [x] Login funciona — `POST /v1/auth/token` OK no smoke (`scripts/smoke-order-staging.sh`, utilizador seed `ops@demo.example.com` / tenant `tenant_demo`)
- [x] Fluxo de pedido minimo ate `CONFIRMED` — mesmo script ate confirmacao
- [ ] (Recomendado) fluxo ate `PAID` — requer `SMOKE_PAYMENT_PAID=1`+broker ou `SMOKE_SAGA_PAID_LEDGER=1` (ver [CHECKLIST-PEDIDO-STAGING.md](CHECKLIST-PEDIDO-STAGING.md))

### Producao

- [ ] Fronts carregam (shop/admin/ops)
- [ ] Login funciona
- [ ] Fluxo critico principal sem erro

Evidencias (link para print/video/log):

- Staging: `curl` em admin-console, ops-portal, shop → HTTP 200 (HTML), 2026-03-31.
- Producao: nao revalidado nesta rodada (foco staging).

---

## 5) Postgres (Railway) — limpeza de variáveis

Projeto **Fluxe B2B Suite - Staging**, serviço **Postgres**, `railway variables` (2026-03-31):

- [x] **`TEST_VAR`** — ausente (removida ou nunca existiu neste serviço).
- [x] **`SSL_CERT_DAYS`** — ausente idem.
- Variáveis listadas: credenciais Postgres, `DATABASE_*`, metadados Railway, referências `RAILWAY_SERVICE_*_URL` para URLs publicas dos backends.

---

## 6) Fecho da rodada

- [ ] Checklist completo sem bloqueio aberto — **staging stack tecnica OK**; producao e branch `master` no projeto Production continuam acao humana
- [x] Bloqueios remanescentes documentados e com owner (ver abaixo)
- [x] Status final (staging): **`OK para operacao` (stack tecnica)** — HTTP + smoke pedido ate `CONFIRMED`; `PAID` opcional pendente

Bloqueios/acoes:

- [ ] **Branch em producao ainda em `develop`** (esperado: `master`) nos serviços do projeto Production no Railway. Owner: Felipe (Settings → Source por serviço).
- [x] **Core production health endpoint agregado** corrigido para `200/UP` (`/actuator/health`).
- [ ] **Worker nao listado em production** (`node-b2b-orders-worker`). Owner: Felipe (confirmar se existe servico dedicado no env production).
- [x] **shop-frontend (staging)** — deploy **SUCCESS** apos `serviceInstanceUpdate` + PR #127 (gatilho); manifesto com `apps/shop/Dockerfile`.

