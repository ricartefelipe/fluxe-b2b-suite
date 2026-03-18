# Guia Operacional — Fluxe B2B Suite

## Visão geral

A Fluxe B2B Suite é composta por 4 repositórios que formam uma plataforma B2B multi-tenant:

| Serviço | Stack | Porta | Papel |
|---------|-------|-------|-------|
| **spring-saas-core** | Spring Boot 3.2 / Java 21 | 8080 | Control plane: tenants, ABAC, flags, auditoria, JWT |
| **node-b2b-orders** | NestJS 10 / Fastify / Prisma | 3000 | Pedidos, inventário, catálogo de produtos |
| **py-payments-ledger** | FastAPI / SQLAlchemy 2 | 8000 | Pagamentos, ledger contábil, webhooks |
| **fluxe-b2b-suite** | Angular 21 / Nx | 4200–4400 | Frontend (Shop, Ops Portal, Admin Console) |

### Diagrama de dependência

```
                  ┌──────────────────────┐
                  │  spring-saas-core    │
                  │  (control plane)     │
                  │  :8080               │
                  └──────┬───────┬───────┘
                JWT/ABAC │       │ JWT/ABAC
              ┌──────────┘       └──────────┐
              ▼                              ▼
  ┌───────────────────┐         ┌────────────────────────┐
  │ node-b2b-orders   │ ──────▶│ py-payments-ledger     │
  │ :3000             │ Rabbit  │ :8000                  │
  └───────────────────┘         └────────────────────────┘
```

---

## Pré-requisitos

- **Docker** 24+ com Docker Compose v2
- **Java 21** + Maven 3.9+ (para build local do spring-saas-core)
- **Node.js 20+** + npm (para node-b2b-orders)
- **Python 3.12+** + pip (para py-payments-ledger, se local)
- **pnpm** (para frontend, instalado automaticamente se ausente)
- **jq** e **curl** (para scripts de seed e smoke)

### Estrutura de diretórios esperada

```
~/Documentos/wks/
├── spring-saas-core/
├── node-b2b-orders/
├── py-payments-ledger/
└── fluxe-b2b-suite/
```

---

## Subindo o ambiente completo

### Opção 1: Tudo com um comando (recomendado)

```bash
cd fluxe-b2b-suite
./scripts/up-all.sh --no-front    # só backends
./scripts/up-all.sh               # backends + escolha de frontend
```

Esse script:
1. Verifica Docker e cria a rede `fluxe_shared`
2. Configura `.env` nos projetos Node e Python (alinha JWT)
3. Builda e sobe o spring-saas-core (tenta JAR local primeiro)
4. Sobe node-b2b-orders com migrações + seed
5. Sobe py-payments-ledger com migrações + seed
6. Aguarda health de cada serviço
7. Opcionalmente inicia o frontend

### Opção 2: Projeto por projeto

```bash
# 1. spring-saas-core (sobe infra + app)
cd spring-saas-core
./scripts/up.sh

# 2. node-b2b-orders (sobe infra + app)
cd node-b2b-orders
./scripts/up.sh

# 3. py-payments-ledger (sobe infra + app)
cd py-payments-ledger
./scripts/up.sh
```

### Parando tudo

```bash
cd fluxe-b2b-suite
./scripts/up-all.sh --down
```

---

## Dados iniciais (seed)

Cada projeto já popula dados automaticamente durante o startup:

### spring-saas-core (Liquibase, automático)

| Entidade | Dados |
|----------|-------|
| Tenants | `Fluxe B2B Suite` (enterprise, global), `Demo Corp` (pro, sa-east-1) |
| Policies | 12 políticas ABAC (tenants, policies, flags, admin, audit, users, analytics) |
| Feature Flags | `new_dashboard`, `beta_export` (Demo Corp) |

> **Nota:** Os changesets 002 (seed) rodam apenas em contexto `dev/test/local`. O changeset 008 roda em **todos os ambientes** e garante que o tenant Fluxe B2B Suite e as políticas essenciais existam inclusive em produção.

