# Catálogo de Eventos — Fluxe B2B Suite

Índice de negócio e exemplos dos eventos trocados entre serviços via RabbitMQ.

**Contrato técnico canónico (routing keys, tabelas completas, configuração):** repositório **spring-saas-core**, `docs/contracts/events.md` (réplicas em `node-b2b-orders` e `py-payments-ledger` com o mesmo conteúdo).

> **Padrão de transporte:** Outbox Pattern → RabbitMQ (Topic Exchange)
> **Envelope (spring-saas-core):** `id`, `aggregateType`, `aggregateId`, `eventType`, `payload`, `createdAt` (JSON serializado no corpo da mensagem). Outros serviços podem usar campos equivalentes nos payloads.
> **Deduplicação (orders worker):** Redis com TTL de 24h (`processed:{eventType}:{eventId}`)

---

## Visão Geral das Exchanges

| Exchange | Tipo | Durável | Produtor principal | Descrição |
|----------|------|---------|-------------------|-----------|
| `saas.events` | topic | sim | spring-saas-core | Eventos de governança: tenants, políticas, flags |
| `orders.x` | topic | sim | node-b2b-orders | Eventos de pedidos e inventário |
| `payments.x` | topic | sim | py-payments-ledger | Eventos de pagamento, disputas, payouts |

---

## Topologia de Filas

### saas.events

| Fila | Binding (routing key) | Consumidor |
|------|-----------------------|------------|
| `saas.outbox.events` | `saas.#` | spring-saas-core (outbox relay) |
| `payments.saas.events` | `saas.TENANT.tenant.created`, `saas.TENANT.tenant.updated`, `saas.TENANT.tenant.deleted` (ou padrão equivalente em `SAAS_ROUTING_KEYS`) | py-payments-ledger (`SAAS_INTEGRATION_ENABLED=true`) |

### orders.x

| Fila | Binding (routing key) | Consumidor |
|------|-----------------------|------------|
| `orders.events` | `#` | node-b2b-orders (worker) |
| `orders.dlq` | — | Dead-letter queue |
| `payments.orders.events` | `payment.charge_requested`, `order.confirmed` | py-payments-ledger |

### payments.x

| Fila | Binding (routing key) | Consumidor |
|------|-----------------------|------------|
| `payments.events` | `#` | py-payments-ledger (outbox relay) |
| `payments.dlq` | — | Dead-letter queue |
| `orders.payments` | `payment.settled` | node-b2b-orders |
| `orders.payments.dlq` | — | Dead-letter queue |

---

## Eventos do spring-saas-core

Exchange: `saas.events` | Routing key: `saas.{AGGREGATE_TYPE}.{eventType}` com `AGGREGATE_TYPE` em **maiúsculas** (`TENANT`, `USER`, `POLICY`, …). Ex.: `saas.TENANT.tenant.created` (não `saas.tenant.created`).

### tenant.created

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `saas.TENANT.tenant.created` |
| **eventType** | `tenant.created` |
| **Produtor** | spring-saas-core |
| **Consumidores** | py-payments-ledger (sincroniza tenant no ledger) |
| **Descrição** | Novo tenant registado |

```json
{
  "id": "outbox-event-uuid",
  "aggregateType": "TENANT",
  "aggregateId": "tenant-uuid",
  "eventType": "tenant.created",
  "payload": {
    "name": "Acme",
    "plan": "pro",
    "region": "eu-west-1"
  },
  "createdAt": "2026-03-12T10:00:00Z"
}
```

### tenant.updated

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `saas.TENANT.tenant.updated` |
| **Produtor** | spring-saas-core |
| **Consumidores** | py-payments-ledger |
| **Descrição** | Plano ou metadados do tenant alterados |

```json
{
  "aggregateType": "TENANT",
  "aggregateId": "tenant-uuid",
  "eventType": "tenant.updated",
  "payload": {
    "name": "Acme",
    "plan": "enterprise"
  },
  "createdAt": "2026-03-12T10:00:00Z"
}
```

### tenant.deleted

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `saas.TENANT.tenant.deleted` |
| **Produtor** | spring-saas-core |
| **Consumidores** | py-payments-ledger |
| **Descrição** | Tenant removido (soft delete no Core) |

```json
{
  "aggregateType": "TENANT",
  "aggregateId": "tenant-uuid",
  "eventType": "tenant.deleted",
  "payload": {
    "name": "Acme",
    "plan": "pro"
  },
  "createdAt": "2026-03-12T10:00:00Z"
}
```

**Outros eventos Core** (subscrição, utilizadores, onboarding, flags, políticas): ver `docs/contracts/events.md` no **spring-saas-core**.

---

## Eventos do node-b2b-orders

Exchange: `orders.x`

