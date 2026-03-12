# Documentação Viva — Fluxe B2B Suite

> **Este documento é gerado automaticamente.** Não edite manualmente.
> Para regenerar, execute: `./docs/scripts/generate-docs.sh`

**Gerado em:** 2026-03-12 16:47 UTC

---

## Visão Geral do Sistema

A Fluxe B2B Suite é uma plataforma SaaS multi-tenant para operações B2B, composta por:

| Serviço | Tecnologia | Porta | Responsabilidade |
|---------|-----------|-------|------------------|
| **spring-saas-core** | Java 21 / Spring Boot | 8080 | Control plane: tenants, ABAC/RBAC, feature flags, auditoria, JWT, outbox |
| **node-b2b-orders** | Node.js / NestJS / Prisma | 3000 | Pedidos, produtos, inventário, saga de pedido |
| **py-payments-ledger** | Python / FastAPI / SQLAlchemy | 8000 | Pagamentos, ledger double-entry, disputas, payouts, reconciliação |
| **saas-suite-ui** | Angular | 4200 | Interface administrativa |

### Infraestrutura compartilhada

- **PostgreSQL** — banco de dados por serviço (isolamento)
- **Redis** — cache, idempotência, rate limiting, circuit breaker
- **RabbitMQ** — mensageria assíncrona (outbox pattern, topic exchanges)

---

## Status dos Serviços

| Serviço | URL | Status |
|---------|-----|--------|
| spring-saas-core | http://localhost:8080 | ⬚ Offline |
| node-b2b-orders | http://localhost:3000 | ⬚ Offline |
| py-payments-ledger | http://localhost:8000 | ⬚ Offline |

---

# Catálogo de APIs — Fluxe B2B Suite

> Gerado automaticamente em 2026-03-12 16:47 UTC via `docs/scripts/api-catalog.py`

---

**Total de endpoints:** 179

| Serviço | Endpoints |
|---------|-----------|
| node-b2b-orders | 47 |
| py-payments-ledger | 74 |
| spring-saas-core | 58 |

## node-b2b-orders

| Método | Path | Controller | Permissão |
|--------|------|------------|-----------|
| `GET` | `/v1/admin/chaos` | admin | — |
| `PUT` | `/v1/admin/chaos` | admin | — |
| `GET` | `/v1/ai/docs` | ai | — |
| `GET` | `/v1/ai/recommendations/customer/{customerId}` | recommendation | — |
| `GET` | `/v1/ai/recommendations/feed/{customerId}` | recommendation | — |
| `GET` | `/v1/ai/recommendations/together/{sku}` | recommendation | — |
| `GET` | `/v1/ai/recommendations/trending` | recommendation | — |
| `GET` | `/v1/ai/search/orders` | nlp-search | — |
| `GET` | `/v1/ai/search/products` | nlp-search | — |
| `GET` | `/v1/analytics/anomalies` | analytics | — |
| `GET` | `/v1/analytics/demand` | analytics | — |
| `GET` | `/v1/analytics/inventory-forecast` | analytics | — |
| `GET` | `/v1/audit` | audit | — |
| `GET` | `/v1/audit/export` | audit | — |
| `POST` | `/v1/auth/token` | auth | — |
| `GET` | `/v1/events/clients` | events | — |
| `GET` | `/v1/export/inventory` | export | — |
| `GET` | `/v1/export/orders` | export | — |
| `GET` | `/v1/export/products` | export | — |
| `GET` | `/v1/healthz` | metrics | — |
| `POST` | `/v1/import/inventory` | import | — |
| `POST` | `/v1/import/orders` | import | — |
| `POST` | `/v1/import/products` | import | — |
| `GET` | `/v1/inventory` | inventory | — |
| `GET` | `/v1/inventory/adjustments` | inventory | — |
| `POST` | `/v1/inventory/adjustments` | inventory | — |
| `GET` | `/v1/me` | auth | — |
| `GET` | `/v1/metrics` | metrics | — |
| `GET` | `/v1/orders` | orders | — |
| `POST` | `/v1/orders` | orders | — |
| `GET` | `/v1/orders/{id}` | orders | — |
| `POST` | `/v1/orders/{id}/cancel` | orders | — |
| `POST` | `/v1/orders/{id}/confirm` | orders | — |
| `POST` | `/v1/orders/{id}/deliver` | orders | — |
| `POST` | `/v1/orders/{id}/ship` | orders | — |
| `GET` | `/v1/products` | products | — |
| `POST` | `/v1/products` | products | — |
| `GET` | `/v1/products/metadata/categories` | products | — |
| `GET` | `/v1/products/metadata/price-range` | products | — |
| `DELETE` | `/v1/products/{id}` | products | — |
| `GET` | `/v1/products/{id}` | products | — |
| `PATCH` | `/v1/products/{id}` | products | — |
| `GET` | `/v1/readyz` | metrics | — |
| `GET` | `/v1/webhooks` | webhooks | — |
| `POST` | `/v1/webhooks` | webhooks | — |
| `DELETE` | `/v1/webhooks/{id}` | webhooks | — |
| `GET` | `/v1/webhooks/{id}/deliveries` | webhooks | — |

