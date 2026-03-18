# Pipeline e Esteiras — Fluxe B2B Suite

Este documento define pipelines, esteiras e **protocolos obrigatórios** de desenvolvimento (Git Flow, qualidade de código, testes, CI/CD e documentação).

---

## Protocolos de desenvolvimento

### 1. Git Flow

| Regra | Descrição |
|-------|-----------|
| **Branches** | `master` (produção), `develop` (staging), `feature/*`, `fix/*`, `docs/*` |
| **Criação** | `feature/nome-descritivo` ou `fix/nome-descritivo` a partir de `develop` |
| **Merge em develop** | Sempre via PR; usar `--no-ff` quando possível para rastreabilidade |
| **Merge em master** | Apenas após validação em staging; via PR; gerar release/tag se relevante |
| **Proibido** | Push direto em `master` sem PR; merge sem CI verde; incluir "Made-with: Cursor" (ou similar) em mensagens de commit |
| **Fluxo por feature** | Criar branch `feature/nome` a partir de `develop` → trabalhar → merge em `develop` (PR ou merge local) → apagar a branch `feature/nome` → quando for release, merge `develop` em `master` |

### 2. Qualidade de código

| Repo | Ferramentas | Obrigatório antes do merge |
|------|-------------|---------------------------|
| fluxe-b2b-suite | ESLint, Nx lint, Playwright | `lint`, `test`, `build` |
| spring-saas-core | Spotless, Maven | `spotless:check`, `mvn test` |
| node-b2b-orders | ESLint, Prisma | `lint`, `test`, `build` |
| py-payments-ledger | Ruff, Black, Mypy | `ruff check`, `black --check`, `mypy`, `pytest` |

**Qodana (spring-saas-core):** análise estática em PRs e push em master/develop.

### 3. Testes

| Tipo | Quando rodar | Responsabilidade |
|------|--------------|------------------|
| Unitários | CI em todo push/PR | Cobertura de regras de negócio e edge cases |
| E2E | CI (node-b2b-orders: `test:e2e`) | Fluxos críticos |
| Trivy | CI (node, py) | Scan CRITICAL/HIGH |
| Build | build-push.yml | Testes antes de gerar imagem Docker |

### 4. CI/CD — portas obrigatórias

- **develop:** CI deve passar antes de merge em develop; build-push gera imagem `:develop`
- **master:** CI deve passar antes de merge em master; build-push gera imagem `:master`/`:latest`
- **Deploy:** Não fazer deploy manual de branch que não passou em CI

### 5. Documentação

| Situação | Ação |
|----------|------|
| Novo endpoint ou alteração de contrato | Atualizar `docs/contracts/`, OpenAPI, `CATALOGO-API.md` |
| Nova variável de ambiente | Atualizar `REFERENCIA-CONFIGURACAO.md` |
| Novo evento RabbitMQ | Atualizar `CATALOGO-EVENTOS.md`, `docs/contracts/events.md` |
| Alteração de fluxo operacional | Atualizar `MANUAL-SISTEMA.md`, `GUIA-OPERACIONAL.md` |
| Alteração de pipeline/esteira | Atualizar este doc (`PIPELINE-ESTEIRAS.md`) |
| Novo serviço ou breaking change | Atualizar `GUIA-DO-SISTEMA.md`, diagramas |

---

## Estratégia de branches

| Branch   | Ambiente   | Deploy automático                        |
|----------|------------|------------------------------------------|
| **develop** | Staging   | Railway (staging) + Cloudflare preview  |
| **master**  | Production| Railway (production) + Cloudflare prod  |