### order.created

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `order.created` |
| **Produtor** | node-b2b-orders |
| **Consumidores** | node-b2b-orders (worker: reserva de estoque) |
| **Descrição** | Emitido quando um pedido é criado. Aciona a reserva de inventário. |

```json
{
  "eventId": "uuid",
  "eventType": "order.created",
  "aggregateId": "order-uuid",
  "tenantId": "tenant-uuid",
  "timestamp": "2026-03-12T10:00:00Z",
  "correlationId": "uuid",
  "payload": {
    "orderId": "order-uuid",
    "tenantId": "tenant-uuid",
    "correlationId": "uuid"
  }
}
```

**JSON Schema** (`order.created`):
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "order.created",
  "type": "object",
  "required": ["orderId", "tenantId"],
  "properties": {
    "orderId": { "type": "string", "format": "uuid" },
    "tenantId": { "type": "string" },
    "correlationId": { "type": "string" }
  }
}
```

### order.updated

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `order.updated` |
| **Produtor** | node-b2b-orders (serviço / broadcast) |
| **Consumidores** | Subscritores da exchange `orders.x` |
| **Descrição** | Emitido em várias transições de ciclo de vida (atualização genérica do pedido). |

### order.confirmed

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `order.confirmed` |
| **Produtor** | node-b2b-orders |
| **Consumidores** | node-b2b-orders (worker), py-payments-ledger |
| **Descrição** | Emitido quando o pedido é confirmado. Aciona solicitação de cobrança. |

```json
{
  "eventId": "uuid",
  "eventType": "order.confirmed",
  "aggregateId": "order-uuid",
  "tenantId": "tenant-uuid",
  "timestamp": "2026-03-12T10:00:00Z",
  "correlationId": "uuid",
  "payload": {
    "orderId": "order-uuid",
    "tenantId": "tenant-uuid",
    "customerId": "customer-123",
    "items": [
      { "sku": "PROD-001", "qty": 2, "price": 49.90 }
    ],
    "totalAmount": 99.80,
    "currency": "BRL",
    "correlationId": "uuid"
  }
}
```

**JSON Schema** (`order.confirmed`):
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "order.confirmed",
  "type": "object",
  "required": ["orderId", "tenantId", "customerId", "items", "totalAmount", "currency"],
  "properties": {
    "orderId": { "type": "string", "format": "uuid" },
    "tenantId": { "type": "string" },
    "correlationId": { "type": "string" },
    "customerId": { "type": "string" },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["sku", "qty", "price"],
        "properties": {
          "sku": { "type": "string" },
          "qty": { "type": "integer", "minimum": 1 },
          "price": { "type": "number", "minimum": 0 }
        }
      }
    },
    "totalAmount": { "type": "number", "minimum": 0 },
    "currency": { "type": "string" }
  }
}
```

### order.cancelled

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `order.cancelled` |
| **Produtor** | node-b2b-orders |
| **Consumidores** | node-b2b-orders (worker: libera estoque) |
| **Descrição** | Emitido quando o pedido é cancelado. Aciona liberação do inventário. |

```json
{
  "eventId": "uuid",
  "eventType": "order.cancelled",
  "aggregateId": "order-uuid",
  "tenantId": "tenant-uuid",
  "timestamp": "2026-03-12T10:00:00Z",
  "correlationId": "uuid",
  "payload": {
    "orderId": "order-uuid",
    "tenantId": "tenant-uuid",
    "correlationId": "uuid"
  }
}
```

### order.shipped

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `order.shipped` |
| **Produtor** | node-b2b-orders |
| **Consumidores** | node-b2b-orders (worker) |
| **Descrição** | Emitido quando o pedido é enviado com código de rastreio. |

```json
{
  "eventId": "uuid",
  "eventType": "order.shipped",
  "aggregateId": "order-uuid",
  "tenantId": "tenant-uuid",
  "timestamp": "2026-03-12T10:00:00Z",
  "correlationId": "uuid",
  "payload": {
    "orderId": "order-uuid",
    "tenantId": "tenant-uuid",
    "trackingCode": "BR123456789",
    "trackingUrl": "https://rastreamento.correios.com.br/BR123456789",
    "correlationId": "uuid"
  }
}
```

### order.delivered

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `order.delivered` |
| **Produtor** | node-b2b-orders |
| **Consumidores** | node-b2b-orders (worker) |
| **Descrição** | Emitido quando o pedido é entregue ao destinatário. |

```json
{
  "eventId": "uuid",
  "eventType": "order.delivered",
  "aggregateId": "order-uuid",
  "tenantId": "tenant-uuid",
  "timestamp": "2026-03-12T10:00:00Z",
  "correlationId": "uuid",
  "payload": {
    "orderId": "order-uuid",
    "tenantId": "tenant-uuid",
    "correlationId": "uuid"
  }
}
```