## py-payments-ledger

| Método | Path | Controller | Permissão |
|--------|------|------------|-----------|
| `GET` | `/healthz` | health | — |
| `GET` | `/metrics` | metrics | — |
| `GET` | `/readyz` | health | — |
| `GET` | `/v1/accounts` | accounts | — |
| `POST` | `/v1/accounts` | accounts | — |
| `GET` | `/v1/admin/chaos` | admin | — |
| `PUT` | `/v1/admin/chaos` | admin | — |
| `GET` | `/v1/ai/docs` | ai_docs | — |
| `GET` | `/v1/analytics/cashflow-forecast` | analytics | — |
| `GET` | `/v1/analytics/fraud` | analytics | — |
| `GET` | `/v1/analytics/ledger-anomalies` | analytics | — |
| `GET` | `/v1/audit` | audit | — |
| `GET` | `/v1/audit/export` | audit | — |
| `POST` | `/v1/auth/token` | auth | — |
| `GET` | `/v1/disputes` | disputes | — |
| `POST` | `/v1/disputes` | disputes | — |
| `GET` | `/v1/disputes/{dispute_id}` | disputes | — |
| `POST` | `/v1/disputes/{dispute_id}/accept` | disputes | — |
| `POST` | `/v1/disputes/{dispute_id}/evidence` | disputes | — |
| `POST` | `/v1/disputes/{dispute_id}/resolve` | disputes | — |
| `GET` | `/v1/events/clients` | events | — |
| `GET` | `/v1/events/stream` | events | — |
| `GET` | `/v1/exchange-rates` | exchange_rates | — |
| `POST` | `/v1/exchange-rates` | exchange_rates | — |
| `GET` | `/v1/exchange-rates/convert` | exchange_rates | — |
| `GET` | `/v1/gateway-configs` | gateway_configs | — |
| `POST` | `/v1/gateway-configs` | gateway_configs | — |
| `DELETE` | `/v1/gateway-configs/{config_id}` | gateway_configs | — |
| `GET` | `/v1/invoices` | invoices | — |
| `POST` | `/v1/invoices` | invoices | — |
| `GET` | `/v1/invoices/{invoice_id}` | invoices | — |
| `POST` | `/v1/invoices/{invoice_id}/cancel` | invoices | — |
| `POST` | `/v1/invoices/{invoice_id}/issue` | invoices | — |
| `POST` | `/v1/invoices/{invoice_id}/pay` | invoices | — |
| `GET` | `/v1/ledger/balances` | ledger | — |
| `GET` | `/v1/ledger/balances/consolidated` | ledger | — |
| `GET` | `/v1/ledger/entries` | ledger | — |
| `GET` | `/v1/me` | auth | — |
| `GET` | `/v1/payment-intents` | payments | — |
| `POST` | `/v1/payment-intents` | payments | — |
| `GET` | `/v1/payment-intents/{pid}` | payments | — |
| `POST` | `/v1/payment-intents/{pid}/confirm` | payments | — |
| `POST` | `/v1/payment-intents/{pid}/refund` | refunds | — |
| `GET` | `/v1/payment-intents/{pid}/refunds` | refunds | — |
| `GET` | `/v1/payment-intents/{pid}/splits` | splits | — |
| `POST` | `/v1/payment-intents/{pid}/splits` | splits | — |
| `POST` | `/v1/payment-intents/{pid}/splits/process` | splits | — |
| `POST` | `/v1/payment-intents/{pid}/void` | payments | — |
| `GET` | `/v1/payment-links` | payment_links | — |
| `POST` | `/v1/payment-links` | payment_links | — |
| `GET` | `/v1/payment-links/{link_id}` | payment_links | — |
| `POST` | `/v1/payment-links/{link_id}/cancel` | payment_links | — |
| `POST` | `/v1/payment-links/{link_id}/pay` | payment_links | — |
| `GET` | `/v1/payouts` | payouts | — |
| `POST` | `/v1/payouts` | payouts | — |
| `GET` | `/v1/payouts/{payout_id}` | payouts | — |
| `POST` | `/v1/payouts/{payout_id}/cancel` | payouts | — |
| `POST` | `/v1/payouts/{payout_id}/process` | payouts | — |
| `GET` | `/v1/reconciliation/discrepancies` | reconciliation | — |
| `POST` | `/v1/reconciliation/discrepancies/{disc_id}/resolve` | reconciliation | — |
| `POST` | `/v1/reconciliation/run` | reconciliation | — |
| `GET` | `/v1/recurring-charges` | recurring | — |
| `POST` | `/v1/recurring-charges` | recurring | — |
| `POST` | `/v1/recurring-charges/{charge_id}/cancel` | recurring | — |
| `POST` | `/v1/recurring-charges/{charge_id}/pause` | recurring | — |
| `POST` | `/v1/recurring-charges/{charge_id}/resume` | recurring | — |
| `GET` | `/v1/reports/account-balances` | reports | — |
| `GET` | `/v1/reports/revenue` | reports | — |
| `GET` | `/v1/webhooks` | webhooks | — |
| `POST` | `/v1/webhooks` | webhooks | — |
| `DELETE` | `/v1/webhooks/{endpoint_id}` | webhooks | — |
| `POST` | `/webhooks/mercadopago` | mercadopago_webhooks | — |
| `POST` | `/webhooks/pagseguro` | pagseguro_webhooks | — |
| `POST` | `/webhooks/stripe` | stripe_webhooks | — |

