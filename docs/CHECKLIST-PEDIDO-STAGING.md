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

**Criterio de sucesso:** mensagem final `Fluxo minimo concluido com sucesso (ate CONFIRMED).` ou `(ate PAID).` quando usar a opcao abaixo.

## Ate PAID (opcional, staging)

Requer **mesmo RabbitMQ** que a API e o worker (`RABBITMQ_URL`), **worker ativo**, e repo **node-b2b-orders** clonado ao lado de **fluxe-b2b-suite** (o script usa `node-b2b-orders/scripts/publish-payment-settled.js`).

```bash
export ORDERS_SMOKE_URL="https://node-b2b-orders-staging.up.railway.app"
export RABBITMQ_URL="amqps://..."   # mesma URL configurada na API/worker no Railway
pnpm smoke:order-staging:paid
# ou: SMOKE_PAYMENT_PAID=1 bash scripts/smoke-order-staging.sh
```

Publica `payment.settled` (como o **py-payments-ledger** faria) e verifica `GET /v1/orders/:id` ate **PAID**.

### Ate PAID via saga (ledger + orders, sem publicar manualmente)

Requer **py-payments-ledger** e **node-b2b-orders** com workers ativos, **mesmo** `RABBITMQ_URL`, integração orders↔Rabbit (`ORDERS_INTEGRATION_ENABLED=true` ou equivalente) e gateway de pagamento que autorize o charge em staging.

```bash
export ORDERS_SMOKE_URL="https://node-b2b-orders-staging.up.railway.app"
export RABBITMQ_URL="amqps://..."   # mesma URL na API/worker/ledger
# opcional: health do ledger — PAYMENTS_SMOKE_URL ou SMOKE_PAYMENTS_BASE
pnpm smoke:order-staging:saga
# ou: SMOKE_SAGA_PAID_LEDGER=1 bash scripts/smoke-order-staging.sh
```

O script **não** chama `publish-payment-settled.js`; faz poll do pedido ate **PAID** (timeout maior). Não combine com `SMOKE_PAYMENT_PAID=1` no mesmo run.

## O que nao cobre sem a opcao acima

- Estado **PAID** sem publicar evento na fila: use `pnpm smoke:order-staging:paid` (publicação manual), `pnpm smoke:order-staging:saga` (stack completa) ou stack local `node-b2b-orders/scripts/smoke.sh`.

## Referencias

- API e fluxo detalhado: [node-b2b-orders README](https://github.com/ricartefelipe/node-b2b-orders) (secao Fluxo do pedido, Endpoints).
- Smoke HTTP leve (health + OpenAPI): `node-b2b-orders/scripts/smoke-post-merge.sh` e `pnpm smoke:staging` na suite.
