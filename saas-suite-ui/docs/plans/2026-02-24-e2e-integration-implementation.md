# Plano de Implementação: Integração E2E Fluxe B2B Suite

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrar os 4 repositórios (fluxe-b2b-suite, spring-saas-core, node-b2b-orders, py-payments-ledger) para funcionamento ponta a ponta com um único login (token do Spring) e fluxo ordem → pagamento via RabbitMQ.

**Architecture:** Frontend em dev obtém JWT do Spring `/v1/dev/token`; Node e Python validam o mesmo JWT (mesmo secret/issuer). Tenant `tenant_demo` alinhado em todos; RabbitMQ compartilhado para eventos orders/payments.

**Tech Stack:** Angular, Spring Boot, NestJS, FastAPI, RabbitMQ, PostgreSQL (por serviço), Redis (por serviço).

---

## Task 1: Frontend — Obter token do Core em modo dev quando configurado

**Files:**
- Modify: `fluxe-b2b-suite/saas-suite-ui/libs/shared/auth/src/lib/auth.service.ts`

**Step 1:** Em `loginWithDevToken`, quando `authMode === 'dev'`, tentar primeiro `POST coreApiBaseUrl/v1/dev/token` com o payload do perfil (sub, tid, roles, perms, plan, region). Usar `coreApiBaseUrl` do config; enviar body como `DevTokenRequest` (sub, tid, roles, perms, plan, region).

**Step 2:** Se a chamada for bem-sucedida, usar `resp.access_token`; se falhar (rede/erro), fazer fallback para `createLocalDevJwt(params)` e continuar (comportamento atual para demo sem backends).

**Step 3:** Garantir que não se envia `Authorization` nem `X-Tenant-Id` na requisição a `/v1/dev/token` (usar `SKIP_AUTH` e `SKIP_TENANT_HEADER` como já existe no branch `else`).

**Step 4:** Executar build do frontend e testes afetados (ex.: `pnpm nx run-many -t lint,test` em saas-suite-ui).

**Step 5:** Commit em fluxe-b2b-suite: `feat(auth): get dev token from core when coreApiBaseUrl is set`.

---

## Task 2: Frontend — Perfis Ops e Viewer com tid tenant_demo

**Files:**
- Modify: `fluxe-b2b-suite/saas-suite-ui/libs/shared/auth/src/lib/dev-auth/dev-login.component.ts`

**Step 1:** No array `DEV_PROFILES`, alterar o perfil "Ops User" para `tid: 'tenant_demo'` (em vez de `00000000-0000-0000-0000-000000000002`).

**Step 2:** Alterar o perfil "Viewer" para `tid: 'tenant_demo'`.

**Step 3:** Manter "Super Admin" com `tid: '00000000-0000-0000-0000-000000000001'` (ou verificar se Spring aceita `*` para admin; se não, manter UUID).

**Step 4:** Commit: `fix(auth): use tenant_demo for Ops/Viewer dev profiles for E2E`.

---

## Task 3: Spring — Adicionar tenant_demo ao seed

**Files:**
- Create or Modify: `spring-saas-core/src/main/resources/db/changelog/changes/004-tenant-demo-e2e.yaml` (novo changeset)

**Step 1:** Criar changeSet que insere um tenant com id `tenant_demo`, name "Demo Tenant (E2E)", plan "pro", region "us-east-1", status ACTIVE. Usar mesma estrutura dos inserts em `002-phase1-seed.yaml`.

**Step 2:** Incluir o novo arquivo em `db.changelog-master.yaml`.

**Step 3:** Rodar aplicação e verificar que o tenant aparece em `GET /v1/tenants`.

**Step 4:** Commit: `feat(seed): add tenant_demo for E2E integration`.

---

## Task 4: Node — Documentar e configurar JWT compartilhado para E2E

**Files:**
- Modify: `node-b2b-orders/README.md` (seção Variáveis de Ambiente ou nova seção "E2E com Fluxe B2B Suite")
- Create or Modify: `node-b2b-orders/.env.example` (se existir) com comentário para E2E

**Step 1:** Documentar que para integração E2E com a suite, usar o mesmo JWT que o Spring: `JWT_SECRET=<mesmo que JWT_HS256_SECRET do spring-saas-core>`, `JWT_ISSUER=spring-saas-core`. O frontend obtém token do Spring; a API orders apenas valida.

