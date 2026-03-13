# Catálogo de Eventos — Fluxe B2B Suite

Documentação completa dos eventos trocados entre os serviços via RabbitMQ.

> **Padrão de transporte:** Outbox Pattern → RabbitMQ (Topic Exchange)
> **Formato do envelope:** JSON com campos `eventId`, `eventType`, `aggregateId`, `tenantId`, `payload`, `timestamp`, `correlationId`
> **Deduplicação:** Redis com TTL de 24h (`processed:{eventType}:{eventId}`)

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
| `payments.saas.events` | `tenant.created`, `tenant.updated`, `tenant.deleted` | py-payments-ledger |

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

Exchange: `saas.events` | Routing key prefix: `saas.`

### saas.tenant.created

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `saas.tenant.created` |
| **Produtor** | spring-saas-core |
| **Consumidores** | py-payments-ledger |
| **Descrição** | Emitido quando um novo tenant é criado |

```json
{
  "eventId": "uuid",
  "eventType": "tenant.created",
  "aggregateId": "tenant-uuid",
  "tenantId": "tenant-uuid",
  "timestamp": "2026-03-12T10:00:00Z",
  "correlationId": "uuid",
  "payload": {
    "tenantId": "tenant-uuid",
    "slug": "acme-corp",
    "plan": "pro",
    "region": "br",
    "status": "active"
  }
}
```

### saas.tenant.updated

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `saas.tenant.updated` |
| **Produtor** | spring-saas-core |
| **Consumidores** | py-payments-ledger |
| **Descrição** | Emitido quando dados do tenant são alterados (plano, status, região) |

```json
{
  "eventId": "uuid",
  "eventType": "tenant.updated",
  "aggregateId": "tenant-uuid",
  "tenantId": "tenant-uuid",
  "timestamp": "2026-03-12T10:00:00Z",
  "correlationId": "uuid",
  "payload": {
    "tenantId": "tenant-uuid",
    "changes": {
      "plan": "enterprise",
      "status": "active"
    }
  }
}
```

### saas.tenant.deleted

| Campo | Descrição |
|-------|-----------|
| **Routing key** | `saas.tenant.deleted` |
| **Produtor** | spring-saas-core |
| **Consumidores** | py-payments-ledger |
| **Descrição** | Emitido quando um tenant é removido |

```json
{
  "eventId": "uuid",
  "eventType": "tenant.deleted",
  "aggregateId": "tenant-uuid",
  "tenantId": "tenant-uuid",
  "timestamp": "2026-03-12T10:00:00Z",
  "correlationId": "uuid",
  "payload": {
    "tenantId": "tenant-uuid"
  }
}
```

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
| **Produtor** | node-b2b-orders (worker) |
| **Consumidores** | — (evento conceitual, processado internamente) |
| **Descrição** | Emitido quando o estoque é liberado após cancelamento. |

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
| **Descrição** | Emitido quando o pagamento é liquidado. O serviço de pedidos marca o pedido como pago. |

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
    "orderId": "order-uuid",
    "tenantId": "tenant-uuid",
    "amount": 99.80,
    "currency": "BRL",
    "settledAt": "2026-03-12T10:05:00Z"
  }
}
```

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
