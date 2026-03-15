# Referência de Configuração — Fluxe B2B Suite

Todas as variáveis de ambiente dos serviços backend, extraídas dos arquivos de configuração do código-fonte.

**Portas e hosts por ambiente:** use a tabela única em [config/env/README.md](../config/env/README.md) para local vs Docker; evita trocar variáveis à mão.

---

## spring-saas-core

**Porta padrão:** 8080
**Arquivo de configuração:** `src/main/resources/application.yml`

### Servidor e Aplicação

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `SERVER_PORT` | int | `8080` | Porta HTTP do serviço |
| `SPRING_PROFILES_ACTIVE` | string | `local` | Perfil ativo (local, staging, production) |
| `APP_VERSION` | string | `1.0.0-SNAPSHOT` | Versão da aplicação |

### Banco de Dados (PostgreSQL)

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `DB_URL` | string | `jdbc:postgresql://localhost:5435/saascore` | URL JDBC do PostgreSQL |
| `DB_USER` | string | `saascore` | Usuário do banco |
| `DB_PASS` | string | `saascore` | Senha do banco |

### Redis

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `REDIS_HOST` | string | `localhost` | Host do Redis |
| `REDIS_PORT` | int | `6382` | Porta do Redis |

### RabbitMQ

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `RABBITMQ_HOST` | string | `localhost` | Host do RabbitMQ |
| `RABBITMQ_PORT` | int | `5675` | Porta AMQP do RabbitMQ |
| `RABBITMQ_USER` | string | `guest` | Usuário RabbitMQ |
| `RABBITMQ_PASS` | string | `guest` | Senha RabbitMQ |

### Autenticação e JWT

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `AUTH_MODE` | string | `hs256` | Modo de autenticação (`hs256`, `oidc`) |
| `JWT_ISSUER` | string | `spring-saas-core` | Issuer do JWT |
| `JWT_SECRET` / `JWT_HS256_SECRET` | string | `local-dev-secret-min-32-chars...` | Secret HS256 para assinatura JWT |
| `JWT_SECRET_PREVIOUS` / `JWT_HS256_SECRET_PREVIOUS` | string | _(vazio)_ | Secret anterior para rotação |

### OIDC (produção)

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `OIDC_ISSUER_URI` | string | _(vazio)_ | URI do issuer OIDC (Keycloak) |
| `OIDC_JWK_SET_URI` | string | _(vazio)_ | URI do JWK Set |
| `OIDC_CLIENT_ID` | string | _(vazio)_ | Client ID OIDC |
| `OIDC_AUDIENCE` | string | _(vazio)_ | Audience OIDC |

### Outbox

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `OUTBOX_PUBLISH_ENABLED` | boolean | `false` | Habilitar publicação de outbox no RabbitMQ |

### Auditoria

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `AUDIT_RETENTION_DAYS` | int | `90` | Dias de retenção dos logs de auditoria |

### CORS

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `CORS_ALLOWED_ORIGINS` | string | `*` | Origens permitidas para CORS |

### Email (convites, reset de senha)

Por padrão o Core **não envia email**: só registra o conteúdo no log (`provider=log`). Para o convidado **receber** o email, configure o envio real com Resend:

| Variável (Spring) | Env var | Padrão | Descrição |
|-------------------|---------|--------|-----------|
| `app.email.provider` | `EMAIL_PROVIDER` | `log` | `log` = só log; `resend` = envia via Resend |
| `app.email.resend-api-key` | `RESEND_API_KEY` | _(vazio)_ | API key do [Resend](https://resend.com) (obrigatório se provider=resend) |
| `app.email.from` | `EMAIL_FROM` | `noreply@fluxe.com.br` | Endereço remetente (domínio verificado no Resend) |
| `app.email.frontend-url` | `FRONTEND_URL` | `http://localhost:4200` | URL do admin-console para links no email (login, reset) |

**Railway (staging/prod):** no serviço spring-saas-core defina `EMAIL_PROVIDER=resend`, `RESEND_API_KEY=re_xxx`, `FRONTEND_URL=https://admin-console-xxx.up.railway.app`. Verifique o domínio do remetente em resend.com.

### IA/LLM

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `AI_ENABLED` | boolean | `false` | Habilitar funcionalidades de IA |
| `AI_PROVIDER` | string | _(vazio)_ | Provedor de IA (openai, anthropic) |
| `AI_API_KEY` | string | _(vazio)_ | Chave da API do provedor |
| `AI_BASE_URL` | string | _(vazio)_ | URL base da API |
| `AI_MODEL` | string | _(vazio)_ | Modelo a utilizar |
| `AI_MAX_TOKENS` | int | _(vazio)_ | Máximo de tokens por resposta |
| `AI_TEMPERATURE` | float | _(vazio)_ | Temperatura para geração |
| `AI_TIMEOUT_SECONDS` | int | _(vazio)_ | Timeout da chamada |

---

## node-b2b-orders

**Porta padrão:** 3000
**Arquivo de configuração:** `.env.example` + `ConfigModule` (NestJS)

### Aplicação

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `NODE_ENV` | string | `development` | Ambiente Node.js |
| `APP_ENV` | string | `local` | Ambiente da aplicação |
| `APP_NAME` | string | `node-b2b-orders` | Nome do serviço |
| `HTTP_PORT` | int | `3000` | Porta HTTP do serviço |

### Banco de Dados (PostgreSQL)

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `DATABASE_URL` | string | `postgresql://orders:orders@localhost:5434/orders` | URL de conexão PostgreSQL (Prisma) |

### Redis

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `REDIS_URL` | string | `redis://localhost:6381` | URL de conexão Redis |

### RabbitMQ

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `RABBITMQ_URL` | string | `amqp://guest:guest@localhost:5674` | URL AMQP do RabbitMQ |

### Autenticação e JWT

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `JWT_SECRET` | string | _(obrigatório)_ | Secret HS256 para validação JWT |
| `JWT_ISSUER` | string | `local-auth` | Issuer esperado no JWT |
| `TOKEN_EXPIRES_SECONDS` | int | `3600` | Tempo de expiração do token |
| `JWT_SECRET_PREVIOUS` | string | _(vazio)_ | Secret anterior para rotação |
| `JWT_ALGORITHM` | string | `HS256` | Algoritmo JWT (`HS256`, `RS256`) |
| `JWKS_URI` | string | _(vazio)_ | URI do JWK Set (modo RS256/OIDC) |
| `JWT_PUBLIC_KEY` | string | _(vazio)_ | Chave pública JWT alternativa |

### Mensageria (Orders)

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `ORDERS_EXCHANGE` | string | `orders.x` | Exchange de eventos de pedidos |
| `ORDERS_QUEUE` | string | `orders.events` | Fila principal de eventos |
| `ORDERS_DLQ` | string | `orders.dlq` | Dead-letter queue |

### Mensageria (Payments)

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `PAYMENTS_EXCHANGE` | string | `payments.x` | Exchange de pagamentos (consumo) |
| `PAYMENTS_INBOUND_QUEUE` | string | `orders.payments` | Fila de eventos de pagamento |
| `PAYMENTS_DLQ` | string | `orders.payments.dlq` | Dead-letter queue |

### Rate Limiting

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `RATE_LIMIT_WRITE_PER_MIN` | int | `60` | Limite de escrita por minuto |
| `RATE_LIMIT_READ_PER_MIN` | int | `240` | Limite de leitura por minuto |

### Chaos Engineering

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `CHAOS_ENABLED` | boolean | `false` | Habilitar chaos engineering |
| `CHAOS_FAIL_PERCENT` | int | `0` | Percentual de falhas simuladas |
| `CHAOS_LATENCY_MS` | int | `0` | Latência adicional simulada (ms) |

### Auditoria

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `AUDIT_RETENTION_DAYS` | int | `90` | Dias de retenção dos logs de auditoria |

### CORS

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `CORS_ORIGINS` | string | _(vazio)_ | Origens permitidas (separadas por vírgula) |

### Worker

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `HEARTBEAT_DIR` | string | `/tmp` | Diretório para heartbeat do worker |

---

## py-payments-ledger

**Porta padrão:** 8000
**Arquivo de configuração:** `src/shared/config.py` (Pydantic Settings)

### Aplicação

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `APP_ENV` | string | `local` | Ambiente da aplicação |
| `APP_NAME` | string | `py-payments-ledger` | Nome do serviço |
| `HTTP_HOST` | string | `0.0.0.0` | Host HTTP do servidor |
| `HTTP_PORT` | int | `8000` | Porta HTTP do serviço |

### Banco de Dados (PostgreSQL)

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `DATABASE_URL` | string | `postgresql+psycopg://app:app@localhost:5432/app` | URL SQLAlchemy do PostgreSQL |

### Redis

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `REDIS_URL` | string | `redis://localhost:6379/0` | URL de conexão Redis |

### RabbitMQ

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `RABBITMQ_URL` | string | `amqp://guest:guest@localhost:5672/` | URL AMQP do RabbitMQ |

### Autenticação e JWT

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `JWT_SECRET` | string | _(vazio)_ | Secret HS256 para validação JWT |
| `JWT_SECRET_PREVIOUS` | string | _(vazio)_ | Secret anterior para rotação |
| `JWT_ISSUER` | string | `local-auth` | Issuer esperado no JWT |
| `JWT_ALGORITHM` | string | `HS256` | Algoritmo JWT |
| `JWT_PUBLIC_KEY` | string | _(vazio)_ | Chave pública JWT |
| `JWKS_URI` | string | _(vazio)_ | URI do JWK Set (OIDC) |
| `TOKEN_EXPIRES_SECONDS` | int | `3600` | Expiração do token |

### Mensageria (Orders — consumo)

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `ORDERS_INTEGRATION_ENABLED` | boolean | `false` | Habilitar integração com orders |
| `ORDERS_EXCHANGE` | string | `orders.x` | Exchange do serviço de pedidos |
| `ORDERS_QUEUE` | string | `payments.orders.events` | Fila para eventos de pedidos |
| `ORDERS_ROUTING_KEYS` | string | `payment.charge_requested,order.confirmed` | Routing keys (separadas por vírgula) |

### Mensageria (SaaS — consumo)

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `SAAS_INTEGRATION_ENABLED` | boolean | `false` | Habilitar integração com saas-core |
| `SAAS_EXCHANGE` | string | `saas.x` | Exchange do saas-core |
| `SAAS_QUEUE` | string | `payments.saas.events` | Fila para eventos SaaS |
| `SAAS_ROUTING_KEYS` | string | `tenant.created,tenant.updated,tenant.deleted` | Routing keys |

### Gateways de Pagamento

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `GATEWAY_PROVIDER` | string | `fake` | Provedor de gateway (`fake`, `stripe`, `pagseguro`, `mercadopago`) |
| `STRIPE_API_KEY` | string | _(vazio)_ | Chave da API Stripe |
| `STRIPE_WEBHOOK_SECRET` | string | _(vazio)_ | Secret do webhook Stripe |
| `PAGSEGURO_TOKEN` | string | _(vazio)_ | Token da API PagSeguro |
| `PAGSEGURO_API_URL` | string | `https://api.pagseguro.com` | URL da API PagSeguro |
| `MERCADOPAGO_ACCESS_TOKEN` | string | _(vazio)_ | Token de acesso Mercado Pago |
| `MERCADOPAGO_API_URL` | string | `https://api.mercadopago.com` | URL da API Mercado Pago |

### Resiliência de Gateway

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `GATEWAY_MAX_RETRIES` | int | `3` | Máximo de retentativas |
| `GATEWAY_RETRY_BASE_DELAY` | float | `1.0` | Delay base entre retries (s) |
| `GATEWAY_RETRY_MAX_DELAY` | float | `30.0` | Delay máximo entre retries (s) |
| `CIRCUIT_BREAKER_FAILURE_THRESHOLD` | int | `5` | Falhas para abrir circuit breaker |
| `CIRCUIT_BREAKER_RECOVERY_TIMEOUT` | float | `30` | Timeout de recuperação (s) |

### Rate Limiting

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `RATE_LIMIT_WRITE_PER_MIN` | int | `60` | Limite de escrita por minuto |
| `RATE_LIMIT_READ_PER_MIN` | int | `240` | Limite de leitura por minuto |

### Idempotência

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `IDEMPOTENCY_TTL_SECONDS` | int | `86400` | TTL da chave de idempotência (24h) |

### Chaos Engineering

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `CHAOS_ENABLED` | boolean | `false` | Habilitar chaos engineering |
| `CHAOS_FAIL_PERCENT` | int | `0` | Percentual de falhas simuladas |
| `CHAOS_LATENCY_MS` | int | `0` | Latência adicional (ms) |

### Webhooks

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `WEBHOOK_DELIVERY_ENABLED` | boolean | `false` | Habilitar entrega de webhooks |

### Reconciliação

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `RECONCILIATION_ENABLED` | boolean | `false` | Habilitar reconciliação automática |
| `RECONCILIATION_INTERVAL_MINUTES` | int | `60` | Intervalo entre reconciliações |

### Relatórios

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `REPORT_REFRESH_INTERVAL_MINUTES` | int | `15` | Intervalo de refresh de relatórios |

### Auditoria

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `AUDIT_RETENTION_DAYS` | int | `90` | Dias de retenção dos logs |

### Cobranças

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `CHARGE_REQUEST_MAX_RETRIES` | int | `3` | Máximo de retries para charge requests |

### Segurança

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `ENCRYPTION_KEY` | string | _(vazio)_ | Chave AES-256 para criptografia de dados sensíveis |

### CORS

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `CORS_ORIGINS` | string | _(vazio)_ | Origens permitidas (separadas por vírgula) |

---

## Variáveis Compartilhadas

Variáveis que devem ter o mesmo valor em todos os serviços para funcionamento integrado:

| Variável | Descrição | Observação |
|----------|-----------|------------|
| `JWT_SECRET` | Secret HS256 compartilhado | Deve ser idêntico em todos os serviços |
| `JWT_ISSUER` | Issuer do JWT | spring-saas-core emite, orders e payments validam |
| `JWT_SECRET_PREVIOUS` | Secret anterior | Para rotação sem downtime |
| `RABBITMQ_*` / `RABBITMQ_URL` | Conexão RabbitMQ | Mesmo broker compartilhado |
| `AUDIT_RETENTION_DAYS` | Retenção de auditoria | Recomendado manter consistente |