### node-b2b-orders (Prisma seed)

| Entidade | Dados |
|----------|-------|
| Tenant | `tenant_demo` (plano pro, region-a) |
| Usuários | `admin@local` / `admin123`, `ops@demo.example.com` / `ops123`, `sales@demo.example.com` / `sales123` |
| Roles | admin, ops, sales (com permissões diferenciadas) |
| Produtos | 25 produtos em 5 categorias (Eletrônicos, Escritório, Industrial, Segurança, Limpeza) |
| Inventário | SKU-1 (100 un.), SKU-2 (50 un.) + estoque para todos os 25 produtos |
| Policies | 8 políticas ABAC para orders, inventory, products, admin, profile |

### py-payments-ledger (Python seed)

| Entidade | Dados |
|----------|-------|
| Tenant | `tenant_demo` (plano pro, region-a) |
| Usuários | `admin@local` / `admin123`, `ops@demo.example.com` / `ops123`, `sales@demo.example.com` / `sales123` |
| Roles | admin, ops, sales |
| Policies | 5 políticas ABAC para payments, ledger, admin, profile |
| Feature Flags | `fast_settlement`, `chaos_controls` |

### Populando dados demo via API

Após o ambiente estar rodando, execute:

```bash
cd fluxe-b2b-suite
./scripts/demo-seed.sh
```

Esse script cria dados realistas via API:
- Token de autenticação em cada serviço
- Ajuste de inventário para produtos do catálogo
- Pedidos em diferentes estados (criado → reservado → confirmado)
- Payment intents com liquidação automática
- Entradas no ledger contábil

---

## Portas e URLs

### APIs

| Serviço | URL | Health |
|---------|-----|--------|
| spring-saas-core | http://localhost:8080 | `/actuator/health/liveness` |
| node-b2b-orders | http://localhost:3000 | `/v1/healthz` |
| py-payments-ledger | http://localhost:8000 | `/healthz` |

### Infraestrutura

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| RabbitMQ (core) | http://localhost:15675 | guest / guest |
| RabbitMQ (orders) | http://localhost:15673 | guest / guest |
| RabbitMQ (payments) | http://localhost:15674 | guest / guest |
| Grafana (core) | http://localhost:3030 | admin / admin |
| Prometheus (core) | http://localhost:9090 | — |

### Frontend (Angular)

| App | URL | Comando |
|-----|-----|---------|
| Shop (loja B2B) | http://localhost:4200 | `pnpm nx serve shop` |
| Ops Portal | http://localhost:4300 | `pnpm nx serve ops-portal` |
| Admin Console | http://localhost:4400 | `pnpm nx serve admin-console` |

### Documentação de API (OpenAPI/Swagger)

| Serviço | URL |
|---------|-----|
| spring-saas-core | http://localhost:8080/swagger-ui.html |
| node-b2b-orders | http://localhost:3000/docs |
| py-payments-ledger | http://localhost:8000/docs |

---

## Autenticação e JWT

Todos os serviços compartilham o mesmo segredo JWT no ambiente local:

| Variável | Valor (dev) |
|----------|-------------|
| `JWT_SECRET` | `local-dev-secret-min-32-chars-for-hs256-signing` |
| `JWT_ISSUER` | `spring-saas-core` |
| Algoritmo | HS256 (dev) / RS256 via JWKS (produção) |

### Gerando token via spring-saas-core

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/v1/dev/token \
  -H "Content-Type: application/json" \
  -d '{
    "sub": "ops@demo.example.com",
    "tid": "00000000-0000-0000-0000-000000000002",
    "roles": ["ops"],
    "perms": ["orders:write","orders:read","inventory:read","inventory:write","products:read","products:write","payments:write","payments:read","ledger:read"],
    "plan": "pro",
    "region": "region-a"
  }' | jq -r '.access_token')
```

Esse token é aceito pelos 3 backends.

### Autenticação local (node / py)

Os serviços Node e Python também têm endpoint local de autenticação:

```bash
# node-b2b-orders
curl -s -X POST http://localhost:3000/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email":"ops@demo.example.com","password":"ops123","tenantId":"tenant_demo"}'

