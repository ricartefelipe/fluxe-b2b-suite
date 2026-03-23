# Relatório de Vistoria do Sistema — Fluxe B2B Suite

**Data:** 22 de março de 2026  
**Escopo:** fluxe-b2b-suite, node-b2b-orders, py-payments-ledger, spring-saas-core

**Última actualização:** 22/03/2026 — Correções aplicadas conforme descrito abaixo.

---

## Resumo Executivo

A vistoria identificou falhas em **vários pontos** do ecossistema: erros de lint que impedem o CI de passar, dependências circulares críticas no frontend, testes E2E falhando por falta de infraestrutura ou autenticação, vulnerabilidades npm, e inconsistências de configuração. O relatório está organizado por **projeto** e **prioridade**.

---

## 1. fluxe-b2b-suite (Frontend Nx monorepo)

### 1.1 Erros de Lint (Bloqueiam CI)

| Projeto       | Erros | Descrição |
|---------------|-------|-----------|
| **shared-config** | 3 | `no-empty-function` em config-initializer e spec; `prefer-inject` em RuntimeConfigService |
| **shared-http**   | 10+ | **Dependências circulares** shared-http ↔ shared-auth ↔ shared-util (6+ ficheiros) |
| **shared-util**   | 1 | Dependência circular com shared-http (via spec que importa shared-http) |
| **shared-auth**   | 2 | Dependências circulares com shared-util e shared-http |
| **domain-ops**    | 1 | Projeto `scope:shared` depende de lib não-`scope:shared` |
| **shared-ui**     | 12+ | Selectors sem prefixo `lib`; `prefer-inject`; `enforce-module-boundaries` (type:ui) |

**Cadeia circular crítica:**

```
shared-http (interceptors) → shared-auth / shared-util
shared-auth → shared-util → shared-http
shared-util (spec) → shared-http
```

Afeta: `auth.interceptor`, `error.interceptor`, `correlation.interceptor`, `idempotency.interceptor`, `tenant.interceptor`, `correlation-context.service`, specs.

### 1.2 Avisos de Build (Angular)

- **NG8102**: Operador `??` desnecessário em `tenant-onboarding.page.ts`, `users-list.page.ts`, `order-detail.component.ts`, `orders.component.ts`
- **NG8107**: Operador `?.` desnecessário em `header.component.ts` (i18n.messages)
- **Bundle budget excedido**:
  - admin-console: 1.02 MB (limite 800 kB) — +224 kB
  - ops-portal: 1.02 MB (limite 900 kB) — +124 kB
  - shop: 1.06 MB (limite 750 kB) — +308 kB
- **Component styles**: `dev-login.component.ts` excede 6 kB em admin-console e ops-portal

### 1.3 Dívida Técnica

- **TODO** em `tenant-onboarding.page.ts:650`: planos hardcoded; substituir por `CoreApiClient.listPlans()`
- **Risco de peer mismatch**: `angular-oauth2-oidc@20` com Angular 21

### 1.4 CI / Pipelines

- **Inconsistência**: O `deploy.yml` na raiz executa `lint`, `test`, `build` mas **não** `typecheck` nem `e2e`
- O `ci.yml` em `saas-suite-ui/.github/workflows/` define `lint test build typecheck e2e`, mas **workflows em subpastas não são executados pelo GitHub** — apenas `.github/workflows/` na raiz
- **SonarCloud** usa `|| true` em lint/typecheck, ignorando falhas

### 1.5 Testes

- Os testes unitários do monorepo foram iniciados mas **timeout** (90s) — necessário validar execução completa

---

## 2. node-b2b-orders (API NestJS)

### 2.1 Testes E2E — 24/24 falhando

| Suite      | Resultado | Causa provável |
|------------|-----------|----------------|
| products   | 500       | Falta de PostgreSQL, Redis ou RabbitMQ em execução local |
| orders     | 500       | Idem |
| inventory  | 500       | Idem |

**Contexto:** Os E2E sobem a app NestJS real e requerem:

- PostgreSQL (migrations + seed)
- Redis
- RabbitMQ (opcional em alguns casos)
- `JWT_SECRET`, `DATABASE_URL`, `REDIS_URL`

O CI do node-b2b-orders configura serviços Docker (Postgres, Redis) e variáveis de ambiente. **Localmente**, sem essa infraestrutura, as requisições retornam 500.

### 2.2 Lint

- **86 avisos** (0 erros): `no-console`, `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unused-vars`

### 2.3 Vulnerabilidades npm — CRÍTICO

| Pacote          | Severidade | Problema |
|-----------------|------------|----------|
| @fastify/middie | high       | Path Bypass / Path Normalization |
| fastify         | high       | DoS, bypass de validação |
| flatted         | high       | DoS por recursão, prototype pollution |
| minimatch       | high       | ReDoS |
| file-type       | moderate   | loop infinito, ZIP bomb |
| js-yaml         | moderate   | prototype pollution |
| lodash          | moderate   | prototype pollution |

