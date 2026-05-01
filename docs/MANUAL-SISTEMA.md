# Manual Completo do Sistema — Fluxe B2B Suite

**Versão:** 1.0  
**Data:** Março de 2026  
**Autor:** Felipe Ricarte Magalhães

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura](#2-arquitetura)
3. [spring-saas-core — Control Plane](#3-spring-saas-core--control-plane)
4. [node-b2b-orders — Pedidos e Catálogo](#4-node-b2b-orders--pedidos-e-catálogo)
5. [py-payments-ledger — Pagamentos e Ledger](#5-py-payments-ledger--pagamentos-e-ledger)
6. [saas-suite-ui — Frontend](#6-saas-suite-ui--frontend)
7. [Segurança](#7-segurança)
8. [Fluxos de Negócio E2E](#8-fluxos-de-negócio-e2e)
9. [Comunicação entre Serviços](#9-comunicação-entre-serviços)
10. [Observabilidade](#10-observabilidade)
11. [Requisitos Não Funcionais](#11-requisitos-não-funcionais)
12. [Operação](#12-operação)
13. [Referência de APIs](#13-referência-de-apis)
14. [Apêndices](#14-apêndices)

---

## 1. Visão Geral

A **Fluxe B2B Suite** é uma plataforma multi-tenant completa para operações B2B, composta por quatro repositórios que, juntos, cobrem todo o ciclo de vida de uma operação comercial: catálogo de produtos, gestão de pedidos, processamento de pagamentos, contabilidade (ledger) e governança centralizada.

### 1.1 Componentes

| Serviço | Stack | Papel |
|---------|-------|-------|
| **spring-saas-core** | Spring Boot 3.2 / Java 21 | Control plane: tenants, ABAC/RBAC, feature flags, auditoria, JWT, outbox |
| **node-b2b-orders** | NestJS 10 / Fastify / Prisma 5 | Catálogo de produtos, gestão de pedidos, inventário |
| **py-payments-ledger** | FastAPI / SQLAlchemy 2 / Alembic | Pagamentos, ledger contábil de partida dobrada, webhooks, reconciliação |
| **saas-suite-ui** | Angular 21 / Nx 22.5 / Angular Material | Shop (loja), Ops Portal (operacional), Admin Console (governança) |

### 1.2 Características-chave

- **Multi-tenancy** com isolamento completo por tenant em todas as camadas
- **ABAC + RBAC** com deny-by-default e DENY com precedência
- **Event-driven** via RabbitMQ com padrão Outbox para consistência eventual
- **Double-entry ledger** para contabilidade confiável
- **Feature flags** com rollout percentual e controle por role
- **Auditoria completa** de ações sensíveis e negações de acesso
- **Idempotência** em operações de escrita (Idempotency-Key)
- **Rate limiting** por tenant e plano
- **Observabilidade** com Prometheus, Grafana e correlation ID distribuído
- **Gateway de pagamento** abstraído (mock para dev, Stripe para produção)

---

## 2. Arquitetura

### 2.1 Diagrama de Serviços

```
                         ┌─────────────────────────────┐
                         │     saas-suite-ui            │
                         │  Shop · Ops Portal · Admin   │
                         │  :4200  :4300       :4400    │
                         └──────┬──────┬──────┬────────┘
                                │      │      │
                   ┌────────────┘      │      └────────────┐
                   ▼                   ▼                   ▼
        ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐
        │ spring-saas-core│  │node-b2b-orders  │  │py-payments-ledger│
        │ :8080           │  │ :3000           │  │ :8000            │
        │                 │  │                 │  │                  │
        │ Tenants         │  │ Produtos        │  │ Payment Intents  │
        │ Policies (ABAC) │  │ Pedidos         │  │ Ledger           │
        │ Feature Flags   │  │ Inventário      │  │ Refunds          │
        │ Audit Log       │  │ Audit Log       │  │ Webhooks         │
        │ JWT / Auth      │  │ Audit Log       │  │ Reconciliação    │
        └────────┬────────┘  └───────┬─────────┘  └────────┬─────────┘
                 │                   │                      │
                 │           ┌───────┴──────────────────────┘
                 │           │     RabbitMQ (eventos)
                 │           │
        ┌────────┴───────────┴──────────────────────────────┐
        │              Infraestrutura                        │
        │  PostgreSQL · Redis · RabbitMQ · Prometheus · Grafana │
        └────────────────────────────────────────────────────┘
```

### 2.2 Princípios Arquiteturais

- **Única fonte de verdade**: spring-saas-core é a fonte para tenants, políticas e flags
- **JWT padronizado**: emitido pelo core, validado por todos os serviços
- **Consistência eventual**: operações entre serviços via outbox + eventos RabbitMQ
- **Default-deny**: sem política ALLOW explícita, acesso é negado
- **Isolamento por tenant**: cada query filtra por `tenant_id`

### 2.3 Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| API Gateway / Auth | JWT HS256 (dev) / RS256 via JWKS (prod) |
| Backend Java | Spring Boot 3.2, Java 21, Maven, Liquibase, Spring Data JPA |
| Backend Node | NestJS 10, Fastify 4, Prisma 5, TypeScript |
| Backend Python | FastAPI, SQLAlchemy 2, Alembic, Pydantic v2 |
| Frontend | Angular 21, Nx 22.5, Angular Material, pnpm |
| Banco de dados | PostgreSQL 16 (um por serviço) |
| Cache / Rate limit | Redis 7 |
| Mensageria | RabbitMQ 3 (topic exchanges) |
| Observabilidade | Prometheus + Grafana |
| Containers | Docker + Docker Compose |

---

## 3. spring-saas-core — Control Plane

### 3.1 Responsabilidades

O spring-saas-core é o coração da plataforma. Centraliza:

- Cadastro e gestão de **tenants** (planos, regiões, status)
- **Políticas ABAC** que governam acesso em toda a plataforma
- **Feature flags** com rollout gradual por tenant
- **Auditoria** de todas as ações sensíveis
- Emissão de **JWT** padronizado (ambiente dev)
- **Outbox** para publicação confiável de eventos

### 3.2 Endpoints

#### Tenants (`/v1/tenants`)

| Verbo | Path | Descrição | Permissão |
|-------|------|-----------|-----------|
| POST | `/v1/tenants` | Criar tenant | tenants:write |
| GET | `/v1/tenants` | Listar tenants (cursor-based) | tenants:read |
| GET | `/v1/tenants/{id}` | Buscar por ID | tenants:read |
| PATCH | `/v1/tenants/{id}` | Atualizar tenant | tenants:write |
| DELETE | `/v1/tenants/{id}` | Soft delete | tenants:write |
| GET | `/v1/tenants/{id}/snapshot` | Snapshot com policies/flags | tenants:read |
| GET | `/v1/tenants/{id}/policies` | Políticas do tenant | tenants:read |

**Campos do tenant**: id (UUID), name, plan (free/pro/enterprise), region, status (ACTIVE/SUSPENDED/DELETED).

#### Políticas ABAC (`/v1/policies`)

| Verbo | Path | Descrição | Permissão |
|-------|------|-----------|-----------|
| POST | `/v1/policies` | Criar política | policies:write |
| GET | `/v1/policies` | Listar (paginado) | policies:read |
| GET | `/v1/policies/{id}` | Buscar por ID | policies:read |
| PATCH | `/v1/policies/{id}` | Atualizar | policies:write |
| DELETE | `/v1/policies/{id}` | Soft delete | policies:write |

**Campos da política**: permissionCode, effect (ALLOW/DENY), allowedPlans[], allowedRegions[], enabled, notes.

#### Feature Flags (`/v1/tenants/{tenantId}/flags`)

| Verbo | Path | Descrição | Permissão |
|-------|------|-----------|-----------|
| POST | `/v1/tenants/{tid}/flags` | Criar flag | flags:write |
| GET | `/v1/tenants/{tid}/flags` | Listar flags do tenant | flags:read |
| PATCH | `/v1/tenants/{tid}/flags/{name}` | Atualizar | flags:write |
| DELETE | `/v1/tenants/{tid}/flags/{name}` | Soft delete | flags:write |

**Campos da flag**: name, enabled, rolloutPercent (0–100), allowedRoles[].

#### Auditoria (`/v1/audit`)

| Verbo | Path | Descrição | Permissão |
|-------|------|-----------|-----------|
| GET | `/v1/audit` | Listar logs (filtros: tenant, action, actor, datas) | audit:read |
| GET | `/v1/audit/export` | Exportar CSV/JSON (até 10.000 registros) | audit:read |

#### Outros

| Verbo | Path | Descrição |
|-------|------|-----------|
| GET | `/v1/me` | Identidade do usuário autenticado |
| POST | `/v1/dev/token` | Emitir JWT dev (somente profile local) |
| GET | `/v1/analytics/summary` | Resumo agregado do sistema |
| GET | `/v1/analytics/anomalies` | Detecção de anomalias no audit |
| GET | `/v1/metrics/business` | Métricas de negócio |
| GET | `/healthz` | Liveness |
| GET | `/readyz` | Readiness (DB + Redis + RabbitMQ) |

### 3.3 Modelo de Dados

| Entidade | Tabela | Descrição |
|----------|--------|-----------|
| Tenant | `tenants` | Empresa/organização multi-tenant |
| Policy | `policies` | Regra ABAC (permission → effect → plans/regions) |
| FeatureFlag | `feature_flags` | Flag por tenant com rollout |
| AuditLogEntity | `audit_log` | Registro de auditoria |
| OutboxEventEntity | `outbox_events` | Evento pendente de publicação |

### 3.4 Eventos Publicados

| Evento | Aggregate | Exchange | Descrição |
|--------|-----------|----------|-----------|
| tenant.created | TENANT | saas.events | Tenant criado |
| tenant.updated | TENANT | saas.events | Tenant atualizado |
| tenant.deleted | TENANT | saas.events | Tenant removido |
| policy.created | POLICY | saas.events | Política criada |
| policy.updated | POLICY | saas.events | Política atualizada |
| policy.deleted | POLICY | saas.events | Política removida |
| flag.created | FLAG | saas.events | Flag criada |
| flag.toggled | FLAG | saas.events | Flag atualizada |
| flag.deleted | FLAG | saas.events | Flag removida |

### 3.5 Dados de Seed

Ao iniciar (Liquibase, automático):
- **Tenants**: Fluxe B2B Suite (admin global), Demo Corp (plano pro, region-a)
- **Policies**: 7 políticas para tenants, policies, flags, admin, profile, audit, analytics
- **Feature Flags**: fast_checkout, chaos_controls (Demo Corp)

---

## 4. node-b2b-orders — Pedidos e Catálogo

### 4.1 Responsabilidades

- **Catálogo de produtos** com categorias, preços, imagens e busca
- **Gestão de pedidos** com ciclo de vida completo (criação → reserva → confirmação → pagamento)
- **Controle de inventário** com ajustes e reservas automáticas
- **Worker** para processamento assíncrono (reserva de estoque, atualização de status)

### 4.2 Endpoints

#### Produtos (`/v1/products`)

| Verbo | Path | Descrição | Permissão |
|-------|------|-----------|-----------|
| GET | `/v1/products` | Listar com filtros (category, preço, estoque, busca) | products:read |
| GET | `/v1/products/{id}` | Buscar por ID | products:read |
| POST | `/v1/products` | Criar produto | products:write |
| PATCH | `/v1/products/{id}` | Atualizar | products:write |
| DELETE | `/v1/products/{id}` | Soft delete | products:write |
| GET | `/v1/products/metadata/categories` | Categorias disponíveis | products:read |
| GET | `/v1/products/metadata/price-range` | Min/max de preço | products:read |

**Campos do produto**: sku, name, description, price, currency, category, imageUrl, inStock, rating, reviewCount.

**Catálogo de seed**: 25 produtos em 5 categorias — Eletrônicos, Escritório, Industrial, Segurança, Limpeza.

#### Pedidos (`/v1/orders`)

| Verbo | Path | Descrição | Permissão | Idempotência |
|-------|------|-----------|-----------|--------------|
| POST | `/v1/orders` | Criar pedido | orders:write | Obrigatório |
| GET | `/v1/orders` | Listar (cursor, status) | orders:read | — |
| GET | `/v1/orders/{id}` | Buscar por ID | orders:read | — |
| POST | `/v1/orders/{id}/confirm` | Confirmar pedido | orders:write | Obrigatório |
| POST | `/v1/orders/{id}/cancel` | Cancelar pedido | orders:write | — |

**Ciclo de vida do pedido**:

```
         API POST /orders
              │
              ▼
          ┌────────┐     Worker reserva
          │CREATED │ ──────────────────▶ ┌──────────┐
          └────────┘     estoque          │ RESERVED │
              │                           └────┬─────┘
              │ estoque                        │
              │ insuficiente              API confirm
              ▼                                │
         ┌───────────┐                         ▼
         │ CANCELLED │ ◀────────────── ┌───────────┐
         └───────────┘   API cancel    │ CONFIRMED │
                                       └─────┬─────┘
                                             │
                                    Worker payment.settled
                                             │
                                             ▼
                                       ┌──────┐
                                       │ PAID │
                                       └──────┘
```

#### Inventário (`/v1/inventory`)

| Verbo | Path | Descrição | Permissão | Idempotência |
|-------|------|-----------|-----------|--------------|
| GET | `/v1/inventory` | Listar itens (sku, cursor) | inventory:read | — |
| POST | `/v1/inventory/adjustments` | Criar ajuste (IN/OUT/ADJUSTMENT) | inventory:write | Obrigatório |
| GET | `/v1/inventory/adjustments` | Listar ajustes | inventory:read | — |

**Tipos de ajuste**: IN (entrada de estoque), OUT (saída), ADJUSTMENT (correção).

#### Auditoria e Admin

| Verbo | Path | Descrição | Permissão |
|-------|------|-----------|-----------|
| GET | `/v1/audit` | Consultar audit log | audit:read |
| GET | `/v1/audit/export` | Exportar audit (JSON) | audit:read |
| GET/PUT | `/v1/admin/chaos` | Configurar chaos engineering | admin:write |

#### Auth e Health

| Verbo | Path | Descrição |
|-------|------|-----------|
| POST | `/v1/auth/token` | Login local (email + senha) |
| GET | `/v1/me` | Identidade do usuário |
| GET | `/v1/healthz` | Liveness |
| GET | `/v1/readyz` | Readiness (DB + Redis) |
| GET | `/v1/metrics` | Prometheus |

### 4.3 Modelo de Dados (Prisma)

| Modelo | Descrição |
|--------|-----------|
| Tenant | Empresa multi-tenant |
| User | Usuário com email, senha (bcrypt), flag admin global |
| Role / Permission / RolePermission | RBAC local |
| Policy | Política ABAC local |
| FeatureFlag | Flag local (sincronizada via eventos do core) |
| Order / OrderItem | Pedido com itens (sku, qty, price) |
| Product | Catálogo de produtos |
| InventoryItem | Estoque por SKU (availableQty, reservedQty) |
| InventoryAdjustment | Histórico de ajustes de estoque |
| OutboxEvent | Evento pendente de publicação |
| AuditLog | Log de auditoria |

### 4.4 Worker

O worker roda em processo separado e é responsável por:

1. **Outbox dispatcher**: lê eventos PENDING, publica no RabbitMQ, marca SENT
2. **Consumo order.created**: reserva estoque; se insuficiente, cancela automaticamente
3. **Consumo order.confirmed**: libera reserva, publica `payment.charge_requested`
4. **Consumo order.cancelled**: libera reserva se o pedido estava RESERVED
5. **Consumo payment.settled**: atualiza pedido para PAID

**Deduplicação**: Redis com chave `processed:{eventType}:{eventId}` (TTL 24h).

### 4.5 Eventos

**Publicados** (exchange `orders.x`):

| Evento | Quando |
|--------|--------|
| order.created | Pedido criado via API |
| stock.reserved | Worker reservou estoque |
| order.confirmed | Pedido confirmado via API |
| order.cancelled | Pedido cancelado (API ou estoque insuficiente) |

**Publicados** (exchange `payments.x`):

| Evento | Quando |
|--------|--------|
| payment.charge_requested | Pedido confirmado, solicita cobrança |

**Consumidos**:

| Evento | Fila | Ação |
|--------|------|------|
| payment.settled | orders.payments | Atualiza pedido para PAID |

### 4.6 Dados de Seed

- 3 usuários de seed (senhas definidas via variável de ambiente no seed — ver `.env.example`)
- 25 produtos em 5 categorias com estoque inicial de 30 unidades cada
- Roles: admin, ops, sales com permissões diferenciadas
- 8 políticas ABAC

---

## 5. py-payments-ledger — Pagamentos e Ledger

### 5.1 Responsabilidades

- **Processamento de pagamentos** com gateway abstraído (mock/Stripe)
- **Ledger contábil** de partida dobrada (double-entry)
- **Sistema de webhooks** para notificação de terceiros
- **Reconciliação** automática com gateway
- **Reembolsos** (refunds)
- **Worker** para settlement automático, entrega de webhooks e manutenção

### 5.2 Endpoints

#### Pagamentos (`/v1/payment-intents`)

| Verbo | Path | Descrição | Permissão | Idempotência |
|-------|------|-----------|-----------|--------------|
| POST | `/v1/payment-intents` | Criar payment intent | payments:write | Obrigatório |
| GET | `/v1/payment-intents/{id}` | Buscar por ID | payments:read | — |
| POST | `/v1/payment-intents/{id}/confirm` | Confirmar (autorizar) | payments:write | Obrigatório |
| POST | `/v1/payment-intents/{id}/refund` | Reembolsar | payments:write | Obrigatório |
| GET | `/v1/payment-intents/{id}/refunds` | Listar reembolsos | payments:read | — |

**Ciclo de vida do pagamento**:

```
       API POST /payment-intents
              │
              ▼
          ┌─────────┐
          │ CREATED │
          └────┬────┘
               │ API confirm
               ▼
         ┌────────────┐     Worker settle
         │ AUTHORIZED │ ─────────────────▶ ┌─────────┐
         └────────────┘                    │ SETTLED │
                                           └────┬────┘
                                                │ API refund
                                                ▼
                                       ┌─────────────────┐
                                       │ REFUNDED /       │
                                       │ PARTIALLY_REFUND │
                                       └─────────────────┘
```

#### Ledger (`/v1/ledger`)

| Verbo | Path | Descrição | Permissão |
|-------|------|-----------|-----------|
| GET | `/v1/ledger/entries` | Entradas contábeis (filtro por data) | ledger:read |
| GET | `/v1/ledger/balances` | Saldos por conta | ledger:read |

**Partida dobrada**: cada pagamento gera um `LedgerEntry` com duas `LedgerLine`:
- **DEBIT** na conta CASH (ativo)
- **CREDIT** na conta REVENUE (receita)

Reembolsos geram:
- **DEBIT** na conta REFUND_EXPENSE (despesa)
- **CREDIT** na conta CASH (ativo)

#### Contas Contábeis (`/v1/accounts`)

| Verbo | Path | Descrição | Permissão |
|-------|------|-----------|-----------|
| POST | `/v1/accounts` | Criar conta contábil | admin:write |
| GET | `/v1/accounts` | Listar contas do tenant | ledger:read |

Contas padrão: CASH (ASSET), REVENUE (REVENUE), REFUND_EXPENSE (EXPENSE).

#### Webhooks (`/v1/webhooks`)

| Verbo | Path | Descrição | Permissão |
|-------|------|-----------|-----------|
| POST | `/v1/webhooks` | Criar endpoint | admin:write |
| GET | `/v1/webhooks` | Listar endpoints | admin:write |
| DELETE | `/v1/webhooks/{id}` | Remover endpoint | admin:write |

Entrega: POST com body `{event_type, payload}` e header `X-Webhook-Signature` (HMAC-SHA256). Retry em 60s, 300s, 1800s.

#### Reconciliação (`/v1/reconciliation`)

| Verbo | Path | Descrição | Permissão |
|-------|------|-----------|-----------|
| POST | `/v1/reconciliation/run` | Executar reconciliação | admin:write |
| GET | `/v1/reconciliation/discrepancies` | Listar discrepâncias | admin:write |
| POST | `/v1/reconciliation/discrepancies/{id}/resolve` | Resolver | admin:write |

#### Relatórios (`/v1/reports`)

| Verbo | Path | Descrição | Permissão |
|-------|------|-----------|-----------|
| GET | `/v1/reports/revenue` | Receita por período (day/week/month) | ledger:read |
| GET | `/v1/reports/account-balances` | Saldos por conta | ledger:read |

#### Auditoria, Auth, Health

| Verbo | Path | Descrição |
|-------|------|-----------|
| GET | `/v1/audit` | Audit log |
| GET | `/v1/audit/export` | Exportar audit |
| POST | `/v1/auth/token` | Login local |
| GET | `/v1/me` | Identidade |
| GET/PUT | `/v1/admin/chaos` | Chaos engineering |
| GET | `/healthz` | Liveness |
| GET | `/readyz` | Readiness (DB + Redis + RabbitMQ) |
| GET | `/metrics` | Prometheus |

### 5.3 Modelo de Dados (SQLAlchemy)

| Modelo | Descrição |
|--------|-----------|
| Tenant | Empresa multi-tenant |
| User | Usuário com bcrypt |
| Role / Permission / RolePermission | RBAC |
| Policy | Política ABAC |
| FeatureFlag | Flag por tenant |
| PaymentIntent | Intenção de pagamento (amount, currency, status, customer_ref, gateway_ref) |
| LedgerEntry | Cabeçalho contábil (por payment_intent) |
| LedgerLine | Linha contábil (side, account, amount) |
| Refund | Reembolso (amount, reason, status, gateway_ref) |
| AccountConfig | Conta contábil configurável por tenant |
| ExchangeRate | Taxa de câmbio |
| WebhookEndpoint | Endpoint de webhook (url, secret, events[]) |
| WebhookDelivery | Tentativa de entrega (status, attempts, response_code) |
| ReconciliationDiscrepancy | Discrepância encontrada na reconciliação |
| OutboxEvent | Evento pendente |
| AuditLog | Registro de auditoria |

### 5.4 Gateway de Pagamento

| Provider | Classe | Uso |
|----------|--------|-----|
| **fake** | FakeGatewayAdapter | Dev/test — simula authorize, capture, refund |
| **stripe** | StripeAdapter | Produção — Stripe API com retry e circuit breaker |

Configuração: `GATEWAY_PROVIDER=mock` (dev) ou `GATEWAY_PROVIDER=stripe` + `STRIPE_API_KEY`.

### 5.5 Worker

| Loop | Função | Intervalo |
|------|--------|-----------|
| Outbox dispatcher | Publica eventos PENDING no RabbitMQ | 1s |
| Consumer (payments) | Processa payment.authorized → settle + post ledger | Contínuo |
| Consumer (orders) | Processa payment.charge_requested → cria payment intent | Contínuo (se habilitado) |
| Consumer (saas) | Processa tenant.created/updated/deleted → sync tenant | Contínuo (se habilitado) |
| Webhook delivery | Envia webhooks para endpoints registrados | 5s |
| Reconciliation | Compara gateway vs local | Configurável |
| Audit retention | Remove audit logs antigos | Diário |

**Reconnect automático**: o cliente RabbitMQ reconecta com backoff exponencial (1s → 30s) em caso de queda de conexão.

### 5.6 Eventos

**Publicados** (exchange `payments.x`):

| Evento | Quando |
|--------|--------|
| payment.intent.created | Payment intent criado |
| payment.authorized | Pagamento autorizado |
| payment.settled | Pagamento liquidado |
| payment.refunded | Reembolso processado |

**Consumidos**:

| Evento | Fonte | Condição |
|--------|-------|----------|
| payment.authorized | próprio | Sempre (settle automático) |
| payment.charge_requested | node-b2b-orders | ORDERS_INTEGRATION_ENABLED |
| order.confirmed | node-b2b-orders | ORDERS_INTEGRATION_ENABLED |
| tenant.created/updated/deleted | spring-saas-core | SAAS_INTEGRATION_ENABLED |

### 5.7 Dados de Seed

- 3 usuários de seed (senhas definidas via variável de ambiente no seed — ver `.env.example`)
- Contas contábeis padrão (CASH, REVENUE, REFUND_EXPENSE)
- Feature flags: fast_settlement, chaos_controls
- 5 políticas ABAC para payments, ledger, admin, profile

---

## 6. saas-suite-ui — Frontend

### 6.1 Aplicações

#### Shop (porta 4200)

Loja B2B para compradores. Páginas:

| Página | Funcionalidade |
|--------|----------------|
| `/login` | Autenticação (dev ou OIDC) |
| `/products` | Catálogo com filtros (categoria, preço, estoque), busca, ordenação, grid/lista |
| `/product/:id` | Detalhe do produto, adicionar ao carrinho |
| `/checkout` | Finalização de compra |
| `/orders` | Meus pedidos |
| `/orders/:id` | Detalhe do pedido |
| `/profile` | Perfil do usuário |

Recursos: PWA (offline indicator, install prompt), SSR, tema light/dark, responsivo.

#### Ops Portal (porta 4300)

Portal operacional para equipe de operações. Páginas:

| Página | Permissão | Funcionalidade |
|--------|-----------|----------------|
| `/dashboard` | orders:read | Dashboard operacional |
| `/orders` | orders:read | Lista de pedidos (filtros, busca) |
| `/orders/new` | orders:write | Criar pedido manualmente |
| `/orders/:id` | orders:read | Detalhe com timeline de status |
| `/inventory/adjustments` | inventory:read | Histórico de ajustes de estoque |
| `/inventory/adjustments/new` | inventory:write | Criar ajuste de estoque |
| `/payments` | payments:read | Lista de pagamentos |
| `/ledger/entries` | ledger:read | Entradas contábeis |
| `/ledger/balances` | ledger:read | Balanços por conta |

Recursos: sidebar colapsável, busca global (pedidos, pagamentos, inventário), notificações, tenant switcher.

#### Admin Console (porta 4400)

Console de administração e governança. Páginas:

| Página | Permissão | Funcionalidade |
|--------|-----------|----------------|
| `/tenants` | tenants:read | Lista de tenants |
| `/tenants/:id` | tenants:read | Detalhe do tenant (policies, flags) |
| `/onboarding` | tenants:write | Wizard de onboarding de novo tenant |
| `/users` | admin:write | Gerenciamento de usuários (convidar, editar perfis/status, remover) |
| `/policies` | policies:read | Lista de políticas ABAC |
| `/flags` | flags:read | Lista de feature flags |
| `/audit` | audit:read | Log de auditoria com filtros |

### 6.2 Bibliotecas Compartilhadas

| Biblioteca | Responsabilidade |
|------------|------------------|
| shared/auth | AuthStore, AuthService, OidcAuthService, guards, login |
| shared/http | Interceptors (auth, tenant, correlation, idempotency, error) |
| shared/config | RuntimeConfigService, carrega config.json |
| shared/ui | Shell, Header, Sidebar, TenantSwitcher, StatusChip, EmptyState, ConfirmDialog |
| shared/i18n | Internacionalização (PT-BR, EN-US) |
| shared/search | Busca global cross-entidade |
| shared/notifications | NotificationStore, SSE, toast e bell |
| shared/telemetry | Logger, WebVitals |
| data-access/core | CoreApiClient → spring-saas-core |
| data-access/orders | OrdersApiClient → node-b2b-orders |
| data-access/payments | PaymentsApiClient → py-payments-ledger |

### 6.3 Autenticação

**Modo dev** (`authMode: "dev"` no config.json):
- Formulário com sub, email, tenant, roles, perms, plan, region
- Gera JWT via `/v1/dev/token` do spring-saas-core
- Token salvo em `sessionStorage`

**Modo OIDC** (`authMode: "oidc"`):
- OAuth 2.0 Authorization Code Flow via angular-oauth2-oidc
- Configurável: issuer, clientId, scope
- Refresh automático de token
- Em produção, se `authMode` é "dev" mas `isDevMode()` é false, força OIDC

### 6.4 Configuração

Cada app carrega `/assets/config.json` no bootstrap:

```json
{
  "coreApiBaseUrl": "http://localhost:8080",
  "ordersApiBaseUrl": "http://localhost:3000",
  "paymentsApiBaseUrl": "http://localhost:8000",
  "authMode": "dev",
  "logLevel": "debug",
  "version": "1.0.0"
}
```

Em deploy, variáveis de ambiente são injetadas via `config.template.json`.

---

## 7. Segurança

### 7.1 Autenticação (JWT)

| Aspecto | Dev | Produção |
|---------|-----|----------|
| Algoritmo | HS256 | RS256 via JWKS |
| Emissão | `/v1/dev/token` (core) ou auth local (node/py) | OIDC Provider (Keycloak) |
| Segredo | JWT_SECRET compartilhado | Par de chaves RSA via JWKS_URI |
| Issuer | spring-saas-core | OIDC_ISSUER_URI |

**Claims do JWT**:

| Claim | Tipo | Descrição |
|-------|------|-----------|
| sub | string | Identificador do sujeito (email) |
| tid | string | Tenant ID ("*" para admin global) |
| roles | string[] | Roles do usuário |
| perms | string[] | Permissões do usuário |
| plan | string | Plano do tenant (free/pro/enterprise) |
| region | string | Região do tenant |
| iss | string | Issuer |
| exp | number | Expiração (epoch) |

### 7.2 Autorização (ABAC + RBAC)

A autorização funciona em camadas:

1. **JWT Guard**: token válido?
2. **Tenant Guard**: `X-Tenant-Id` coincide com `tid` do JWT?
3. **Permissions Guard**: usuário tem a permissão necessária em `perms`?
4. **ABAC Guard**: existe política ALLOW para o `plan` e `region` do usuário?

**Regras ABAC**:
- DENY tem precedência sobre ALLOW
- Sem política explícita = negado (default-deny)
- Admin global (`tid=*`, role `admin`) bypassa todas as checagens

### 7.3 Permissões por Serviço

| Serviço | Permissões |
|---------|-----------|
| spring-saas-core | tenants:read/write, policies:read/write, flags:read/write, audit:read, analytics:read, admin:write |
| node-b2b-orders | orders:read/write, products:read/write, inventory:read/write, audit:read, admin:write, profile:read |
| py-payments-ledger | payments:read/write, ledger:read, audit:read, admin:write, profile:read |

### 7.4 Roles de Teste

| Role | Acesso |
|------|--------|
| **admin** | Tudo (admin global) |
| **ops** | CRUD pedidos/produtos/inventário/pagamentos |
| **sales** | Somente leitura |

### 7.5 Isolamento Multi-Tenant

- Cada request exige header `X-Tenant-Id`
- O valor deve coincidir com o `tid` do JWT
- Todas as queries filtram por `tenant_id`
- Dados de um tenant jamais são retornados para outro

---

## 8. Fluxos de Negócio E2E

### 8.1 Fluxo completo: pedido → pagamento → ledger

```
                    Usuário
                       │
                  1. Login
                       │
              ┌────────┴────────┐
              │   Shop / Ops    │
              │   Portal        │
              └────────┬────────┘
                       │
                 2. Criar pedido
                       │
              ┌────────┴────────┐
              │ node-b2b-orders │──── 3. Evento: order.created
              │  Status: CREATED│          │
              └────────┬────────┘          │
                       │              ┌────┴────┐
                       │              │ Worker  │ 4. Reserva estoque
                       │              │ (node)  │
                       │              └────┬────┘
                       │                   │
              ┌────────┴────────┐          │
              │  Status: RESERVED│◀─────────┘
              └────────┬────────┘
                       │
                 5. Confirmar pedido (API)
                       │
              ┌────────┴────────┐
              │ Status: CONFIRMED│──── 6. Evento: payment.charge_requested
              └────────┬────────┘          │
                       │              ┌────┴─────────────┐
                       │              │py-payments-ledger │ 7. Cria PaymentIntent
                       │              │ Status: AUTHORIZED│    (AUTHORIZED)
                       │              └────────┬─────────┘
                       │                       │
                       │              ┌────────┴─────────┐
                       │              │ Worker (payments) │ 8. Settle + post ledger
                       │              │ Status: SETTLED   │
                       │              └────────┬─────────┘
                       │                       │
                       │              9. Evento: payment.settled
                       │                       │
              ┌────────┴────────┐              │
              │  Status: PAID   │◀─────────────┘
              └─────────────────┘
```

### 8.2 Fluxo de reembolso

1. Operador chama `POST /v1/payment-intents/{id}/refund` no py-payments-ledger
2. Gateway processa reembolso
3. Ledger recebe lançamento reverso (DEBIT REFUND_EXPENSE, CREDIT CASH)
4. Evento `payment.refunded` publicado
5. Webhook entregue (se configurado)

### 8.3 Fluxo de onboarding de tenant

1. Admin cria tenant no spring-saas-core (`POST /v1/tenants`)
2. Evento `tenant.created` publicado
3. py-payments-ledger consome e cria tenant local + contas contábeis padrão
4. Admin configura políticas ABAC e feature flags
5. Cria usuários e atribui roles via Admin Console (`/users`) ou API (`POST /v1/users/invite`)

### 8.2 Gerenciamento de Usuários

O Admin Console oferece uma tela dedicada em `/users` (permissão `admin:write`) para gerenciar os usuários do tenant:

| Ação | Endpoint | Descrição |
|------|----------|-----------|
| Listar | `GET /v1/users` | Lista todos os usuários do tenant autenticado |
| Convidar | `POST /v1/users/invite` | Cria novo usuário com nome, email e perfis (admin, ops, viewer, member) |
| Editar | `PATCH /v1/users/{id}` | Altera nome, perfis e/ou status (PENDING, ACTIVE, SUSPENDED, DELETED) |
| Remover | `DELETE /v1/users/{id}` | Soft-delete do usuário |
| Detalhe | `GET /v1/users/{id}` | Dados completos de um usuário |

**Perfis disponíveis:**

| Perfil | Permissões |
|--------|------------|
| `admin` | Acesso total: tenants, policies, flags, audit, analytics, orders, inventory, payments, products |
| `ops` | Operacional: orders, inventory, products, payments, ledger |
| `viewer` | Somente leitura: orders, inventory, payments, ledger, products |
| `member` | Básico: products (leitura), orders (leitura), profile |

---

## 9. Comunicação entre Serviços

### 9.1 Topologia RabbitMQ

| Exchange | Tipo | Serviço de origem |
|----------|------|-------------------|
| `saas.events` | topic | spring-saas-core |
| `orders.x` | topic | node-b2b-orders |
| `payments.x` | topic | py-payments-ledger |

| Fila | Bound a | Consumido por |
|------|---------|---------------|
| `saas.outbox.events` | saas.events (saas.#) | spring-saas-core (próprio) |
| `orders.events` | orders.x (#) | node-b2b-orders worker |
| `orders.payments` | payments.x (payment.settled) | node-b2b-orders worker |
| `payments.events` | payments.x (#) | py-payments-ledger worker |
| `payments.orders.events` | orders.x (payment.charge_requested, order.confirmed) | py-payments-ledger worker |
| `payments.saas.events` | saas.events (tenant.*) | py-payments-ledger worker |

### 9.2 Padrão Outbox

Todos os serviços usam o padrão Outbox para garantir consistência:

1. Operação de domínio + inserção do evento na tabela `outbox_events` na mesma transação
2. Worker lê eventos PENDING periodicamente
3. Publica no RabbitMQ e marca como SENT
4. Em caso de falha, retry com backoff (até DEAD)

### 9.3 Formato de Evento

```json
{
  "id": "uuid",
  "aggregateType": "ORDER",
  "aggregateId": "uuid",
  "eventType": "order.created",
  "tenantId": "00000000-0000-0000-0000-000000000002",
  "correlationId": "uuid",
  "payload": { ... },
  "createdAt": "2026-03-07T12:00:00Z"
}
```

Headers RabbitMQ: `X-Correlation-Id`, `X-Tenant-Id`.

### 9.4 Contratos Compartilhados

| Contrato | Arquivo | Descrição |
|----------|---------|-----------|
| Identidade JWT | `docs/contracts/identity.md` | Claims, validação, modos |
| Headers HTTP | `docs/contracts/headers.md` | Authorization, X-Tenant-Id, X-Correlation-Id, Idempotency-Key |
| Eventos (índice suite) | [CATALOGO-EVENTOS.md](CATALOGO-EVENTOS.md) | Visão de negócio e exemplos |
| Eventos (contrato técnico) | **spring-saas-core** `docs/contracts/events.md` (réplicas nos backends) | Routing keys canónicos, config `SAAS_*` / integrações |

---

## 10. Observabilidade

### 10.1 Health Checks

| Serviço | Liveness | Readiness |
|---------|----------|-----------|
| spring-saas-core | `/healthz` ou `/actuator/health/liveness` | `/readyz` (DB + Redis + RabbitMQ) |
| node-b2b-orders | `/v1/healthz` | `/v1/readyz` (DB + Redis) |
| py-payments-ledger | `/healthz` | `/readyz` (DB + Redis + RabbitMQ) |

### 10.2 Métricas Prometheus

**spring-saas-core** (`/actuator/prometheus`):
- `saas_tenants_created_total`, `saas_policies_updated_total`, `saas_flags_toggled_total`
- `saas_access_denied_total`, `saas_outbox_published_total`, `saas_outbox_failed_total`

**node-b2b-orders** (`/v1/metrics`):
- `orders_created_total`, `orders_confirmed_total`, `orders_cancelled_total`
- `inventory_reserved_total`, `inventory_adjusted_total`

**py-payments-ledger** (`/metrics`):
- `payment_intents_created_total`, `payment_intents_confirmed_total`
- `outbox_published_total`, `outbox_failed_total`, `outbox_events_pending`
- `refunds_total`, `webhook_deliveries_total`, `reconciliation_discrepancy_total`
- `gateway_requests_total`, `gateway_request_duration_seconds`
- `http_requests_total`, `http_request_duration_seconds`

### 10.3 Correlation ID

Header `X-Correlation-Id` é propagado automaticamente:
- Se ausente, gerado como UUID no primeiro serviço
- Incluso em logs (MDC/structlog), eventos RabbitMQ e responses
- Permite rastrear uma requisição de ponta a ponta

### 10.4 Grafana

- Dashboard de outbox (published/failed por hora)
- Importado automaticamente via provisioning

### 10.5 Logging Estruturado

- spring-saas-core: JSON via Logback com correlation_id, tenant_id
- node-b2b-orders: JSON com ts, msg, workerId, tenantId
- py-payments-ledger: JSON via structlog com ts, level, logger, correlation_id, tenant_id, sub

---

## 11. Requisitos Não Funcionais

### 11.1 Rate Limiting

| Serviço | Escrita | Leitura | Escopo | Implementação |
|---------|---------|---------|--------|---------------|
| spring-saas-core | free: 60/min, pro: 300/min, ent: 1000/min | Idem | tenant + plan | Resilience4j |
| node-b2b-orders | 60/min | 240/min | tenant + user | Redis (Lua) |
| py-payments-ledger | 60/min | 240/min | tenant + user | Redis (Lua) |

Headers de resposta: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` (em 429).

### 11.2 Idempotência

Header `Idempotency-Key` obrigatório em operações de escrita:
- Armazenado em Redis com TTL de 24h
- Chave: `idem:{tenant_id}:{operation}:{key}`
- Segunda chamada com mesma chave retorna o resultado original

Endpoints que exigem: criar pedido, confirmar pedido, criar payment intent, confirmar payment, reembolso, ajuste de inventário.

### 11.3 CORS

- Dev: `*` (aceita qualquer origem)
- Produção: `CORS_ORIGINS` (lista de domínios permitidos)
- Credenciais: habilitadas
- Headers expostos: `X-Correlation-Id`, `X-RateLimit-*`, `Retry-After`

### 11.4 Segurança HTTP

- `@fastify/helmet` no node-b2b-orders (CSP, XSS, frame options)
- Spring Security no spring-saas-core (CSRF off, sessão stateless)
- Todos: HTTPS em produção via reverse proxy

### 11.5 Chaos Engineering

Disponível em ambiente local para testes de resiliência:
- `PUT /v1/admin/chaos` em node-b2b-orders e py-payments-ledger
- Configurável: `enabled`, `fail_percent`, `latency_ms`
- Controlado por tenant via Redis

### 11.6 Auditoria e Compliance

- Toda ação sensível é registrada no audit log
- Negações de acesso (ACCESS_DENIED) são auditadas
- Retenção configurável: `AUDIT_RETENTION_DAYS` (padrão 90 dias)
- Exportação em JSON e CSV (até 10.000 registros)
- Job de limpeza automática (spring: cron 2h UTC; py: loop diário)

---

## 12. Operação

### 12.1 Pré-requisitos

- Docker 24+ com Docker Compose v2
- Java 21 + Maven 3.9+
- Node.js 20+ + npm
- Python 3.12+ (para py-payments-ledger local)
- pnpm (frontend)
- jq, curl (scripts)

### 12.2 Subindo o Ambiente

```bash
cd fluxe-b2b-suite
./scripts/up-all.sh --no-front    # só backends
./scripts/up-all.sh               # backends + frontend
```

### 12.3 Parando o Ambiente

```bash
./scripts/up-all.sh --down
```

### 12.4 Populando Dados Demo

```bash
./scripts/demo-seed.sh
```

### 12.5 Smoke Tests

```bash
./scripts/smoke-suite.sh              # health check rápido
cd spring-saas-core  && ./scripts/smoke.sh   # 32 testes
cd node-b2b-orders   && ./scripts/smoke.sh   # testes de API
cd py-payments-ledger && ./scripts/smoke.sh  # 13 testes
```

### 12.6 Portas

| Serviço | API | PostgreSQL | Redis | RabbitMQ | RabbitMQ UI | Grafana |
|---------|-----|-----------|-------|----------|-------------|---------|
| spring-saas-core | 8080 | 5435 | 6382 | 5675 | 15675 | 3030 |
| node-b2b-orders | 3000 | 5433 | 6380 | 5673 | 15673 | 3001 |
| py-payments-ledger | 8000 | 5434 | 6381 | 5674 | 15674 | — |
| Shop | 4200 | — | — | — | — | — |
| Ops Portal | 4300 | — | — | — | — | — |
| Admin Console | 4400 | — | — | — | — | — |

### 12.7 Documentação de API (OpenAPI)

| Serviço | Swagger UI |
|---------|------------|
| spring-saas-core | http://localhost:8080/docs |
| node-b2b-orders | http://localhost:3000/docs |
| py-payments-ledger | http://localhost:8000/docs |

### 12.8 Variáveis de Ambiente Críticas

| Variável | Compartilhada | Descrição |
|----------|---------------|-----------|
| `JWT_SECRET` | Sim (todos) | Segredo HS256 |
| `JWT_ISSUER` | Sim (todos) | Issuer do JWT |
| `JWKS_URI` | Sim (todos) | URL JWKS para RS256 em produção |
| `DATABASE_URL` | Por serviço | PostgreSQL |
| `REDIS_URL` | Por serviço | Redis |
| `RABBITMQ_URL` | Por serviço | RabbitMQ |
| `GATEWAY_PROVIDER` | py-payments | mock ou stripe |
| `ORDERS_INTEGRATION_ENABLED` | py-payments | Consumir eventos de orders |
| `SAAS_INTEGRATION_ENABLED` | py-payments | Consumir eventos de tenants |
| `OUTBOX_PUBLISH_ENABLED` | spring-saas | Publicar eventos no RabbitMQ |
| `AUDIT_RETENTION_DAYS` | spring + py | Retenção de audit logs |

### 12.9 Credenciais de Teste

| Serviço | Usuário | Senha | Role | Tenant |
|---------|---------|-------|------|--------|
| node / py | admin@local | *(seed password)* | admin | — (global) |
| node / py | ops@demo.example.com | *(seed password)* | ops | *(tenant do seed)* |
| node / py | sales@demo.example.com | *(seed password)* | sales | *(tenant do seed)* |
| RabbitMQ | guest | guest | — | — |
| Grafana | admin | admin | — | — |

---

## 13. Referência de APIs

### 13.1 Resumo de Endpoints

| Serviço | Endpoints de negócio | Auth | Health | Observabilidade |
|---------|---------------------|------|--------|-----------------|
| spring-saas-core | 17 | 2 | 2 | 3 |
| node-b2b-orders | 15 | 2 | 2 | 1 |
| py-payments-ledger | 18 | 2 | 2 | 1 |
| **Total** | **50** | **6** | **6** | **5** |

### 13.2 Modelo de Resposta de Erro

Todos os serviços seguem o formato Problem Details (RFC 7807):

```json
{
  "title": "Bad Request",
  "status": 400,
  "detail": "Missing Idempotency-Key",
  "instance": "/v1/payment-intents/uuid/confirm",
  "correlation_id": "uuid"
}
```

### 13.3 Paginação

- **spring-saas-core**: cursor-based (cursor + limit) ou page-based (page + size)
- **node-b2b-orders**: cursor-based (cursor + limit)
- **py-payments-ledger**: cursor-based (cursor + limit)

---

## 14. Apêndices

### A. Glossário

| Termo | Definição |
|-------|-----------|
| **Tenant** | Organização/empresa isolada na plataforma |
| **ABAC** | Attribute-Based Access Control — controle de acesso por atributos (plan, region) |
| **RBAC** | Role-Based Access Control — controle de acesso por papéis |
| **Policy** | Regra que define se uma permissão é ALLOW ou DENY para determinados planos/regiões |
| **Feature Flag** | Funcionalidade que pode ser ativada/desativada por tenant com rollout gradual |
| **Outbox** | Padrão que garante que eventos sejam publicados após a transação de banco ser confirmada |
| **Ledger** | Livro contábil de partida dobrada (todo débito tem um crédito correspondente) |
| **Payment Intent** | Intenção de pagamento que passa por estados (CREATED → AUTHORIZED → SETTLED) |
| **Idempotency-Key** | Chave que garante que a mesma operação não seja executada duas vezes |
| **Correlation ID** | Identificador que permite rastrear uma requisição entre todos os serviços |

### B. Diagrama de Entidades por Serviço

**spring-saas-core**: Tenant ← FeatureFlag, Policy, AuditLog, OutboxEvent

**node-b2b-orders**: Tenant ← User ← UserRole → Role ← RolePermission → Permission; Tenant ← Order ← OrderItem; Tenant ← Product; Tenant ← InventoryItem; Tenant ← InventoryAdjustment; Policy, FeatureFlag, OutboxEvent, AuditLog

**py-payments-ledger**: Tenant ← User ← UserRole → Role ← RolePermission → Permission; Tenant ← PaymentIntent ← LedgerEntry ← LedgerLine; Tenant ← Refund; Tenant ← AccountConfig; Tenant ← WebhookEndpoint ← WebhookDelivery; Policy, FeatureFlag, OutboxEvent, AuditLog, ReconciliationDiscrepancy, ExchangeRate

### C. Estrutura de Diretórios

```
~/Documentos/wks/
├── spring-saas-core/           # Java 21 / Spring Boot 3.2
│   ├── src/main/java/          # Código fonte
│   ├── src/main/resources/     # Configs, Liquibase, templates
│   ├── docker/                 # Dockerfiles
│   ├── scripts/                # up, down, seed, smoke, migrate
│   ├── docs/                   # Contracts, architecture, API
│   └── docker-compose.yml
│
├── node-b2b-orders/            # TypeScript / NestJS 10
│   ├── src/                    # Código fonte (interfaces, shared, worker)
│   ├── prisma/                 # Schema + seed
│   ├── docker/                 # Dockerfiles
│   ├── scripts/                # up, down, seed, smoke, migrate
│   └── docker-compose.yml
│
├── py-payments-ledger/         # Python 3.12 / FastAPI
│   ├── src/                    # Código fonte (api, application, infrastructure, worker)
│   ├── migrations/             # Alembic
│   ├── docker/                 # Dockerfiles
│   ├── scripts/                # up, down, seed, smoke, migrate
│   └── docker-compose.yml
│
└── fluxe-b2b-suite/            # Angular 21 / Nx 22.5
    ├── saas-suite-ui/          # Monorepo frontend
    │   ├── apps/               # shop, ops-portal, admin-console
    │   └── libs/               # shared, data-access, domains, shop
    ├── scripts/                # up-all, demo-seed, smoke-suite
    ├── docs/                   # Guia operacional, manual, deploy
    └── deploy/                 # Oracle Cloud, Cloudflare, Terraform
```

---

**Felipe Ricarte Magalhães**  
Março de 2026