### stock.reserved (inventory.reserved)

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `stock.reserved` |
| **Produtor** | node-b2b-orders (worker) |
| **Consumidores** | node-b2b-orders (worker: confirma pedido) |
| **Descrição** | Emitido após reserva de estoque bem-sucedida. Aciona confirmação do pedido. |

```json
{
  "eventId": "uuid",
  "eventType": "stock.reserved",
  "aggregateId": "order-uuid",
  "tenantId": "tenant-uuid",
  "timestamp": "2026-03-12T10:00:00Z",
  "correlationId": "uuid",
  "payload": {
    "orderId": "order-uuid",
    "tenantId": "tenant-uuid",
    "correlationId": "uuid"
  }
}
```

### inventory.released

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `inventory.released` |
| **Produtor** | (schema em **node-b2b-orders** `docs/contracts/schemas/`; emissão efectiva depende do worker/outbox) |
| **Consumidores** | — |
| **Descrição** | Liberação de stock; o fluxo principal de cancelamento usa `order.cancelled` + worker. Schema: repositório **node-b2b-orders** `docs/contracts/SCHEMA_REGISTRY.md`. |

```json
{
  "eventId": "uuid",
  "eventType": "inventory.released",
  "aggregateId": "order-uuid",
  "tenantId": "tenant-uuid",
  "timestamp": "2026-03-12T10:00:00Z",
  "correlationId": "uuid",
  "payload": {
    "orderId": "order-uuid",
    "tenantId": "tenant-uuid",
    "correlationId": "uuid"
  }
}
```

### payment.charge_requested

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `payment.charge_requested` |
| **Exchange** | `payments.x` (roteado do orders.x para payments.x pelo worker) |
| **Produtor** | node-b2b-orders |
| **Consumidores** | py-payments-ledger |
| **Descrição** | Solicitação de cobrança enviada ao serviço de pagamentos após confirmação do pedido. |

```json
{
  "eventId": "uuid",
  "eventType": "payment.charge_requested",
  "aggregateId": "order-uuid",
  "tenantId": "tenant-uuid",
  "timestamp": "2026-03-12T10:00:00Z",
  "correlationId": "uuid",
  "payload": {
    "orderId": "order-uuid",
    "tenantId": "tenant-uuid",
    "customerId": "customer-123",
    "items": [
      { "sku": "PROD-001", "qty": 2, "price": 49.90 }
    ],
    "totalAmount": 99.80,
    "currency": "BRL",
    "correlationId": "uuid"
  }
}
```

---

## Eventos do py-payments-ledger

Exchange: `payments.x`

### payment.intent.created

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `payment.intent.created` |
| **Produtor** | py-payments-ledger |
| **Consumidores** | — |
| **Descrição** | Emitido quando uma intenção de pagamento é criada. |

```json
{
  "eventId": "uuid",
  "eventType": "payment.intent.created",
  "aggregateId": "pi-uuid",
  "tenantId": "tenant-uuid",
  "timestamp": "2026-03-12T10:00:00Z",
  "correlationId": "uuid",
  "payload": {
    "paymentIntentId": "pi-uuid",
    "orderId": "order-uuid",
    "tenantId": "tenant-uuid",
    "amount": 99.80,
    "currency": "BRL",
    "status": "pending"
  }
}
```

### payment.authorized

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `payment.authorized` |
| **Produtor** | py-payments-ledger |
| **Consumidores** | — |
| **Descrição** | Emitido quando o pagamento é autorizado pelo gateway. |

```json
{
  "eventId": "uuid",
  "eventType": "payment.authorized",
  "aggregateId": "pi-uuid",
  "tenantId": "tenant-uuid",
  "timestamp": "2026-03-12T10:00:00Z",
  "correlationId": "uuid",
  "payload": {
    "paymentIntentId": "pi-uuid",
    "orderId": "order-uuid",
    "tenantId": "tenant-uuid",
    "amount": 99.80,
    "currency": "BRL",
    "gatewayRef": "ch_abc123"
  }
}
```

### payment.settled

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `payment.settled` |
| **Produtor** | py-payments-ledger |
| **Consumidores** | node-b2b-orders |
| **Descrição** | Emitido quando o pagamento é liquidado. O worker de pedidos aceita `orderId`/`tenantId` ou `order_id`/`tenant_id`. |

```json
{
  "eventId": "uuid",
  "eventType": "payment.settled",
  "aggregateId": "pi-uuid",
  "tenantId": "tenant-uuid",
  "timestamp": "2026-03-12T10:00:00Z",
  "correlationId": "uuid",
  "payload": {
    "paymentIntentId": "pi-uuid",
    "order_id": "order-uuid",
    "tenant_id": "tenant-uuid",
    "amount": 99.80,
    "currency": "BRL",
    "settledAt": "2026-03-12T10:05:00Z"
  }
}
```