**Step 2:** Adicionar exemplo no README ou em `.env.example`: `# E2E: JWT_SECRET=local-dev-secret-min-32-chars-for-hs256-signing`, `# E2E: JWT_ISSUER=spring-saas-core`.

**Step 3:** Garantir que a estratégia JWT do Passport (jwt.strategy) não exige que o token tenha sido emitido pelo próprio AuthService; apenas valida assinatura e issuer. (Já é o caso: valida com secret e issuer.)

**Step 4:** Commit: `docs(env): JWT shared with spring-saas-core for E2E`.

---

## Task 5: Python — Documentar e configurar JWT compartilhado para E2E

**Files:**
- Modify: `py-payments-ledger/README.md` (seção Variáveis ou "E2E com Fluxe B2B Suite")
- Modify: `py-payments-ledger/.env.example`

**Step 1:** Documentar que para E2E: `JWT_SECRET` e `JWT_ISSUER` devem ser iguais ao Spring (`JWT_HS256_SECRET`, `JWT_ISSUER`).

**Step 2:** Em `.env.example`, adicionar comentários: `# E2E (same as spring-saas-core): JWT_SECRET=...`, `JWT_ISSUER=spring-saas-core`.

**Step 3:** Confirmar que `decode_token` em `application/security.py` usa `settings.jwt_secret` e `settings.jwt_issuer`; sem alteração de código se já estiver correto.

**Step 4:** Commit: `docs(env): JWT shared with spring-saas-core for E2E`.

---

## Task 6: Guia de execução E2E (README ou script)

**Files:**
- Create: `fluxe-b2b-suite/docs/E2E-RUN.md` (ou seção no README principal)

**Step 1:** Documentar ordem de subida: 1) RabbitMQ (uma instância, ex. 5672/15672); 2) spring-saas-core (8080); 3) node-b2b-orders (3000 + worker); 4) py-payments-ledger (8000 + worker), com `ORDERS_INTEGRATION_ENABLED=true` e mesmo RabbitMQ; 5) frontend (ops-portal ou shop).

**Step 2:** Listar variáveis críticas: Spring `JWT_HS256_SECRET`, `JWT_ISSUER`; Node e Py `JWT_SECRET`, `JWT_ISSUER` (valores iguais); Node/Py `RABBITMQ_URL` apontando para o mesmo broker; Py `ORDERS_INTEGRATION_ENABLED=true`.

**Step 3:** Passo a passo: login no frontend com perfil "Ops User" (tenant_demo), criar pedido, confirmar, aguardar PAID.

**Step 4:** Commit: `docs: add E2E run guide for integrated suite`.

---

## Task 7: Validação E2E manual e smoke

**Step 1:** Subir RabbitMQ (ex.: `docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3-management` ou um dos docker-compose com apenas RabbitMQ).

**Step 2:** Subir Spring com `JWT_HS256_SECRET=local-dev-secret-min-32-chars-for-hs256-signing`, `JWT_ISSUER=spring-saas-core`. Executar seed se necessário.

**Step 3:** Subir Node com mesmo `JWT_SECRET` e `JWT_ISSUER`, `RABBITMQ_URL` apontando para o broker. Migrate e seed.

**Step 4:** Subir Python com mesmo `JWT_SECRET` e `JWT_ISSUER`, `RABBITMQ_URL`, `ORDERS_INTEGRATION_ENABLED=true`. Migrate e seed.

**Step 5:** Subir frontend (ops-portal), config com URLs 8080, 3000, 8000. Login com Ops User → verificar que listagens de orders e payments funcionam.

**Step 6:** Criar pedido via UI ou API (Orders), confirmar, aguardar worker e verificar transição para PAID (e ledger em Payments).

**Step 7:** Se algo falhar, registrar no doc de troubleshooting (Task 6 ou README) e ajustar plano.

---

## Execução

Após salvar o plano, oferecer:

1. **Subagent-Driven (esta sessão)** — Uma subagent por task, revisão entre tasks.
2. **Sessão paralela** — Nova sessão com executing-plans para executar em lote com checkpoints.

Se escolher Subagent-Driven, usar **superpowers:subagent-driven-development**.