## spring-saas-core

| Método | Path | Controller | Permissão |
|--------|------|------------|-----------|
| `GET` | `/healthz` | HealthController | — |
| `GET` | `/readyz` | HealthController | — |
| `POST` | `/v1/ai/analyze-audit` | AiController | — |
| `POST` | `/v1/ai/chat` | AiController | — |
| `GET` | `/v1/ai/docs` | AiController | — |
| `GET` | `/v1/ai/docs/tenant/{id}` | AiController | — |
| `GET` | `/v1/ai/insights` | AiController | — |
| `GET` | `/v1/ai/recommendations` | AiController | — |
| `POST` | `/v1/ai/recommendations` | AiController | — |
| `GET` | `/v1/ai/status` | AiController | — |
| `GET` | `/v1/analytics/anomalies` | AnalyticsController | — |
| `GET` | `/v1/analytics/summary` | AnalyticsController | — |
| `GET` | `/v1/audit` | AuditLogController | — |
| `GET` | `/v1/audit/export` | AuditLogController | — |
| `POST` | `/v1/auth/login` | AuthController | — |
| `POST` | `/v1/auth/password-reset/confirm` | AuthController | — |
| `POST` | `/v1/auth/password-reset/request` | AuthController | — |
| `POST` | `/v1/auth/register` | AuthController | — |
| `GET` | `/v1/billing/plans` | BillingController | — |
| `GET` | `/v1/billing/plans/{slug}` | BillingController | — |
| `POST` | `/v1/billing/subscriptions` | BillingController | — |
| `POST` | `/v1/billing/subscriptions/cancel` | BillingController | — |
| `GET` | `/v1/billing/subscriptions/current` | BillingController | — |
| `POST` | `/v1/dev/token` | DevTokenController | — |
| `GET` | `/v1/me` | MeController | — |
| `GET` | `/v1/metrics/business` | BusinessMetricsController | — |
| `POST` | `/v1/onboarding/signup` | OnboardingController | — |
| `GET` | `/v1/policies` | PolicyController | — |
| `POST` | `/v1/policies` | PolicyController | — |
| `DELETE` | `/v1/policies/{id}` | PolicyController | — |
| `GET` | `/v1/policies/{id}` | PolicyController | — |
| `PATCH` | `/v1/policies/{id}` | PolicyController | — |
| `POST` | `/v1/subscriptions/activate` | SubscriptionController | — |
| `POST` | `/v1/subscriptions/cancel` | SubscriptionController | — |
| `GET` | `/v1/subscriptions/current` | SubscriptionController | — |
| `POST` | `/v1/subscriptions/downgrade` | SubscriptionController | — |
| `POST` | `/v1/subscriptions/reactivate` | SubscriptionController | — |
| `POST` | `/v1/subscriptions/trial` | SubscriptionController | — |
| `POST` | `/v1/subscriptions/upgrade` | SubscriptionController | — |
| `GET` | `/v1/tenants` | TenantController | — |
| `POST` | `/v1/tenants` | TenantController | — |
| `DELETE` | `/v1/tenants/{id}` | TenantController | — |
| `GET` | `/v1/tenants/{id}` | TenantController | — |
| `PATCH` | `/v1/tenants/{id}` | TenantController | — |
| `GET` | `/v1/tenants/{id}/policies` | TenantSnapshotController | — |
| `GET` | `/v1/tenants/{id}/snapshot` | TenantSnapshotController | — |
| `GET` | `/v1/tenants/{tenantId}/flags` | FeatureFlagController | — |
| `POST` | `/v1/tenants/{tenantId}/flags` | FeatureFlagController | — |
| `DELETE` | `/v1/tenants/{tenantId}/flags/{flagName}` | FeatureFlagController | — |
| `PATCH` | `/v1/tenants/{tenantId}/flags/{flagName}` | FeatureFlagController | — |
| `GET` | `/v1/users` | UserController | — |
| `POST` | `/v1/users/invite` | UserController | — |
| `DELETE` | `/v1/users/{id}` | UserController | — |
| `GET` | `/v1/users/{id}` | UserController | — |
| `PATCH` | `/v1/users/{id}` | UserController | — |
| `GET` | `/v1/webhooks` | WebhookController | — |
| `POST` | `/v1/webhooks` | WebhookController | — |
| `DELETE` | `/v1/webhooks/{id}` | WebhookController | — |