### payment.retry_exhausted

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `payment.retry_exhausted` |
| **Produtor** | py-payments-ledger (outbox) |
| **Consumidores** | Webhooks / monitorização |
| **Descrição** | Após esgotar tentativas de `authorize` no gateway para um pedido de cobrança (`payment.charge_requested`). |

### payment.voided

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `payment.voided` |
| **Produtor** | py-payments-ledger |
| **Consumidores** | — |
| **Descrição** | Emitido quando o pagamento é cancelado/estornado antes da liquidação. |

```json
{
  "eventId": "uuid",
  "eventType": "payment.voided",
  "aggregateId": "pi-uuid",
  "tenantId": "tenant-uuid",
  "timestamp": "2026-03-12T10:00:00Z",
  "correlationId": "uuid",
  "payload": {
    "paymentIntentId": "pi-uuid",
    "orderId": "order-uuid",
    "tenantId": "tenant-uuid",
    "reason": "customer_request"
  }
}
```

### dispute.opened

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `dispute.opened` |
| **Produtor** | py-payments-ledger |
| **Consumidores** | — |
| **Descrição** | Emitido quando uma disputa/chargeback é aberta. |

```json
{
  "eventId": "uuid",
  "eventType": "dispute.opened",
  "aggregateId": "dispute-uuid",
  "tenantId": "tenant-uuid",
  "timestamp": "2026-03-12T10:00:00Z",
  "correlationId": "uuid",
  "payload": {
    "disputeId": "dispute-uuid",
    "paymentIntentId": "pi-uuid",
    "tenantId": "tenant-uuid",
    "amount": 99.80,
    "reason": "product_not_received"
  }
}
```

### dispute.accepted / dispute.resolved

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `dispute.accepted` / `dispute.resolved` |
| **Produtor** | py-payments-ledger |
| **Consumidores** | — |
| **Descrição** | Emitido quando uma disputa é aceita ou resolvida. |

```json
{
  "eventId": "uuid",
  "eventType": "dispute.resolved",
  "aggregateId": "dispute-uuid",
  "tenantId": "tenant-uuid",
  "timestamp": "2026-03-12T10:00:00Z",
  "correlationId": "uuid",
  "payload": {
    "disputeId": "dispute-uuid",
    "paymentIntentId": "pi-uuid",
    "tenantId": "tenant-uuid",
    "resolution": "won",
    "resolvedAt": "2026-03-12T10:30:00Z"
  }
}
```

### payout.created / payout.completed / payout.failed

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `payout.created`, `payout.completed`, `payout.failed` |
| **Produtor** | py-payments-ledger |
| **Consumidores** | — |
| **Descrição** | Ciclo de vida de repasses (payouts). |

```json
{
  "eventId": "uuid",
  "eventType": "payout.completed",
  "aggregateId": "payout-uuid",
  "tenantId": "tenant-uuid",
  "timestamp": "2026-03-12T10:00:00Z",
  "correlationId": "uuid",
  "payload": {
    "payoutId": "payout-uuid",
    "tenantId": "tenant-uuid",
    "amount": 5000.00,
    "currency": "BRL",
    "completedAt": "2026-03-12T10:00:00Z"
  }
}
```

---

## Fluxo da Saga: Pedido → Pagamento

```
node-b2b-orders                                    py-payments-ledger
    │                                                      │
    ├── order.created ──► orders.x                         │
    │       │                                              │
    │   [worker: reserva estoque]                          │
    │       │                                              │
    ├── stock.reserved ──► orders.x                        │
    │       │                                              │
    │   [worker: confirma pedido]                          │
    │       │                                              │
    ├── order.confirmed ──► orders.x                       │
    │       │                                              │
    ├── payment.charge_requested ──► payments.x ──────────►│
    │                                                      │
    │                                          [cria PaymentIntent]
    │                                                      │
    │                                          [processa pagamento]
    │                                                      │
    │◄──────────── payment.settled ◄── payments.x ─────────┤
    │                                                      │
    │   [worker: marca pedido como pago]                   │
    │       │                                              │
    ├── order.shipped ──► orders.x                         │
    │       │                                              │
    └── order.delivered ──► orders.x                       │
```

---

## Resiliência e Garantias

| Mecanismo | Descrição |
|-----------|-----------|
| **Outbox Pattern** | Todos os serviços persistem eventos no banco antes de publicar no RabbitMQ |
| **Deduplicação** | Redis com chave `processed:{eventType}:{eventId}` e TTL de 24h |
| **DLQ** | Dead-letter queues para mensagens que falham após retries |
| **Circuit Breaker** | Protege publicação no RabbitMQ contra falhas em cascata |
| **Idempotência** | Eventos processados mais de uma vez produzem o mesmo resultado |
| **Retry** | Outbox com retry configurável (max 5 tentativas no spring-saas-core) |
