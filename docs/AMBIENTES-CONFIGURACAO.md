# Ambientes — Local, Staging, Produção

Documento central que define os **três ambientes** do Fluxe B2B Suite: configuração, dados e quando usar cada um.

---

## Visão geral

| Ambiente | Onde roda | Branch | Dados |
|----------|-----------|--------|-------|
| **Local** | Sua máquina | qualquer | Migration + seed **até a tampa** (máximo para testar) |
| **Staging** | Railway | `develop` | Migration + seed completo |
| **Produção** | Railway | `master` | Migration + **só o essencial** (tenant System, políticas, estrutura) |

**Seu usuário funciona em todos os ambientes.** Mesmo login (ex.: `admin@local` / `admin123` em local/staging; em prod, criar usuário real ou manter um admin inicial).

---

## 1. Local — sua máquina

### O que é
Ambiente de desenvolvimento na sua máquina. Você controla quando sobe e desce.

### Como subir
```bash
cd fluxe-b2b-suite
./scripts/up-local.sh
```

Ou projeto por projeto (ver `spring-saas-core/docs/SUBIR-E-TESTAR-TODOS-PROJETOS.md`).

### Dados
- **spring-saas-core:** Liquibase com `contexts: local,seed` → schema + 008 (essencial) + 009 (realista: tenants, usuários, flags, audit, webhooks, outbox)
- **node-b2b-orders:** `prisma migrate deploy` + `prisma db seed` → tenant_demo, produtos, pedidos, inventário
- **py-payments-ledger:** `alembic upgrade head` + seed (scripts)
- **demo-seed.sh:** popula dados extras via API (se existir)

### Variáveis e portas (fonte única)
- **Referência central:** [config/env/](../config/env/README.md) — tabela de hosts/portas por contexto (local vs Docker) e arquivo `local.env.example`.
- **Portas local** (infra via `spring-saas-core/docker-compose`): Postgres `localhost:5435`, Redis `localhost:6382`, RabbitMQ `localhost:5675`; APIs: Core 8080, Orders 3000, Payments 8000; fronts 4200/4300.
- **node-b2b-orders:** `.env` = valores Docker (postgres, redis, rabbitmq). Para rodar na máquina: `cp .env.local.example .env.local` no repo; o app carrega `.env` e depois `.env.local` (overrides).
- **spring-saas-core:** `application.yml` já tem defaults para local (5435, 6382, 5675); use `SPRING_PROFILES_ACTIVE=local`.
- JWT_SECRET igual em todos os backends (local).

### Quando usar
- Desenvolvimento diário
- Testes manuais
- Debug

---

## 2. Staging — Railway (develop)

### O que é
Ambiente na nuvem para testar antes de produção. Deploy automático quando há push em `develop`.

### Como configurar
1. Projeto Railway "Fluxe B2B Suite - Staging"
2. Para cada serviço: **Settings** → **Source** → **Production Branch** = `develop`
3. Variáveis de ambiente (ver `railway.prod.env.example` em cada repo)
4. **SPRING_PROFILES_ACTIVE=staging** no spring-saas-core (usa `application-staging.yml` com seed)

### Alimentar Staging com dados (após primeiro deploy)

Do repositório **fluxe-b2b-suite**, com Railway CLI logado e cada backend (node-b2b-orders, py-payments-ledger) linkado ao **projeto Railway Staging**:

```bash
./scripts/staging-seed.sh railway
```

O script roda em sequência: migrations + seed do node-b2b-orders e do py-payments-ledger. O **spring-saas-core** já aplica seed no deploy quando `SPRING_PROFILES_ACTIVE=staging` (Liquibase contexts: staging,seed).

Para dados extras (pedidos, payment intents, inventário via API), use `./scripts/demo-seed.sh` apontando para as URLs de staging (variáveis `CORE`, `ORDERS`, `PAYMENTS` ou editar o script).

### Dados
- Mesmo que local: **migration + seed completo** para testes ricos.

### Quando usar
- Validar integração antes de merge em master
- Demos para stakeholders
- QA

---

## 3. Produção — Railway (master)

### O que é
Ambiente real. "O bicho pega" aqui.

### Como configurar
1. Projeto Railway "Fluxe B2B Suite - Production"
2. Para cada serviço: **Production Branch** = `master`
3. Variáveis de produção (JWT em segredo, CORS restrito, OIDC se usar, etc.)
4. **SPRING_PROFILES_ACTIVE=prod** no spring-saas-core

### Migrations (sem seed completo)
```bash
# spring-saas-core: Liquibase no startup (contexts: prod) → só 008 (essencial)

# node-b2b-orders
railway run npx prisma migrate deploy
# NÃO rodar: npx prisma db seed

# py-payments-ledger
railway run alembic upgrade head
# NÃO rodar seed completo
```

### Dados
- **spring-saas-core:** 008 apenas → tenant System, políticas ABAC essenciais
- **node-b2b-orders:** apenas schema (sem seed de produtos/pedidos)
- **py-payments-ledger:** apenas schema
- Itens, produtos, usuários reais → criados via fluxo normal da aplicação (Admin, Shop, etc.)

### Segurança
- `APP_DEV_TOKEN_ENDPOINT_ENABLED=false`
- CORS com domínios reais
- OIDC recomendado para autenticação
- JWT_SECRET forte e único

---

## Fluxo de dados (resumo)

```
Local:      migration + seed completo (002, 008, 009 + Prisma seed + Python seed)
Staging:    migration + seed completo (idem)
Produção:   migration + 008 (essencial) + schema dos outros; sem seed de demo
```

---

## Arquivos de configuração por ambiente

| Repo | Local | Staging | Produção |
|------|-------|---------|----------|
| spring-saas-core | `SPRING_PROFILES_ACTIVE=local` | `staging` | `prod` |
| node-b2b-orders | `NODE_ENV=development` | `staging` (ou `development`) | `production` |
| py-payments-ledger | `APP_ENV=development` | `staging` | `production` |
| fluxe-b2b-suite (frontends) | `config.json` com localhost | env vars com URLs staging | env vars com URLs prod |

---

## Referências

- **[config/env/README.md](../config/env/README.md)** — tabela única de portas/hosts (local vs Docker), como evitar troca de config
- [PIPELINE-ESTEIRAS.md](PIPELINE-ESTEIRAS.md) — branches, CI/CD, protocolos
- [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md) — passo a passo Railway
- [GUIA-OPERACIONAL.md](GUIA-OPERACIONAL.md) — subir local, smoke tests
- [REFERENCIA-CONFIGURACAO.md](REFERENCIA-CONFIGURACAO.md) — lista completa de variáveis por serviço
- `spring-saas-core/docs/SUBIR-E-TESTAR-TODOS-PROJETOS.md` — guia por projeto
