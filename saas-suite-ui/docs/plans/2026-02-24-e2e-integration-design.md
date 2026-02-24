# Design: Integração Ponta a Ponta (E2E) — Fluxe B2B Suite

**Data:** 2026-02-24  
**Objetivo:** Integrar os 4 repositórios do workspace e fazê-los funcionar ponta a ponta (frontend + 3 backends + eventos), com um único fluxo de autenticação e ordem → pagamento.

---

## 1. Contexto dos 4 Códigos

| Repositório           | Função                          | Porta | Stack                    |
|-----------------------|----------------------------------|-------|--------------------------|
| **fluxe-b2b-suite**  | Frontend (Shop, Ops Portal, Admin) | 4200  | Angular/Nx, API Express 3333 |
| **spring-saas-core** | Governança (tenants, policies, flags, audit, dev token) | 8080 | Java 21, Spring Boot |
| **node-b2b-orders**  | Pedidos e inventário, worker outbox | 3000 | NestJS, Prisma, RabbitMQ |
| **py-payments-ledger** | Pagamentos e ledger, consumer de eventos | 8000 | FastAPI, SQLAlchemy, RabbitMQ |

**Fluxo de negócio já contratado (eventos):**
- Orders API → outbox → Worker publica `payment.charge_requested` em `payments.x`
- py-payments-ledger consome, processa e publica `payment.settled`
- Worker do orders consome `payment.settled` e marca pedido como PAID

---

## 2. Problemas Atuais para E2E

1. **Autenticação fragmentada**
   - Em `authMode: 'dev'` o frontend gera JWT local (alg: none, assinatura `.dev`), não aceito por Node/Python.
   - Spring expõe `/v1/dev/token` (HS256); Node e Python têm seus próprios `/v1/auth/token` e usuários em DB.
   - Para um único login no frontend, precisamos de **um token aceito pelos três backends**.

2. **Tenant IDs inconsistentes**
   - Frontend (dev profiles): `tid` = UUIDs (`00000000-0000-0000-0000-000000000002`, etc.).
   - Node e Python seeds: `tenant_demo`.
   - Spring seed: apenas UUIDs. Para Orders/Payments o header `X-Tenant-Id` deve ser um tenant existente (ex.: `tenant_demo`).

3. **Infraestrutura e portas**
   - Cada backend tem seu próprio `docker-compose` (Postgres, Redis, RabbitMQ). Portas host diferentes (ex.: node-b2b-orders usa 5433, 6380, 5673/15673; py/spring usam 5432, 6379, 5672/15672).
   - Para E2E integrado, **RabbitMQ deve ser compartilhado** (mesmo broker, exchanges `orders.x` e `payments.x`) para os workers de orders e payments se comunicarem.

4. **JWT compartilhado**
   - Spring emite token com `JWT_HS256_SECRET` e `JWT_ISSUER`.
   - Node e Python validam com `JWT_SECRET` e `JWT_ISSUER`. Para aceitar o token do Spring, **mesmo secret e mesmo issuer** nos três.

---

## 3. Abordagens Consideradas

| Abordagem | Prós | Contras |
|-----------|------|--------|
| **A) Frontend em dev chama Spring /v1/dev/token** | Um único token; Node/Py só validam (mesmo secret/issuer). | Exige Spring no ar para login dev; alinhar secrets e tenants. |
| **B) Manter JWT local no frontend e aceitar “alg: none” em Node/Py** | Nenhuma dependência do Spring para login. | Inseguro; não recomendado. |
| **C) BFF único que emite token** | Centraliza identidade. | Novo serviço; mais complexidade. |

**Recomendação:** **A**. Frontend em dev obtém token do Spring; Node e Python configurados com o mesmo `JWT_SECRET` e `JWT_ISSUER` apenas validam o token. Documentar variáveis de ambiente para “modo integrado”.

---

## 4. Design da Solução

### 4.1 Autenticação unificada (dev integrado)

- **Frontend (authMode: 'dev'):**
  - Se `coreApiBaseUrl` estiver definido: chamar `POST coreApiBaseUrl/v1/dev/token` com o payload do perfil selecionado (sub, tid, roles, perms, plan, region).
  - Se a chamada falhar (ex.: core indisponível): fallback para o JWT local atual (createLocalDevJwt), permitindo demo só de UI.
  - Payload enviado ao Spring deve usar `tid` compatível com os três backends (ver 4.2).

