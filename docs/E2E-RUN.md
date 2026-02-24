# Guia de execução E2E — Fluxe B2B Suite

Como subir os 4 repositórios integrados (frontend + spring-saas-core + node-b2b-orders + py-payments-ledger) e validar o fluxo ordem → pagamento ponta a ponta.

---

## Pré-requisitos

- Docker e Docker Compose
- Node.js 20+, Java 21, Python 3.12+ (conforme cada repo)
- Clones no mesmo nível: `fluxe-b2b-suite`, `spring-saas-core`, `node-b2b-orders`, `py-payments-ledger` (ex.: `wks/fluxe-b2b-suite`, `wks/node-b2b-orders`, …)

**Um comando (recomendado):** Do repositório fluxe-b2b-suite, rode `./scripts/up-all.sh`. Ele cria a rede `fluxe_shared`, sobe o Spring (com RabbitMQ compartilhado), depois Node e Python com `RABBITMQ_URL` apontando para o mesmo broker (fluxo pedido → PAID funciona). Migrate/seed são executados; em seguida inicia o frontend. Acesse http://localhost:4200 e faça login com **Ops User**.

**Só frontend (backends já no ar):** `./scripts/serve-frontend.sh`.

**Smoke com suite já no ar:** `./scripts/smoke-suite.sh` — verifica health dos 3 backends.

**Smokes por repo (cada um com seu próprio stack):** `./scripts/e2e-integrated.sh`.

---

## Variáveis críticas (JWT compartilhado)

Para um único login no frontend ser aceito pelos 3 backends, use **o mesmo secret e issuer** em todos:

| Serviço              | Variável (Spring)     | Variável (Node/Py) | Valor exemplo (só dev) |
|----------------------|------------------------|--------------------|-------------------------|
| spring-saas-core     | `JWT_HS256_SECRET`     | —                  | `local-dev-secret-min-32-chars-for-hs256-signing` |
| spring-saas-core     | `JWT_ISSUER`           | —                  | `spring-saas-core` |
| node-b2b-orders      | —                      | `JWT_SECRET`       | (mesmo que acima) |
| node-b2b-orders      | —                      | `JWT_ISSUER`       | `spring-saas-core` |
| py-payments-ledger   | —                      | `JWT_SECRET`       | (mesmo que acima) |
| py-payments-ledger   | —                      | `JWT_ISSUER`       | `spring-saas-core` |

**RabbitMQ:** Node e Python devem apontar para o **mesmo** broker. No `./scripts/up-all.sh` isso é feito automaticamente: rede Docker `fluxe_shared`, RabbitMQ do Spring com nome `fluxe-rabbitmq`, e `RABBITMQ_URL=amqp://guest:guest@fluxe-rabbitmq:5672` para Node e Python.

**Tenant:** O Spring emite o token com o `tid` enviado no body (ex.: `tenant_demo`); não precisa existir na tabela de tenants do Core. O tenant `tenant_demo` existe nos seeds de node-b2b-orders e py-payments-ledger.

**Python:** `ORDERS_INTEGRATION_ENABLED=true` para consumir `payment.charge_requested`.

---

## Ordem de subida (local)

1. **RabbitMQ** (uma instância só)  
   Ex.: `docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management`  
   Ou subir apenas o serviço RabbitMQ de um dos docker-compose (node ou py) e usar as portas 5672/15672.

2. **spring-saas-core** (porta 8080)  
   - Subir Postgres/Redis/RabbitMQ do próprio compose ou usar os já existentes.  
   - `JWT_HS256_SECRET` e `JWT_ISSUER` como na tabela.  
   - Rodar app, executar seed se necessário.  
   - Verificar: `GET http://localhost:8080/actuator/health` e `POST http://localhost:8080/v1/dev/token` com body `{"sub":"ops@saas.local","tid":"tenant_demo","roles":["ops"],"perms":["orders:read","orders:write"],"plan":"pro","region":"us-east-1"}`.

3. **node-b2b-orders** (porta 3000 + worker)  
   - Mesmo `JWT_SECRET` e `JWT_ISSUER`, `RABBITMQ_URL` para o broker acima.  
   - Migrate + seed.  
   - Verificar: `GET http://localhost:3000/v1/healthz`.

4. **py-payments-ledger** (porta 8000 + worker)  
   - Mesmo `JWT_SECRET` e `JWT_ISSUER`, mesmo `RABBITMQ_URL`, `ORDERS_INTEGRATION_ENABLED=true`.  
   - Migrate + seed.  
   - Verificar: `GET http://localhost:8000/healthz`.

5. **Frontend (fluxe-b2b-suite)**  
   - Em `saas-suite-ui`, config (ex.: `apps/ops-portal/public/assets/config.json`):  
     `coreApiBaseUrl: "http://localhost:8080"`, `ordersApiBaseUrl: "http://localhost:3000"`, `paymentsApiBaseUrl: "http://localhost:8000"`, `authMode: "dev"`.  
   - `pnpm nx serve ops-portal` (ou admin-console / shop).  
   - Acessar http://localhost:4200, login com perfil **Ops User** (tid `tenant_demo`).

---

## Validação do fluxo