# py-payments-ledger
curl -s -X POST http://localhost:8000/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email":"ops@demo.example.com","password":"ops123","tenantId":"tenant_demo"}'
```

---

## Fluxo E2E: pedido → pagamento

### 1. Gerar token (via spring-saas-core)

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/v1/dev/token \
  -H "Content-Type: application/json" \
  -d '{
    "sub": "ops@demo.example.com",
    "tid": "00000000-0000-0000-0000-000000000002",
    "roles": ["ops"],
    "perms": ["orders:write","orders:read","inventory:read","inventory:write","products:read","products:write","payments:write","payments:read","ledger:read"],
    "plan": "pro",
    "region": "region-a"
  }' | jq -r '.access_token')
```

### 2. Criar pedido (node-b2b-orders)

```bash
ORDER=$(curl -s -X POST http://localhost:3000/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: tenant_demo" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "customerId": "customer-001",
    "items": [{"sku": "ELET-001", "qty": 1, "price": 4899.90}]
  }')
ORDER_ID=$(echo $ORDER | jq -r '.id')
echo "Pedido: $ORDER_ID — Status: $(echo $ORDER | jq -r '.status')"
```

O worker do node-b2b-orders reserva o inventário automaticamente (CREATED → RESERVED).

### 3. Confirmar pedido

```bash
sleep 3  # aguarda worker reservar
curl -s -X PATCH "http://localhost:3000/v1/orders/$ORDER_ID/confirm" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: tenant_demo" | jq '.status'
# → "CONFIRMED"
```

### 4. Criar payment intent (py-payments-ledger)

```bash
PAY_TOKEN=$(curl -s -X POST http://localhost:8000/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email":"ops@demo.example.com","password":"ops123","tenantId":"tenant_demo"}' \
  | jq -r '.access_token')

PI=$(curl -s -X POST http://localhost:8000/v1/payment-intents \
  -H "Authorization: Bearer $PAY_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: tenant_demo" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d "{
    \"amount\": 4899.90,
    \"currency\": \"BRL\",
    \"description\": \"Pedido $ORDER_ID\",
    \"reference\": \"$ORDER_ID\"
  }")
PI_ID=$(echo $PI | jq -r '.id')
echo "Payment Intent: $PI_ID — Status: $(echo $PI | jq -r '.status')"
```

### 5. Confirmar pagamento

```bash
curl -s -X POST "http://localhost:8000/v1/payment-intents/$PI_ID/confirm" \
  -H "Authorization: Bearer $PAY_TOKEN" \
  -H "X-Tenant-Id: tenant_demo" | jq '.status'
# → "AUTHORIZED"
```

O worker do py-payments-ledger liquida automaticamente (AUTHORIZED → SETTLED) e posta no ledger.

### 6. Verificar ledger

```bash
sleep 5
curl -s http://localhost:8000/v1/ledger/entries \
  -H "Authorization: Bearer $PAY_TOKEN" \
  -H "X-Tenant-Id: tenant_demo" | jq '.[0] | {type, amount, currency}'
```

---

## Smoke tests

Cada projeto inclui smoke tests que validam o funcionamento:

```bash
# Todos de uma vez
cd fluxe-b2b-suite && ./scripts/smoke-suite.sh

# Por projeto
cd spring-saas-core  && ./scripts/smoke.sh
cd node-b2b-orders   && ./scripts/smoke.sh
cd py-payments-ledger && ./scripts/smoke.sh
```

---

## ABAC — Controle de acesso

O sistema implementa ABAC (Attribute-Based Access Control) em todas as camadas:

| Atributo | Verificação |
|----------|-------------|
| **Tenant** | `X-Tenant-Id` no header deve coincidir com o `tid` do JWT |
| **Role** | Roles do JWT devem ter a permissão necessária |
| **Plan** | Plano do tenant deve estar na lista de planos permitidos da política |
| **Region** | Região do tenant deve estar na lista de regiões permitidas |

