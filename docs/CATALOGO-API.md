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
