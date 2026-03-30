# Checklist — pedido minimo em staging (node-b2b-orders)

Objetivo: **repetir em staging** o fluxo **token → criar pedido → RESERVED → CONFIRMED**, sem depender do frontend.

## Prerequisitos

1. **Migracoes Prisma aplicadas** na base PostgreSQL de staging (`npx prisma migrate deploy` via CI, startup ou `railway run` no servico orders). Se faltar tabela (ex.: `OutboxEvent`), o `POST /v1/orders` devolve 500 com detalhe no corpo — ver [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md).
2. API **node-b2b-orders** deployada em staging (ex.: Railway) com **mesmo** `JWT_SECRET` / issuer alinhado ao seed, ou auth local da propria API (`POST /v1/auth/token`).
3. Base URL publica (sem barra final). Nome esperado na doc de pipeline: `https://node-b2b-orders-staging.up.railway.app` (ajuste se o teu projeto usar outro host).
4. Utilizador e tenant **existentes na base de staging** (apos `seed` ou migracao). Os defaults do script assumem o seed de desenvolvimento:
   - `ops@demo.example.com` / `ops123` / `tenant_demo`  
   Se o teu staging usar outros dados, define `OPS_EMAIL`, `OPS_PASSWORD`, `OPS_TENANT`.
5. **Worker** e **RabbitMQ** ativos — sem worker o pedido pode ficar em `CREATED` e nunca chegar a `RESERVED`.

## Execucao automatica (recomendado)

Na raiz do **fluxe-b2b-suite**:

```bash
export ORDERS_SMOKE_URL="https://SUA-URL-ORDERS"
pnpm smoke:order-staging
```

Ou: `bash scripts/smoke-order-staging.sh`

**Criterio de sucesso:** mensagem final `Fluxo minimo concluido com sucesso (ate CONFIRMED).`

## O que nao cobre este script

- Estado **PAID** (exige `payment.settled` do **py-payments-ledger** e consumo no worker). Para isso usar stack completa local: `node-b2b-orders/scripts/smoke.sh` ou publicar evento como no proprio README do orders.

## Referencias

- API e fluxo detalhado: [node-b2b-orders README](https://github.com/ricartefelipe/node-b2b-orders) (secao Fluxo do pedido, Endpoints).
- Smoke HTTP leve (health + OpenAPI): `node-b2b-orders/scripts/smoke-post-merge.sh` e `pnpm smoke:staging` na suite.
