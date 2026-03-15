# Configuração por ambiente — fonte única

Esta pasta centraliza **valores de configuração por contexto** (local, Docker, staging, prod) para evitar trocar variáveis à mão entre ambientes.

## Contextos

| Contexto   | Onde roda        | Uso |
|-----------|------------------|-----|
| **local** | Máquina (processos na sua máquina, infra no Docker) | Dev: Core/Orders/Payments rodando local; Postgres/Redis/Rabbit via `spring-saas-core/docker-compose` |
| **docker** | Tudo dentro do Docker Compose | Serviços se falam por nome de serviço (`postgres`, `redis`, `rabbitmq`) |
| **staging** | Railway (branch `develop`) | URLs e secrets de staging |
| **prod**   | Railway (branch `master`) | URLs e secrets de produção |

## Tabela única: hosts e portas

Use esta tabela como referência. Cada repositório deve seguir estes valores no ambiente correspondente.

### Infraestrutura (Postgres, Redis, RabbitMQ)

Quando você sobe **só a infra** com `spring-saas-core/docker-compose.yml` (postgres, redis, rabbitmq), as portas no **host** são:

| Serviço   | Contexto **local** (você acessa na máquina) | Contexto **docker** (dentro da rede Docker) |
|-----------|---------------------------------------------|---------------------------------------------|
| Postgres  | `localhost:5435`                             | `postgres:5432`                             |
| Redis     | `localhost:6382`                            | `redis:6379`                                |
| RabbitMQ  | `localhost:5675` (AMQP), `localhost:15675` (management) | `rabbitmq:5672`                      |

Bancos por serviço no mesmo Postgres:

- **Core (spring-saas-core):** database `saascore`, user `saascore`
- **Orders (node-b2b-orders):** database `app`, user `app` (criar com `CREATE DATABASE app; CREATE USER app ...` no container)
- **Payments (py-payments-ledger):** database à parte ou `app` conforme o projeto

### APIs (portas no host)

| Serviço   | Porta | Observação |
|-----------|-------|------------|
| spring-saas-core | 8080 | Auth, tenants, policies, users |
| node-b2b-orders  | 3000 | Orders, products, inventory |
| py-payments-ledger| 8000 | Payments |

### Frontend (saas-suite-ui)

Em **desenvolvimento** (`nx serve`), o `proxy.conf.json` redireciona:

- `/api/core` → `http://127.0.0.1:8080`
- `/api/orders` → `http://127.0.0.1:3000`
- `/api/payments` → `http://127.0.0.1:8000`

O `public/assets/config.json` deve usar **paths relativos** (`/api/core`, `/api/orders`, `/api/payments`) para não precisar trocar URL por ambiente no dev.

Em **Docker/Staging/Prod** as URLs vêm de variáveis de ambiente no build (ex.: `CORE_API_BASE_URL`, `ORDERS_API_BASE_URL`).

---

## Arquivos nesta pasta

- **`local.env.example`** — Variáveis para rodar backends **local** (infra no Docker, apps na máquina). Copie para o projeto correspondente ou use com `source`/`dotenv` conforme o caso.
- **`portas-local.md`** — Resumo só das portas/hosts para local (atalho).

Use `local.env.example` como referência ao configurar cada repositório (spring-saas-core, node-b2b-orders, py-payments-ledger); não é obrigatório ter um único arquivo .env que todos leem — o importante é os **valores** estarem alinhados com esta tabela.

---

## Como evitar “troca-troca”

1. **node-b2b-orders:** `.env` = Docker (postgres, redis, rabbitmq). Para rodar na máquina: `cp .env.local.example .env.local`; o app carrega `.env` e depois `.env.local` (overrides).
2. **py-payments-ledger:** Idem: `.env` = Docker; `.env.local` = overrides para local (usa `python-dotenv`). Ver `docs/CONFIG-AMBIENTES.md` no repo.
3. **spring-saas-core:** `application.yml` já tem defaults para local (5435, 6382, 5675). `.env.example` documenta as mesmas portas; opcionalmente `source .env.local` antes de rodar. Ver `docs/CONFIG-AMBIENTES.md` no repo.
4. **Front (saas-suite-ui):** Em dev, config com paths relativos e proxy. Em deploy, injetar URLs via env no build.

---

## Seed de staging a partir da máquina

O script `./scripts/staging-seed.sh railway` roda `railway run` nos repos linkados; dentro da rede do Railway a `DATABASE_URL` usa host interno (`postgres.railway.internal`). Se você rodar **na sua máquina** (por exemplo para debugar o seed), esse host não resolve. Use a **URL pública** do Postgres:

- No Railway: serviço **Postgres** do projeto → variável **DATABASE_PUBLIC_URL** (ex.: `ballast.proxy.rlwy.net:35931`).
- Exporte e rode os comandos manualmente, por exemplo para node-b2b-orders:
  ```bash
  export DATABASE_URL="<valor de DATABASE_PUBLIC_URL do serviço Postgres>"
  cd node-b2b-orders && npx prisma migrate deploy && npx prisma db seed
  ```
- Obter a URL: no diretório do monorepo, `railway link` ao serviço Postgres do ambiente staging e depois `railway run -s <postgres-service-id> env | grep DATABASE_PUBLIC_URL`.

Referência completa de variáveis: [REFERENCIA-CONFIGURACAO.md](../../docs/REFERENCIA-CONFIGURACAO.md).