---

## Endpoints comuns a todos os serviços

| Path | Descrição |
|------|-----------|
| `GET /healthz` | Health check de liveness |
| `GET /readyz` | Health check de readiness |
| `GET /metrics` ou `GET /actuator/prometheus` | Métricas Prometheus |
| `GET /v1/ai/docs` | Documentação gerada por IA |
| `GET /v1/audit` | Consulta de logs de auditoria |
| `GET /v1/audit/export` | Exportação de logs de auditoria |

---

## Catálogo de Eventos

Consulte [CATALOGO-EVENTOS.md](CATALOGO-EVENTOS.md) para documentação completa dos eventos.

### Resumo das Exchanges

| Exchange | Tipo | Produtor | Descrição |
|----------|------|----------|-----------|
| `saas.events` | topic | spring-saas-core | Governança: tenants, políticas, flags |
| `orders.x` | topic | node-b2b-orders | Pedidos e inventário |
| `payments.x` | topic | py-payments-ledger | Pagamentos, disputas, payouts |

---

## Referência de Configuração

Consulte [REFERENCIA-CONFIGURACAO.md](REFERENCIA-CONFIGURACAO.md) para todas as variáveis de ambiente.

### Variáveis críticas (compartilhadas)

| Variável | Descrição |
|----------|-----------|
| `JWT_SECRET` | Secret HS256 — deve ser idêntico em todos os serviços |
| `JWT_ISSUER` | Issuer do token JWT |
| `RABBITMQ_*` | Conexão com o broker RabbitMQ |

---

## Referência de Métricas

### spring-saas-core (Actuator + Micrometer)

| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `http_server_requests_seconds` | histogram | Latência HTTP por URI, método e status |
| `jvm_memory_used_bytes` | gauge | Uso de memória JVM |
| `hikaricp_connections_active` | gauge | Conexões ativas no pool |
| `resilience4j_circuitbreaker_state` | gauge | Estado do circuit breaker |
| `outbox_events_published_total` | counter | Eventos publicados pelo outbox |
| `outbox_events_failed_total` | counter | Falhas de publicação |

### node-b2b-orders (prom-client)

| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `http_request_duration_seconds` | histogram | Latência HTTP |
| `http_requests_total` | counter | Total de requisições por rota e status |
| `orders_created_total` | counter | Pedidos criados |
| `inventory_adjustments_total` | counter | Ajustes de inventário |
| `outbox_events_total` | counter | Eventos outbox processados |
| `circuit_breaker_state` | gauge | Estado do circuit breaker |
| `nodejs_heap_size_used_bytes` | gauge | Uso de heap Node.js |

### py-payments-ledger (prometheus-client)

| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `http_request_duration_seconds` | histogram | Latência HTTP |
| `http_requests_total` | counter | Total de requisições |
| `payment_intents_total` | counter | PaymentIntents criados |
| `ledger_entries_total` | counter | Entradas no ledger |
| `gateway_requests_total` | counter | Chamadas ao gateway por provedor e status |
| `circuit_breaker_state` | gauge | Estado do circuit breaker |
| `process_resident_memory_bytes` | gauge | Uso de memória RSS |

---

## Referência de Health Checks

| Serviço | Liveness | Readiness | Métricas |
|---------|----------|-----------|----------|
| spring-saas-core | `GET /healthz` | `GET /readyz` | `GET /actuator/prometheus` |
| node-b2b-orders | `GET /v1/healthz` | `GET /v1/readyz` | `GET /v1/metrics` |
| py-payments-ledger | `GET /healthz` | `GET /readyz` | `GET /metrics` |