**Staging — dados para testes:** após o deploy em `develop`, rode `./scripts/staging-seed.sh railway` no repo fluxe-b2b-suite (Railway CLI e backends linkados ao projeto Staging). Em **produção** não rodar seed (apenas migrations essenciais). Detalhes: [AMBIENTES-CONFIGURACAO.md](AMBIENTES-CONFIGURACAO.md#alimentar-staging-com-dados-após-primeiro-deploy).

**Hook de commit:** para evitar que "Made-with: Cursor" entre em commits, instale o hook: `cp scripts/git-hooks/prepare-commit-msg .git/hooks/prepare-commit-msg && chmod +x .git/hooks/prepare-commit-msg`. Repita nos demais repositórios (spring-saas-core, node-b2b-orders, py-payments-ledger) se desejar o mesmo comportamento.

---

## Repositórios e workflows

### 1. fluxe-b2b-suite (frontend monorepo)

| Workflow           | Disparo              | Ação                                            |
|--------------------|-----------------------|-------------------------------------------------|
| deploy.yml         | push develop/master  | CI: lint, test, build das 3 apps                 |
| deploy-frontend.yml| push develop/master  | deploy-frontend: test → build → Cloudflare      |
| deploy-prod.yml    | push master (paths)   | Deploy VPS via SSH (docker-compose.prod)       |

**Railway:** 3 serviços (shop, ops-portal, admin-console) conectados ao repo.  
Cada um com branch configurada no dashboard:
- Staging: Production Branch = `develop`
- Production: Production Branch = `master`

---

### 2. spring-saas-core

| Workflow     | Disparo            | Ação                          |
|--------------|--------------------|-------------------------------|
| ci.yml       | push develop/master| Build + Spotless + OpenAPI    |
| build-push.yml| push develop/master| Test → build image → push GHCR|

**Railway:** 1 serviço. Branch no dashboard:
- Staging: `develop`
- Production: `master`

**Imagens GHCR:**  
`ghcr.io/ricartefelipe/spring-saas-core:develop` | `:master` | `:latest` (só em master)

---

### 3. node-b2b-orders

| Workflow     | Disparo            | Ação                          |
|--------------|--------------------|-------------------------------|
| ci.yml       | push develop/master| Lint, test, build, Trivy      |
| build-push.yml| push develop/master| Build api+worker → push GHCR  |

**Railway:** 2 serviços (api, worker). Branch no dashboard conforme ambiente.

**Imagens GHCR:**  
`ghcr.io/ricartefelipe/node-b2b-orders:develop` | `:master` | `:latest`

---

### 4. py-payments-ledger

| Workflow     | Disparo            | Ação                          |
|--------------|--------------------|-------------------------------|
| ci.yml       | push develop/master| Lint, test, build, Trivy      |
| build-push.yml| push develop/master| Build api+worker → push GHCR  |

**Railway:** 2 serviços (api, worker). Branch no dashboard conforme ambiente.

**Imagens GHCR:**  
`ghcr.io/ricartefelipe/py-payments-ledger:develop` | `:master` | `:latest`

---

## Configuração no Railway

### Staging (develop)

1. Projeto Railway "Fluxe B2B Suite - Staging" (ou ambiente staging)
2. Para cada serviço: **Settings** → **Source** → **Production Branch** = `develop`
3. Push em `develop` dispara deploy automático

### Production (master)

1. Projeto Railway "Fluxe B2B Suite - Production" (ou ambiente production)
2. Para cada serviço: **Settings** → **Source** → **Production Branch** = `master`
3. Push em `master` dispara deploy automático

**Ou:** um único projeto com 2 ambientes, cada ambiente com seus serviços apontando para a branch correta.

---

## Fluxo Git

```
feature/* → develop (merge) → master (merge, quando pronto)
    │              │                    │
    └── CI + build-push (develop)       └── CI + build-push + deploy-prod (master)
    └── Railway staging deploy          └── Railway production deploy
```

---

## Fluxo prático (como trabalhamos hoje)

Esta é a forma adotada no dia a dia:

| Passo | Ação |
|-------|------|
| 1 | Criar `feature/nome` ou `fix/nome` a partir de `develop` |
| 2 | Desenvolver, commitar |
| 3 | `git checkout develop` → `git merge feature/nome --no-ff` |
| 4 | `git push origin develop` |
| 5 | CI, build-push e deploy em staging rodam automaticamente |
| 6 | Quando validado em staging: merge `develop` → `master`, push |

**Produção:** merge manual de develop em master quando pronto; sem branch de release nem tags por enquanto.

**Evolução futura (quando fizer sentido):**
- **Tags:** criar `v1.0.0` ao promover para master — facilita rollback e changelog
- **Branch release:** considerar se surgir QA prolongado ou time maior

---

## URLs esperadas (após configurar Railway)

| Serviço    | Staging (develop)                 | Production (master)                |
|-----------|------------------------------------|-------------------------------------|
| Shop      | shop-frontend-staging.up.railway.app   | shop-frontend.up.railway.app (ou custom) |
| Ops Portal| ops-portal-staging.up.railway.app      | ops-portal.up.railway.app          |
| Admin     | admin-console-staging.up.railway.app   | admin-console.up.railway.app       |
| Core API  | spring-saas-core-staging.up.railway.app| spring-saas-core.up.railway.app    |
| Orders API| node-b2b-orders-staging.up.railway.app | node-b2b-orders.up.railway.app    |
| Payments  | py-payments-ledger-staging.up.railway.app| py-payments-ledger.up.railway.app|

---

## Checklist de setup inicial

- [x] Branch padrão dos 4 repos = `master`
- [x] Workflows GitHub com `develop` e `master` (não `main`)
- [ ] Railway: 2 projetos ou 2 ambientes (staging / production)
- [ ] Cada serviço Railway com Production Branch correto (develop ou master)
- [ ] Variáveis de ambiente por ambiente (JWT_SECRET, DB, etc.)
- [ ] CORS_ORIGINS com URLs dos frontends de cada ambiente

---

## Estado atual (atualizado)

**Workflows ajustados para `master` e `develop`:**

| Repo | Arquivos alterados |
|------|--------------------|
| fluxe-b2b-suite | deploy-frontend.yml, deploy-prod.yml, deploy.yml, saas-suite-ui/ci.yml |
| spring-saas-core | ci.yml, build-push.yml, deploy.yml (comentário), qodana_code_quality.yml |
| node-b2b-orders | ci.yml, build-push.yml |
| py-payments-ledger | ci.yml, build-push.yml |

**Próximo passo:** configurar Railway e testar push em `develop` e `master`.

---

## Status staging (última verificação)

| Repo | CI | Build & Push | Deploy Frontend |
|------|----|--------------|------------------|
| fluxe-b2b-suite | ✅ | — | ✅ (Cloudflare preview) |
| spring-saas-core | ✅ | ✅ | — |
| node-b2b-orders | ✅ | ✅ | — |
| py-payments-ledger | ✅ | ✅ | — |

**Imagens GHCR** (tag `:develop`): disponíveis para Railway staging.
