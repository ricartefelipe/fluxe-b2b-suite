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

### Variáveis
- `.env` nos projetos (copiado de `.env.example` se não existir)
- **spring-saas-core:** Liquibase contexts vêm do profile (application-local.yml); override via `SPRING_LIQUIBASE_CONTEXTS` se necessário
- JWT_SECRET igual em todos os backends
- Portas: 8080 (core), 3000 (orders), 8000 (payments), 4200/4300/4400 (frontends)

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

### Migrations e seed (após primeiro deploy)
```bash
# spring-saas-core: Liquibase roda no startup (contexts: staging,seed)

# node-b2b-orders
railway run npx prisma migrate deploy
railway run npx prisma db seed

# py-payments-ledger
railway run alembic upgrade head
railway run python -m src.infrastructure.db.seed
```

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

- [PIPELINE-ESTEIRAS.md](PIPELINE-ESTEIRAS.md) — branches, CI/CD, protocolos
- [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md) — passo a passo Railway
- [GUIA-OPERACIONAL.md](GUIA-OPERACIONAL.md) — subir local, smoke tests
- `spring-saas-core/docs/SUBIR-E-TESTAR-TODOS-PROJETOS.md` — guia por projeto
