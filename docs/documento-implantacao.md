# Documento de Implantação — Fluxe B2B Suite

Ordem de deploy, variáveis de ambiente, dependências e procedimentos básicos.

---

## 1. Ordem de implantação

A infraestrutura compartilhada deve estar disponível antes dos serviços que a utilizam.

| Ordem | Componente | Observação |
|-------|------------|------------|
| 1 | **RabbitMQ** | Um único broker para orders e payments (ex.: CloudAMQP ou instância gerida). |
| 2 | **PostgreSQL** | Uma instância por serviço (Core, Orders, Payments) ou schemas separados. |
| 3 | **Redis** | Uma instância por serviço (Core, Orders, Payments) quando utilizado. |
| 4 | **spring-saas-core** | Migrations (Liquibase) rodam no startup; health em /actuator/health. |
| 5 | **node-b2b-orders** | Migrate (Prisma) + seed; API e Worker; health em /v1/healthz e /v1/readyz. |
| 6 | **py-payments-ledger** | Migrate (Alembic) + seed; API e Worker; health em /healthz e /readyz. |
| 7 | **Frontend (fluxe-b2b-suite)** | Build estático (ex.: Nx build); servir via CDN ou servidor web; config com URLs dos backends. |

---

## 2. Variáveis de ambiente por serviço

### 2.1 spring-saas-core

| Variável | Obrigatório | Exemplo (produção) |
|----------|-------------|--------------------|
| `SPRING_PROFILES_ACTIVE` | Sim | `prod` |
| `DB_URL` | Sim | `jdbc:postgresql://host:5432/saascore` |
| `DB_USER` / `DB_PASS` | Sim | — |
| `AUTH_MODE` | Sim | `oidc` (produção) |
| `OIDC_ISSUER_URI` | Sim (se oidc) | `https://auth.empresa.com/realms/suite` |
| `JWT_HS256_SECRET` | Não (apenas dev) | — |
| `JWT_ISSUER` | Sim | Mesmo valor nos 3 backends em E2E |
| `RABBITMQ_HOST` / `RABBITMQ_PORT` | Conforme uso | — |

### 2.2 node-b2b-orders

| Variável | Obrigatório | Exemplo (produção) |
|----------|-------------|--------------------|
| `DATABASE_URL` | Sim | `postgresql://user:pass@host:5432/app` |
| `REDIS_URL` | Sim | `redis://host:6379` |
| `RABBITMQ_URL` | Sim | Mesmo broker que Payments |
| `JWT_SECRET` | Sim | **Mesmo que Core** (E2E) |
| `JWT_ISSUER` | Sim | **Mesmo que Core** (E2E) |

### 2.3 py-payments-ledger

| Variável | Obrigatório | Exemplo (produção) |
|----------|-------------|--------------------|
| `DATABASE_URL` | Sim | `postgresql+psycopg://user:pass@host:5432/app` |
| `REDIS_URL` | Sim | `redis://host:6379` |
| `RABBITMQ_URL` | Sim | Mesmo broker que Orders |
| `JWT_SECRET` | Sim | **Mesmo que Core** (E2E) |
| `JWT_ISSUER` | Sim | **Mesmo que Core** (E2E) |
| `ORDERS_INTEGRATION_ENABLED` | Recomendado | `true` |
| `CORS_ORIGINS` | Produção | `https://app.empresa.com,https://admin.empresa.com` |

### 2.4 Frontend (build-time ou runtime)

| Config | Descrição |
|--------|-----------|
| `coreApiBaseUrl` | URL do spring-saas-core (ex.: `https://core.empresa.com`) |
| `ordersApiBaseUrl` | URL do node-b2b-orders |
| `paymentsApiBaseUrl` | URL do py-payments-ledger |
| `authMode` | `oidc` em produção; `dev` só em ambiente de desenvolvimento |

---

## 3. Dependências entre serviços

- **Frontend** → HTTP para Core, Orders e Payments (e API de produtos no Shop).
- **Orders Worker** → RabbitMQ (publica em `payments.x`; consome fila de `payment.settled`).
- **Payments Worker** → RabbitMQ (consome `payment.charge_requested`; publica `payment.settled`).
- **Core** → PostgreSQL, Redis (opcional), RabbitMQ (opcional).
- **Orders** → PostgreSQL, Redis, RabbitMQ.
- **Payments** → PostgreSQL, Redis, RabbitMQ.

Nenhum serviço chama outro backend via HTTP no fluxo crítico pedido → pagamento; a integração é via mensageria.

---

## 4. Health checks e readiness

| Serviço | Liveness | Readiness |
|---------|----------|-----------|
| spring-saas-core | `/actuator/health/liveness` | `/actuator/health/readiness` |
| node-b2b-orders | `/v1/healthz` | `/v1/readyz` (DB + Redis) |
| py-payments-ledger | `/healthz` | `/readyz` (DB + Redis) |

Usar esses endpoints no orquestrador (Kubernetes, ECS, etc.) para liveness e readiness probes.

---

## 5. Rollback

- **Backends:** Reverter para a imagem/versão anterior e manter compatibilidade de contrato (eventos e APIs). Evitar quebrar consumers (ex.: worker de orders esperando mesmo formato de `payment.settled`).
- **Frontend:** Reverter deploy estático; garantir que as URLs dos backends na config continuem compatíveis.
- **Migrations:** Liquibase/Prisma/Alembic mantêm histórico; rollback de schema exige migração reversa ou restore de banco; preferir compatibilidade retroativa nas mudanças.

---

## 6. Referências

- [E2E-RUN.md](E2E-RUN.md) — Subida local e sugestões de hospedagem (Railway, AWS, etc.).
- [regras-de-negocio.md](regras-de-negocio.md) — Regras que impactam contratos e compatibilidade.
