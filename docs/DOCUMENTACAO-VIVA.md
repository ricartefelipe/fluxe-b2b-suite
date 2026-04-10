# Documentação Viva — Fluxe B2B Suite

> **Este documento é gerado automaticamente.** Não edite manualmente.
> Para regenerar, execute: `./docs/scripts/generate-docs.sh`

**Gerado em:** 2026-04-10 08:29 UTC

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

> Gerado automaticamente em 2026-04-10 08:29 UTC via `docs/scripts/api-catalog.py`

---

**Total de endpoints:** 188

| Serviço | Endpoints |
|---------|-----------|
| node-b2b-orders | 47 |
| py-payments-ledger | 76 |
| spring-saas-core | 65 |

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
| `DELETE` | `/v1/payment-methods/{method_id}` | payment_methods | — |
| `GET` | `/v1/payment-methods/{method_id}` | payment_methods | — |
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
| `POST` | `/v1/auth/change-password` | AuthController | — |
| `POST` | `/v1/auth/login` | AuthController | — |
| `POST` | `/v1/auth/password-reset/confirm` | AuthController | — |
| `POST` | `/v1/auth/password-reset/request` | AuthController | — |
| `POST` | `/v1/auth/register` | AuthController | — |
| `GET` | `/v1/billing/plans` | BillingController | — |
| `GET` | `/v1/billing/plans/{slug}` | BillingController | — |
| `POST` | `/v1/billing/portal-session` | BillingController | — |
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
| `POST` | `/v1/subscriptions/schedule-cancel` | SubscriptionController | — |
| `POST` | `/v1/subscriptions/trial` | SubscriptionController | — |
| `POST` | `/v1/subscriptions/undo-schedule-cancel` | SubscriptionController | — |
| `POST` | `/v1/subscriptions/upgrade` | SubscriptionController | — |
| `GET` | `/v1/tenants` | TenantController | — |
| `POST` | `/v1/tenants` | TenantController | — |
| `DELETE` | `/v1/tenants/{id}` | TenantController | — |
| `GET` | `/v1/tenants/{id}` | TenantController | — |
| `PATCH` | `/v1/tenants/{id}` | TenantController | — |
| `GET` | `/v1/tenants/{id}/export` | TenantSnapshotController | — |
| `GET` | `/v1/tenants/{id}/health` | TenantSnapshotController | — |
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
| `POST` | `/v1/users/{id}/resend-invite` | UserController | — |
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

- 48220e8 Merge pull request #158 from ricartefelipe/feature/ux-polish-demo (25 minutes ago)
- 59ad3f9 Polir UX dos 3 frontends para demos com clientes (35 minutes ago)
- e85a3c2 Merge pull request #157 from ricartefelipe/develop (3 hours ago)
- 3caff05 Merge pull request #156 from ricartefelipe/fix/quality-audit (16 hours ago)
- 5a486b1 fix: auditoria de qualidade — CVE Vite, CI e scripts (16 hours ago)
- 10a3430 Merge pull request #155 from ricartefelipe/develop (5 days ago)
- 3398e58 Merge pull request #154 from ricartefelipe/fix/payments-abac-ui-normalize-claims (5 days ago)
- 3fa1852 fix(ops-ui): espelhar normalização professional/us-east-1 no ABAC payments (5 days ago)
- 51f0620 Merge pull request #153 from ricartefelipe/fix/ops-abac-all-services (6 days ago)
- 15bedd2 fix(ops): ABAC payments + orders em todas as rotas e menu necessários (6 days ago)

### spring-saas-core

- 37dda13 Merge pull request #110 from ricartefelipe/fix/policy-effect-column-transformer (2 hours ago)
- 8ac550b fix: ColumnTransformer UPPER(effect) para queries JPA com dados legacy (2 hours ago)
- fc094f6 Merge pull request #109 from ricartefelipe/fix/policy-effect-case-normalize (2 hours ago)
- 5cb762a fix: normalizar case do campo effect em policies (ALLOW/DENY) (2 hours ago)
- b6d2f8d Merge pull request #108 from ricartefelipe/develop (3 hours ago)
- 855b37f Merge pull request #107 from ricartefelipe/fix/cors-staging-restrict (16 hours ago)
- fb65e90 fix(cors): default to localhost when allowed-origins is empty (16 hours ago)
- c569eb1 Merge pull request #106 from ricartefelipe/fix/quality-audit (16 hours ago)
- 5704d72 fix: quality audit — rename workflow, add trace logging, clean annotations (16 hours ago)
- 29a07ed Merge pull request #105 from ricartefelipe/develop (5 days ago)

### node-b2b-orders

- 8f3c8f2 Merge pull request #89 from ricartefelipe/fix/order-saga-integrity (51 minutes ago)
- b684e28 fix: corrigir integridade da saga pedido-pagamento (54 minutes ago)
- dcee272 Merge pull request #88 from ricartefelipe/develop (3 hours ago)
- ca24ccb Merge pull request #87 from ricartefelipe/fix/raise-coverage-thresholds (15 hours ago)
- e16dee9 fix(quality): raise coverage thresholds as regression ratchet (15 hours ago)
- aeef97e Merge pull request #86 from ricartefelipe/fix/eliminate-any-types (15 hours ago)
- 59ddee9 fix(types): eliminate all explicit any types and enforce no-explicit-any rule (16 hours ago)
- e37d404 Merge pull request #85 from ricartefelipe/fix/quality-audit (16 hours ago)
- 5f5d770 fix(security): patch @nestjs/core injection vulnerability and rename workflow (16 hours ago)
- 9378301 Merge pull request #84 from ricartefelipe/fix/semgrep-tenants-proxy-trusted-response (5 days ago)

### py-payments-ledger

- 7ace0d8 Merge pull request #93 from ricartefelipe/develop (3 hours ago)
- 3d64bca Merge pull request #92 from ricartefelipe/fix/raise-coverage-threshold (15 hours ago)
- 81aa544 fix(quality): raise coverage threshold 25→26% as regression ratchet (15 hours ago)
- 6d504e9 Merge pull request #91 from ricartefelipe/fix/mypy-strict-types (15 hours ago)
- a7c3567 fix: remove mypy ignore_errors overrides and fix all type errors (16 hours ago)
- 598d88f Merge pull request #90 from ricartefelipe/fix/trivy-ci-gate (16 hours ago)
- 68aa626 fix(ci): make Trivy security scan fail on CRITICAL/HIGH vulnerabilities (16 hours ago)
- af2cb9c Merge pull request #89 from ricartefelipe/fix/quality-audit (16 hours ago)
- fba2895 fix: corrigir nomes de workflow, versão OpenAPI e dependências (16 hours ago)
- b2ed135 Merge pull request #88 from ricartefelipe/develop (5 days ago)


---

*Documentação gerada automaticamente em 2026-04-10 08:29 UTC por `docs/scripts/generate-docs.sh`*
