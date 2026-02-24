# C4 — Fluxe B2B Suite (Contexto e Container)

Diagramas em Mermaid: nível de **Contexto** (sistema e usuários/sistemas externos) e **Container** (principais aplicações da suite).

---

## Nível 1: Contexto do Sistema

O **Sistema** é a Fluxe B2B Suite. Usuários interagem com o frontend; o frontend e os workers consomem/publicam eventos via RabbitMQ.

```mermaid
flowchart TB
  subgraph users["Usuários"]
    Ops[Usuário Ops]
    Admin[Admin]
    Cliente[Cliente B2B]
  end

  subgraph system["Fluxe B2B Suite"]
    direction TB
    Front[Frontend Angular\nShop / Ops Portal / Admin Console]
    Core[spring-saas-core\nGovernança]
    Orders[node-b2b-orders\nPedidos e Inventário]
    Payments[py-payments-ledger\nPagamentos e Ledger]
    MQ[RabbitMQ\nEventos]
  end

  Ops --> Front
  Admin --> Front
  Cliente --> Front
  Front -->|HTTP| Core
  Front -->|HTTP| Orders
  Front -->|HTTP| Payments
  Orders -->|AMQP| MQ
  Payments -->|AMQP| MQ
  MQ -->|consumo| Orders
  MQ -->|consumo| Payments
```

---

## Nível 2: Containers (aplicações e filas)

Containers principais: frontend (3 apps + API), Core, Orders (API + Worker), Payments (API + Worker), RabbitMQ.

```mermaid
flowchart LR
  subgraph frontend["fluxe-b2b-suite"]
    Shop[Shop]
    Ops[Ops Portal]
    Admin[Admin Console]
    API[API Express]
  end

  subgraph backends["Backends"]
    Core[spring-saas-core\n:8080]
    OrdersAPI[node-b2b-orders API\n:3000]
    OrdersWorker[Orders Worker]
    PaymentsAPI[py-payments-ledger API\n:8000]
    PaymentsWorker[Payments Worker]
  end

  subgraph infra["Infra"]
    PG1[(PostgreSQL\nCore)]
    PG2[(PostgreSQL\nOrders)]
    PG3[(PostgreSQL\nPayments)]
    Redis1[Redis]
    Redis2[Redis]
    MQ[(RabbitMQ\norders.x / payments.x)]
  end

  Shop --> API
  Ops --> Core
  Ops --> OrdersAPI
  Ops --> PaymentsAPI
  Admin --> Core
  Core --> PG1
  OrdersAPI --> PG2
  OrdersAPI --> Redis1
  OrdersWorker --> PG2
  OrdersWorker --> MQ
  PaymentsAPI --> PG3
  PaymentsAPI --> Redis2
  PaymentsWorker --> PG3
  PaymentsWorker --> MQ
  MQ --> OrdersWorker
  MQ --> PaymentsWorker
```

---

## Fluxo de eventos (Orders ↔ Payments)

```mermaid
sequenceDiagram
  participant Ops as Ops Portal
  participant Orders as node-b2b-orders
  participant MQ as RabbitMQ
  participant Payments as py-payments-ledger

  Ops->>Orders: POST /orders/:id/confirm
  Orders->>Orders: Outbox: payment.charge_requested
  Orders->>MQ: publica payment.charge_requested (payments.x)
  MQ->>Payments: consumer
  Payments->>Payments: PaymentIntent + ledger
  Payments->>MQ: publica payment.settled (payments.x)
  MQ->>Orders: consumer
  Orders->>Orders: pedido status = PAID
```

---

Para diagramas C4 de um único serviço (ex.: py-payments-ledger), ver a pasta `docs/architecture/` do respectivo repositório.