1. No Ops Portal, criar um pedido (ou usar API `POST /v1/orders` com token obtido do Core).  
2. Confirmar o pedido.  
3. Aguardar alguns segundos: worker orders publica `payment.charge_requested`, py-payments-ledger processa e publica `payment.settled`, worker orders marca pedido como **PAID**.  
4. Verificar na UI que o pedido está PAID e que há entradas no ledger (Payments).

---

## Troubleshooting

- **"Docker inacessível" / permission denied:** Rode `docker info`. Se der erro de permissão: `sudo usermod -aG docker $USER`, depois faça logout/login (ou `newgrp docker` na mesma sessão). Em seguida rode `./scripts/up-all.sh` de novo.
- **Porta em uso (Address already in use):** Cada backend usa portas diferentes (Spring: 5432, 6379, 5672, 8080, Grafana 3030; Node: 5433, 6380, 5673, 3000; Python: 5434, 6381, 5674, 8000). A API Node usa 3000; o Grafana do Spring usa 3030. Se alguma porta estiver ocupada, pare o processo ou edite o `docker-compose.yml` do repo correspondente.
- **401 ao chamar Orders ou Payments:** Token não está sendo aceito. Confirme `JWT_SECRET` e `JWT_ISSUER` iguais nos 3 backends; o `up-all.sh` ajusta isso nos `.env` de Node e Python. Use perfil **Ops User** (tid `tenant_demo`) no login.  
- **403 tenant mismatch:** Header `X-Tenant-Id` deve ser `tenant_demo`; o frontend envia o `tid` da sessão.  
- **Pedido não vai para PAID:** Verifique se o RabbitMQ é o mesmo para Node e Python, se `ORDERS_INTEGRATION_ENABLED=true` no Python e se as filas/exchanges estão criadas (ex.: RabbitMQ Management UI em 15672).
- **Logs de um backend:** `cd <caminho-do-repo> && docker compose logs -f`

---

# Hospedagem na nuvem (sugestão)

Para colocar a suite **na cloud** com custo controlado e pouca operação, algumas opções:

## Opção 1 — **Railway** (recomendada para começar)

- **Por quê:** Deploy de vários serviços (Nx/Node, Java, Python) + Postgres, Redis e RabbitMQ em um único lugar; billing por uso; suporte a Dockerfile e buildpacks.
- **Como:** Um projeto Railway por “ambiente”; um service por app (frontend estático ou SSR, spring-saas-core, node-b2b-orders API + worker, py-payments-ledger API + worker). Usar **Railway Postgres**, **Redis** e um add-on **CloudAMQP** (RabbitMQ gerido) ou rodar RabbitMQ como mais um container.
- **Variáveis:** Definir as mesmas envs do guia E2E (JWT compartilhado, URLs internas entre serviços). Frontend: `coreApiBaseUrl`, `ordersApiBaseUrl`, `paymentsApiBaseUrl` apontando para as URLs públicas ou internas dos backends.
- **Custo:** Free tier limitado; depois ~US$ 5–20/mês para dev/staging com poucos recursos.

## Opção 2 — **Render**

- **Por quê:** Suporta Web Services (Java, Node, Python), Postgres e Redis geridos. Fácil de conectar repositórios GitHub.
- **Limitação:** Não há RabbitMQ gerido; é preciso usar um add-on externo (ex.: CloudAMQP) ou um **Background Worker** na Render rodando RabbitMQ em container (menos ideal para produção).
- **Como:** Um Web Service por API (Spring, Node, Python); Workers para os processos assíncronos (node worker, py worker); Frontend como Static Site ou Web Service. JWT e URLs como no guia E2E.

## Opção 3 — **AWS (ECS + RDS + ElastiCache + Amazon MQ)**

- **Por quê:** Controle total, RabbitMQ gerido (Amazon MQ) e alta disponibilidade. Melhor quando a suite for crítica e com mais tráfego.
- **Como:** ECS Fargate (ou EKS) para os 4 serviços + workers; RDS PostgreSQL (uma instância ou um DB por serviço); ElastiCache Redis; Amazon MQ for RabbitMQ. API Gateway ou ALB na frente; frontend em S3 + CloudFront ou em container.
- **Custo:** Maior (dezenas a centenas de dólares/mês conforme tamanho). Use **AWS Copilot** ou **Terraform** para automatizar.

## Opção 4 — **Fly.io**

- **Por quê:** Containers globais, preço por máquina pequena, bom para APIs e workers.
- **Como:** Um app Fly por serviço (Spring, Node API, Node worker, Python API, Python worker, frontend). Postgres e Redis via **Fly Postgres** e **Upstash** (ou Redis na Fly). RabbitMQ: imagem oficial na Fly ou CloudAMQP.
- **Custo:** Free tier generoso; depois escalando por necessidade.

---

## Resumo da sugestão

- **Começar rápido e barato na cloud:** **Railway** (tudo num projeto: backends, workers, Postgres, Redis, RabbitMQ via add-on ou container).
- **Quando crescer ou precisar de mais controle:** **AWS** com ECS/Fargate + RDS + ElastiCache + Amazon MQ, ou **Fly.io** para manter simplicidade com mais escala.

Em qualquer opção, manter o **mesmo contrato E2E**: JWT único (Core), mesmo RabbitMQ para orders/payments, tenant `tenant_demo` nos seeds e nas configs de exemplo.