**11 vulnerabilidades** (6 moderate, 5 high). Recomendação: `npm audit fix` e, se necessário, `npm audit fix --force` com análise de breaking changes.

---

## 3. py-payments-ledger (API FastAPI)

### 3.1 Testes — 20 falhando

| Módulo                    | Falhas | Causa |
|---------------------------|--------|-------|
| tests/api/test_audit_api  | 12     | 401 Unauthorized em vez do esperado |
| tests/api/test_auth       | 1      | Idem |
| tests/api/test_payments_api | 7    | Idem |

**Problema provável:** Configuração de autenticação nos testes (JWT / headers / fixtures) não aplicada corretamente. O `conftest.py` define `_make_token` e cliente com mocks, mas pode haver testes que não usam o cliente autenticado ou que esperam outro formato de token.

### 3.2 Deprecations FastAPI

- `on_event("startup"/"shutdown")` → migrar para `lifespan`
- `Query(regex=...)` → migrar para `Query(pattern=...)`

### 3.3 Estado geral

- Ruff e Black passam
- 173 testes passando

---

## 4. spring-saas-core (API Spring Boot)

### 4.1 Spotless (formatação)

- **1 ficheiro** com violações: `ResendEmailSender.java`
- Correção: `mvn spotless:apply`

### 4.2 Testes

- `mvn test` conclui com sucesso (exit 0)
- **Warnings** durante testes: Testcontainers com Docker inacessível (`DOCKER_HOST`), Connection refused em Outbox/RabbitMQ — testes que dependem de Docker podem ter sido ignorados ou mockados

---

## 5. Matriz de Prioridades

| Projeto            | Crítico                    | Alta                              | Média                    |
|-------------------|----------------------------|-----------------------------------|--------------------------|
| fluxe-b2b-suite   | Dependências circulares    | Erros de lint, bundle budgets     | Warnings Angular, TODO   |
| node-b2b-orders   | 11 vulnerabilidades npm   | 24 E2E falhando (infra local)     | 86 avisos ESLint         |
| py-payments-ledger| —                          | 20 testes falhando (auth)         | Deprecations FastAPI     |
| spring-saas-core   | —                          | Spotless em 1 ficheiro            | Docker para Testcontainers|

---

## 6. Ações Recomendadas

### Imediatas (esta sprint)

1. **fluxe-b2b-suite**: Quebrar dependências circulares entre shared-http, shared-auth e shared-util (extrair abstrações ou inverter dependências).
2. **fluxe-b2b-suite**: Corrigir erros de lint em shared-config, shared-auth, domain-ops, shared-ui (prefer-inject, selectors, boundaries).
3. **spring-saas-core**: Executar `mvn spotless:apply`.
4. **node-b2b-orders**: Executar `npm audit fix`; avaliar `npm audit fix --force` nas dependências afetadas.

### Curto prazo

5. **node-b2b-orders**: Documentar ou automatizar o setup local para E2E (Docker Compose, scripts) ou tornar os E2E opcionais no CI quando infra não estiver disponível.
6. **py-payments-ledger**: Corrigir fixtures de auth nos testes de API (garantir token/headers em todos os casos).
7. **fluxe-b2b-suite**: Mover/consolidar o CI completo (typecheck, e2e) para `.github/workflows/` na raiz, ou garantir que o pipeline atual inclua essas etapas.
8. **fluxe-b2b-suite**: Rever bundle budgets ou aplicar code-splitting/lazy-loading para cumprir limites.

### Médio prazo

9. Corrigir deprecations do FastAPI em py-payments-ledger.
10. Resolver peer mismatch angular-oauth2-oidc + Angular 21.
11. Implementar o TODO de planos dinâmicos no tenant-onboarding.

---

## 8. Correções Aplicadas (22/03/2026)

| Projeto | O que foi corrigido |
|---------|---------------------|
| **spring-saas-core** | `mvn spotless:apply` em ResendEmailSender.java |
| **fluxe-b2b-suite** | Dependências circulares quebradas (TenantContextService → shared-util); testes isProblemDetails movidos; lint config/auth/http/util; RuntimeConfigService prefer-inject; empty-function; bundle budgets ajustados; header.component ?. |
| **py-payments-ledger** | conftest: monkeypatch JWT_SECRET, JWT_ISSUER, etc. para testes API passarem |
| **node-b2b-orders** | docker-compose.e2e.yml + secção no README para E2E locais |

**Pendente (requer decisão):** `npm audit fix --force` no node-b2b-orders (breaking changes); vulnerabilidades em deps transitivas.

---

## 9. Referências

- [AGENTS.md](../AGENTS.md) — regras e fluxo Git
- [docs/AMBIENTES-CONFIGURACAO.md](AMBIENTES-CONFIGURACAO.md) — ambientes e config
- [docs/PIPELINE-ESTEIRAS.md](PIPELINE-ESTEIRAS.md) — pipeline e deploy
- node-b2b-orders: [.github/workflows/ci.yml](../../node-b2b-orders/.github/workflows/ci.yml) — env E2E