### Usuários de teste e permissões

| Usuário | Role | Pode fazer |
|---------|------|------------|
| `admin@local` / `admin123` | admin | Tudo (global admin) |
| `ops@demo.example.com` / `ops123` | ops | CRUD pedidos/produtos/inventário/pagamentos |
| `sales@demo.example.com` / `sales123` | sales | Somente leitura |

---

## Troubleshooting

### Docker build falha com erro de DNS

Se o build dentro do Docker não resolve nomes (comum em certas redes), builde localmente:

```bash
# spring-saas-core
cd spring-saas-core
mvn -q -DskipTests package -B
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build

# node-b2b-orders / py-payments-ledger
# Suba apenas infra no Docker e rode a app localmente
cd node-b2b-orders
docker compose up -d postgres redis rabbitmq
npm ci && npm run build && npm run start:dev
```

### Migração do py-payments falha com ModuleNotFoundError

Se `alembic upgrade head` falha dentro do container:

```bash
docker compose exec api env PYTHONPATH=/app alembic upgrade head
```

### Worker do py-payments não processa eventos (outbox DEAD)

Se eventos ficam `DEAD` no outbox após queda de conexão com RabbitMQ:

```bash
# Reset eventos DEAD para reprocessamento
docker exec py-payments-ledger-postgres-1 psql -U app -d app \
  -c "UPDATE outbox_events SET status='PENDING', attempts=0, locked_at=NULL, locked_by=NULL WHERE status='DEAD';"
```

O worker possui reconnect automático com backoff exponencial, mas eventos que falharam durante a queda precisam ser resetados manualmente.

### Pedido não muda de CREATED para RESERVED

O worker do node-b2b-orders é responsável por essa transição. Verifique se o worker está rodando:

```bash
docker compose -f node-b2b-orders/docker-compose.yml logs -f worker
```

### Logs de um serviço

```bash
cd <projeto>
docker compose logs -f           # todos
docker compose logs -f api       # apenas API
docker compose logs -f worker    # apenas worker
```

---

## Variáveis de ambiente

### Compartilhadas (devem ser iguais entre serviços)

| Variável | Valor dev | Descrição |
|----------|-----------|-----------|
| `JWT_SECRET` | `local-dev-secret-min-32-chars-for-hs256-signing` | Segredo HMAC HS256 |
| `JWT_ISSUER` | `spring-saas-core` | Issuer do token |

### spring-saas-core

| Variável | Default | Descrição |
|----------|---------|-----------|
| `SPRING_PROFILES_ACTIVE` | `local` | Profile ativo |
| `DB_URL` | `jdbc:postgresql://postgres:5432/saascore` | URL do PostgreSQL |
| `REDIS_HOST` | `redis` | Host Redis |
| `RABBITMQ_HOST` | `rabbitmq` | Host RabbitMQ |
| `AUTH_MODE` | `dev` | `dev` (HS256 local) ou `oidc` (RS256 prod) |

### node-b2b-orders

| Variável | Default | Descrição |
|----------|---------|-----------|
| `DATABASE_URL` | `postgresql://app:app@postgres:5432/app` | URL do PostgreSQL |
| `REDIS_URL` | `redis://redis:6379` | URL Redis |
| `RABBITMQ_URL` | `amqp://guest:guest@rabbitmq:5672` | URL RabbitMQ |
| `HTTP_PORT` | `3000` | Porta HTTP |

### py-payments-ledger

| Variável | Default | Descrição |
|----------|---------|-----------|
| `DATABASE_URL` | `postgresql://app:app@postgres:5432/app` | URL do PostgreSQL |
| `REDIS_URL` | `redis://redis:6379` | URL Redis |
| `RABBITMQ_URL` | `amqp://guest:guest@rabbitmq:5672` | URL RabbitMQ |
| `HTTP_PORT` | `8000` | Porta HTTP |
| `GATEWAY_PROVIDER` | `mock` | Gateway de pagamento |
