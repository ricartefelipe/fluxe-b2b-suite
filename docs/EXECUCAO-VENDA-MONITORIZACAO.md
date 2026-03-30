# Execução — venda e monitorização (playbook único)

Documento **único** para percorrer, em ordem, o que precisas fazer para **vender com confiança** e **observar o comportamento certo** (incluindo saga pedido → pagamento → **PAID**). Não substitui os guias detalhados — aponta para eles.

---

## O que significa “fazer tudo”

| Tipo | O quê |
|------|--------|
| **No repositório** | Scripts de smoke, `verify:contracts`, docs, CI — já automatizáveis localmente ou no GitHub. |
| **Contigo / equipa** | Railway, domínios, Stripe/Resend/OIDC em produção, secrets, merge `develop` → `master`, alertas nos painéis. |
| **Já coberto como “100% vendável” (checklist de produto)** | Ver [O-QUE-FALTA-100-VENDAVEL.md](O-QUE-FALTA-100-VENDAVEL.md) — itens de legal, billing, suporte, CORS, etc. |

Este playbook foca **operação e prova de comportamento** depois disso.

---

## Fase 1 — Staging (`develop`) estável

1. CI verde nos quatro repositórios (últimos merges em `develop`).
2. Gate local (opcional mas recomendado): na raiz do `fluxe-b2b-suite`, `pnpm verify:all` ou `./scripts/pre-merge-checks.sh`.
3. Contratos: `pnpm verify:contracts` (ou `./scripts/check-contract-drift.sh` com os quatro repos lado a lado).
4. Smoke HTTP por serviço: secrets `CORE_SMOKE_URL`, `ORDERS_SMOKE_URL`, `PAYMENTS_SMOKE_URL` no GitHub ou `pnpm smoke:staging` com as variáveis exportadas — ver bloco *Smoke HTTP pós-merge* em [PIPELINE-ESTEIRAS.md](PIPELINE-ESTEIRAS.md).
5. **Pedido mínimo (HTTP):** `pnpm smoke:order-staging` com `ORDERS_SMOKE_URL` — [CHECKLIST-PEDIDO-STAGING.md](CHECKLIST-PEDIDO-STAGING.md).
6. **Pedido até PAID (integração Rabbit + workers):**
   - **Manual:** `pnpm smoke:order-staging:paid` + `RABBITMQ_URL` alinhada à API/worker de orders.
   - **Saga completa:** `pnpm smoke:order-staging:saga` — exige **node-b2b-orders** e **py-payments-ledger** com workers no **mesmo** broker, gateway que autorize em staging, e flags de integração ativas — detalhes no mesmo checklist.
7. Confirmar no painel RabbitMQ (staging): filas sem crescimento anómalo; DLQ em zero ou tratada — ver thresholds em [MONITORING-THRESHOLDS.md](MONITORING-THRESHOLDS.md).

---

## Fase 2 — Monitorização (staging primeiro, depois produção)

1. Ler e aplicar [MONITORING-THRESHOLDS.md](MONITORING-THRESHOLDS.md) (p95, 5xx, filas, smoke pós-deploy).
2. **Railway:** health check por serviço no path correto (Core actuator, orders `/v1/healthz`, payments `/healthz`).
3. **Métricas:** seguir [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md#métricas-e-grafana-no-deploy) — scrape Prometheus, dashboards em `monitoring/grafana/dashboards/`.
4. **Logs e correlação:** [OBSERVABILITY.md](OBSERVABILITY.md) — usar `correlation id` ao cruzar orders ↔ payments.
5. **Saga pedido → PAID:** além de DLQ e outbox, vigiar fila **`orders.payments`** (consumo de `payment.settled` pelo worker de orders). Referência de eventos: [CATALOGO-EVENTOS.md](CATALOGO-EVENTOS.md) e contrato em `spring-saas-core` / espelhos `docs/contracts/events.md`.

---

## Fase 3 — Promoção para produção

1. Checklist único: [CHECKLIST-PROMOCAO-DEVELOP-MASTER.md](CHECKLIST-PROMOCAO-DEVELOP-MASTER.md) (CI, staging, contratos, observabilidade, release notes, rollback).
2. Política de risco: [POLITICA-FREEZE-RELEASE.md](POLITICA-FREEZE-RELEASE.md).
3. Merge `develop` → `master` via PR; tags se o processo o exigir — [PIPELINE-ESTEIRAS.md](PIPELINE-ESTEIRAS.md).

---

## Fase 4 — Produção (go-live)

1. Executar **todo** o [GO-LIVE-VENDA.md](GO-LIVE-VENDA.md) (Railway production branch `master`, variáveis, migrations sem seed, domínio, OIDC, checklist pós-deploy).
2. Após deploy: repetir smoke HTTP e checklist da secção 7 do GO-LIVE; **opcional** validar um fluxo de pedido real ou e2e controlado (PAID em produção depende de gateway real e política de risco — muitas equipas deixam prova de **PAID** pesada para staging e em produção monitorizam filas + métricas).

---

## Fase 5 — Primeiras semanas (hábito)

1. Revisar alertas e filas pelo menos **1× por semana**.
2. Manter smoke pós-merge em `develop` com `*_SMOKE_URL`.
3. Qualquer regressão na saga: logs com correlation id + profundidade em [GUIA-OPERACIONAL.md](GUIA-OPERACIONAL.md) e [RUNBOOK-ROLLBACK.md](RUNBOOK-ROLLBACK.md).

---

## Mapa de documentos

| Objetivo | Documento |
|----------|-----------|
| Checklist completo produção | [GO-LIVE-VENDA.md](GO-LIVE-VENDA.md) |
| Deploy Railway e métricas | [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md) |
| Smoke pedido / PAID | [CHECKLIST-PEDIDO-STAGING.md](CHECKLIST-PEDIDO-STAGING.md) |
| Thresholds e alertas | [MONITORING-THRESHOLDS.md](MONITORING-THRESHOLDS.md) |
| Promoção develop → master | [CHECKLIST-PROMOCAO-DEVELOP-MASTER.md](CHECKLIST-PROMOCAO-DEVELOP-MASTER.md) |
| Produto “vendável” (features/checklist) | [O-QUE-FALTA-100-VENDAVEL.md](O-QUE-FALTA-100-VENDAVEL.md) |