### Critérios de Readiness

| Serviço | Componentes verificados |
|---------|------------------------|
| spring-saas-core | PostgreSQL, Redis, RabbitMQ |
| node-b2b-orders | PostgreSQL (Prisma), Redis, RabbitMQ |
| py-payments-ledger | PostgreSQL (SQLAlchemy), Redis, RabbitMQ |

---

## Mudanças Recentes

### fluxe-b2b-suite

- 6a23e33 merge: sprint 6 — observabilidade (8 minutes ago)
- a2244dd feat: sprint 6 — observabilidade completa (8 minutes ago)
- 84a5bdd merge: sprint 3 — qualidade (DAS, regras, histórias, E2E) (38 minutes ago)
- 4d3ef74 feat: sprint 3 — qualidade, documentação e testes E2E (38 minutes ago)
- 4f3f3b9 docs: update vistoria — all checklist items resolved in sprint 2 (61 minutes ago)
- f5dcc78 merge: integrate backlog sprint 2 — docs README cleanup (68 minutes ago)
- 2e90151 docs: fix README index — list only existing docs, move planned to roadmap (89 minutes ago)
- 54d7b33 merge: integrate shop search bar with debounce (2 hours ago)
- ef56af5 merge: integrate consistent i18n across portals (2 hours ago)
- a490d17 merge: integrate permission guards on portal routes (2 hours ago)

### spring-saas-core

- dbf0923 merge: sprint 6 — observabilidade (8 minutes ago)
- 88a103b feat: distributed tracing com OpenTelemetry (8 minutes ago)
- 6a4b733 merge: sprint 4 — subscription lifecycle avançado (28 minutes ago)
- bfb96ce feat: subscription lifecycle avançado com trial, upgrade, downgrade (28 minutes ago)
- 4f88618 merge: sprint 3 — qualidade (compilação, testes de contrato) (38 minutes ago)
- cf069a8 fix: corrigir erros de compilação e adicionar testes de contrato (38 minutes ago)
- 9abb135 merge: integrate backlog sprint 2 — complete all evolution criteria (68 minutes ago)
- 440bdf9 feat: complete backlog — webhooks, AI live docs, updated backlog (69 minutes ago)
- e4dfbc9 feat: add JWT rotation, audit retention job, Grafana alerts and backlog update (88 minutes ago)
- da91c46 merge: integrate user management and transactional email (2 hours ago)

### node-b2b-orders

- fcc00fa merge: sprint 6 — observabilidade (8 minutes ago)
- 93cfbc5 feat: distributed tracing com OpenTelemetry (8 minutes ago)
- cb428b2 merge: sprint 5 — integrações externas (17 minutes ago)
- bad7e50 feat: sprint 5 — SSE real-time, import/export em massa (17 minutes ago)
- 0b3ecaa merge: sprint 4 — retenção de audit log (28 minutes ago)
- afa2038 feat: retenção configurável de audit log com purge diário (28 minutes ago)
- 4df3808 merge: sprint 3 — qualidade (tipo, prisma, testes integração e contrato) (38 minutes ago)
- d5b2547 fix: corrigir erros de tipo e adicionar testes de integração e contrato (38 minutes ago)
- 0b69e51 merge: integrate backlog sprint 2 — complete all evolution criteria (68 minutes ago)
- d0e5107 feat: complete backlog — JWT rotation, OIDC, analytics, search, schema registry (69 minutes ago)

### py-payments-ledger

- a619a05 merge: sprint 6 — observabilidade (8 minutes ago)
- b67ebab feat: distributed tracing com OpenTelemetry (8 minutes ago)
- 63a8805 merge: sprint 5 — integrações externas (17 minutes ago)
- 75fcf36 feat: sprint 5 — integrações PagSeguro, Mercado Pago, SSE real-time (17 minutes ago)
- 0d0a349 merge: sprint 4 — capacidades financeiras v1.2 (28 minutes ago)
- 5247918 feat: sprint 4 — capacidades financeiras avançadas (v1.2) (28 minutes ago)
- 5158320 merge: sprint 3 — qualidade (testes integração e contrato) (38 minutes ago)
- f8adf48 feat: adicionar testes de integração e contrato cross-service (38 minutes ago)
- cfdcc6d docs: update ROADMAP — v1.1 complete, advance to v1.2 (61 minutes ago)
- 1c937d7 merge: integrate backlog sprint 2 — complete all evolution criteria (68 minutes ago)


---

*Documentação gerada automaticamente em 2026-03-12 16:47 UTC por `docs/scripts/generate-docs.sh`*
