# Checklist Operacional de Ambientes (com evidencias)

Objetivo: validar e registrar, por ambiente, se a entrega esta realmente ativa.

Preencher este documento em cada janela de release/go-live.

Referencias:
- [AMBIENTES-CONFIGURACAO.md](AMBIENTES-CONFIGURACAO.md)
- [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md)
- [URLS-STAGING.md](URLS-STAGING.md)

---

## Dados da rodada

- Data/hora: `2026-03-31T05:59:07-03:00`
- Responsavel: IA (execucao tecnica) + Felipe (validacao painel)
- Versao/release: alinhamento pos-release (`develop == master` nos 4 repos)
- Observacoes: coleta via Railway CLI (`railway status --json`) e health checks HTTP de staging.

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
| node-b2b-orders (api) | `FAILED` (latest, apos redeploy) | - | `railway status --json` (env staging) | [ ] |
| node-b2b-orders-worker | `SUCCESS` | - | `railway status --json` (env staging) | [x] |
| py-payments-ledger | `FAILED` (latest, apos redeploy) | - | `railway status --json` (env staging) | [ ] |
| shop | `SUCCESS` | - | `railway status --json` (env staging) | [x] |
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
core:
`{"status":"UP","groups":["liveness","readiness"]}`
orders:
`{"status":"ok"}`
payments:
`{"status":"ok"}`
```

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

- [ ] Fronts carregam (shop/admin/ops)
- [x] Fronts carregam (shop/admin/ops)
- [ ] Login funciona
- [ ] Fluxo de pedido minimo ate `CONFIRMED`
- [ ] (Recomendado) fluxo ate `PAID`

### Producao

- [ ] Fronts carregam (shop/admin/ops)
- [ ] Login funciona
- [ ] Fluxo critico principal sem erro

Evidencias (link para print/video/log):

- Staging:
- `curl` em `admin-console`, `ops-portal`, `shop` retornou HTTP 200 (HTML carregado).
- Producao:

---

## 5) Fecho da rodada

- [ ] Checklist completo sem bloqueio aberto
- [ ] Bloqueios remanescentes documentados e com owner
- [ ] Status final: `OK para operacao` ou `NAO OK`

Bloqueios/acoes:

- [ ] **Branch em producao ainda em `develop`** (esperado: `master`) em core/orders/payments/fronts. Owner: Felipe (ajuste no Railway Settings > Source).
- [ ] **Branch em producao ainda em `develop`** (esperado: `master`) em core/orders/payments/fronts. Owner: Felipe (ajuste no Railway Settings > Source).
- [x] **Core production health endpoint agregado** corrigido para `200/UP` (`/actuator/health`).
- [ ] **Worker nao listado em production** (`node-b2b-orders-worker`). Owner: Felipe (confirmar se existe servico dedicado no env production).