- **Spring:** Mantém `/v1/dev/token` com `JWT_HS256_SECRET` e `JWT_ISSUER` (ex.: `spring-saas-core`). Em produção não usar dev token.

- **Node e Python:** Não emitem token em “modo integrado”; apenas validam JWT com:
  - `JWT_SECRET` = mesmo valor que `JWT_HS256_SECRET` do Spring.
  - `JWT_ISSUER` = mesmo valor que Spring (ex.: `spring-saas-core`).
  - Documentar em cada repo: “Para E2E com suite, use JWT_SECRET e JWT_ISSUER iguais ao spring-saas-core”.

### 4.2 Tenant alinhado para E2E

- **Perfis de dev no frontend (Ops User e Viewer):** usar `tid: 'tenant_demo'` para que Orders e Payments reconheçam o tenant (já existente nos seeds de Node e Python).
- **Spring:** Incluir tenant com id `tenant_demo` no seed (Liquibase), para que Admin Console e políticas possam referenciar o mesmo tenant quando necessário.
- **Super Admin:** Pode manter `tid` como UUID (ex.: `00000000-0000-0000-0000-000000000001`) ou `*` se Spring aceitar; para chamadas a Orders/Payments com perfil admin, o frontend pode enviar `X-Tenant-Id: tenant_demo` quando for exibir dados de pedidos/pagamentos.

### 4.3 Infraestrutura compartilhada (desenvolvimento local)

- **Opção recomendada para E2E:** Um único RabbitMQ na máquina (ex.: porta 5672 e 15672). Todos os backends apontam para o mesmo broker.
  - node-b2b-orders: `RABBITMQ_URL=amqp://guest:guest@localhost:5672` (ou hostname do compose).
  - py-payments-ledger: `RABBITMQ_URL=amqp://guest:guest@localhost:5672`, `ORDERS_INTEGRATION_ENABLED=true`.
  - Exchanges/filas já definidos nos contratos (`orders.x`, `payments.x`, fila `orders.payments`).
- Postgres e Redis podem permanecer por serviço (portas diferentes por compose) para evitar conflito de schemas e dados. Alternativa futura: um único docker-compose “suite” com um RabbitMQ e três Postgres (um por serviço).

### 4.4 Ordem de subida e smoke E2E

1. Subir RabbitMQ (compartilhado).
2. Subir Spring → health e `/v1/dev/token` ok.
3. Subir Node (orders + worker) → health e seed.
4. Subir Python (payments + worker) → health, seed, `ORDERS_INTEGRATION_ENABLED=true`.
5. Subir frontend (ops-portal ou shop), config com `coreApiBaseUrl`, `ordersApiBaseUrl`, `paymentsApiBaseUrl`.
6. Login no frontend com perfil Ops (tid `tenant_demo`) → token do Spring.
7. Criar pedido no Ops/Shop → confirmar → aguardar worker orders → payment.charge_requested → py-payments processa → payment.settled → orders marca PAID.

### 4.5 Tratamento de erros e limites

- Frontend: se `POST coreApiBaseUrl/v1/dev/token` falhar (rede/timeout), exibir mensagem clara e usar fallback para JWT local (demo sem backends).
- Backends: 401 se token inválido/expirado; 403 se tenant mismatch ou permissão. Manter comportamento atual.
- Eventos: DLQ e retries já existentes nos workers; documentar no guia de troubleshooting.

---

## 5. Critérios de Sucesso

- Um único login no frontend (perfil Ops com tid `tenant_demo`) obtém token do Spring e permite:
  - Listar/criar pedidos (node-b2b-orders).
  - Listar pagamentos e ledger (py-payments-ledger).
  - Listar tenants, policies, flags e audit (spring-saas-core).
- Fluxo completo: criar pedido → reservar → confirmar → payment.charge_requested → payment.settled → pedido PAID, sem intervenção manual além da confirmação no UI/API.

---

## 6. Documentação posterior (após sucesso E2E)

Conforme combinado, após a integração funcionando:
- **DAS** (se aplicável ao projeto)
- **C4** (já existente em py-payments-ledger; estender para a suite)
- **Documento de negócio** e **histórias de usuário**
- **Documento de implantação** (ordem de deploy, variáveis, dependências)

---

## 7. Aprovação

Após validação deste design, o próximo passo é o **plano de implementação** (tasks por repositório e ordem de execução).
