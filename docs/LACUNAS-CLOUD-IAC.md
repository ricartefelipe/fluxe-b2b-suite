# O que falta para 100% e como tratar na cloud com IaC

Visão do que falta para o sistema funcionar 100% (local e integrado) e da estratégia de cloud com Infrastructure as Code.

---

## 1. O que falta para o sistema funcionar 100%

### 1.1 Local / E2E integrado

| Gap | Descrição | Impacto | Onde tratar |
|-----|-----------|---------|-------------|
| **RabbitMQ compartilhado** | Hoje cada backend sobe seu próprio RabbitMQ (Spring 5672, Node 5673, Python 5674). Para o fluxo pedido → pagamento (Node publica `payment.charge_requested`, Python consome e publica `payment.settled`), Node e Python precisam do **mesmo** broker. | Pedido não vai para PAID; integração Orders ↔ Payments não funciona. | Ajustar `up-all.sh` ou composes: usar um único RabbitMQ (ex.: do Spring) e configurar Node/Python com `RABBITMQ_URL` apontando para ele (ex.: `host.docker.internal:5672` se os containers acessarem o host). Ou subir só o RabbitMQ do Spring primeiro e nos `.env` de Node/Python usar URL que aponte para o host na porta 5672. |
| **OIDC em produção** | Frontend hoje usa apenas auth dev (JWT local). Para produção é necessário OIDC + PKCE (ex.: Keycloak). | Login real em produção. | Implementar fluxo OIDC no frontend e configurar `AUTH_MODE=oidc` e `OIDC_*` no Core; documentar em [documento-implantacao.md](documento-implantacao.md). |
| **Config do frontend por ambiente** | `config.json` hoje é estático. Em cloud cada ambiente (staging/prod) precisa de URLs diferentes. | Frontend apontando para backend errado. | Já existe suporte a runtime config; garantir que no deploy (S3, Pages, etc.) o `config.json` seja gerado por env (envsubst no entrypoint ou build por ambiente). |
| **Testes E2E automatizados** | E2E “login → tenant → order → confirm” e fluxo 403 existem como cenário manual; não há script/Playwright que valide ponta a ponta. | Regressão não detectada. | Implementar em `fluxe-b2b-suite` (ex.: Playwright) e opcionalmente no CI; pode depender de ambiente com backends estáveis (Docker ou ambiente dedicado). |
| **Silent refresh / token em memória** | Requisito era não usar localStorage em prod; hoje usa sessionStorage. Silent refresh (OIDC) não implementado. | Segurança e UX em produção. | Com OIDC: usar lib (ex.: angular-oauth2-oidc) com refresh token/silent refresh; documentar BFF como alternativa. |

### 1.2 Backends e mensageria

| Gap | Descrição | Impacto |
|-----|-----------|---------|
| **Worker Node → RabbitMQ do Spring** | Se Node e Python usarem o RabbitMQ do Spring, os containers Node/Python precisam conseguir conectar no broker (mesma rede Docker ou host). | Sem rede única, cada compose fica isolado; é preciso rede externa ou uso de `host.docker.internal` + porta 5672 do host. |
| **Nomes de exchange/fila** | Node e Python já usam nomes alinhados (`payment.charge_requested`, `payment.settled`, exchanges). Garantir que, ao compartilhar broker, as mesmas exchanges/queues sejam declaradas. | Conflito ou mensagens perdidas se nomes divergirem. |
| **Seeds e tenant_demo** | E2E depende de `tenant_demo` nos seeds de Node e Python. Já está nos seeds; garantir que migrate+seed rodem após subida (o `up-all.sh` já faz). | Sem seed, listagens e fluxos quebram. |

### 1.3 Resumo “checklist 100% local” (implementado)

- [x] Um único RabbitMQ para Node + Python: rede Docker `fluxe_shared`, RabbitMQ do Spring com `container_name: fluxe-rabbitmq`; Node e Python recebem `RABBITMQ_URL=amqp://guest:guest@fluxe-rabbitmq:5672` no `up-all.sh`.
- [x] `ORDERS_INTEGRATION_ENABLED=true` no Python (já em `.env.example`).
- [x] JWT igual nos 3 backends (o `up-all.sh` já ajusta Node/Python).
- [x] Frontend com `config.json` apontando para localhost:8080, 3000, 8000 (já existe).
- [ ] Teste manual: criar pedido → confirmar → aguardar → pedido PAID e ledger com entrada (validar após subir com `./scripts/up-all.sh`).

---

## 2. Cloud: como vamos tratar

A suite será tratada na cloud como **conjunto de serviços** (APIs + workers + frontend estático) com **infraestrutura definida por código (IaC)** para reprodutibilidade e ambientes (staging/prod).

### 2.1 Modelo de deploy na cloud

- **Backends:** cada serviço (spring-saas-core, node-b2b-orders API, node-b2b-orders worker, py-payments-ledger API, py-payments-ledger worker) como **container** (imagens já no GHCR).
- **Frontend:** build estático (Nx) servido por **CDN/object storage** (S3 + CloudFront, ou equivalente) ou por GitHub Pages; config por ambiente via `config.json` injetado no build ou em runtime.
- **Dados e mensageria:**
  - **PostgreSQL:** um por serviço (ou RDS multi-DB/schemas), provisionado via IaC.
  - **Redis:** um por serviço (ou ElastiCache / Upstash), via IaC.
  - **RabbitMQ:** **um único broker** para Orders e Payments (Amazon MQ, CloudAMQP ou instância gerida), provisionado via IaC e URL passada aos dois.

Ordem de deploy segue o [documento-implantacao.md](documento-implantacao.md): RabbitMQ → Postgres/Redis → Core → Orders (API + worker) → Payments (API + worker) → Frontend.

### 2.2 Uso de IaC (Infrastructure as Code)

Objetivo: **ter toda a infraestrutura de cloud versionada e aplicável em múltiplos ambientes** (ex.: staging, prod).

| Ferramenta | Uso sugerido |
|------------|--------------|
| **Terraform** | Recomendado para cloud (AWS, GCP, etc.): VPC, subnets, security groups, RDS, ElastiCache, Amazon MQ (ou SNS/SQS se migrar), ECS/Fargate (ou EKS), S3, CloudFront, ALB, IAM, secrets. Módulos por ambiente (workspaces ou diretórios `staging/`, `prod/`). |
| **Pulumi** | Alternativa a Terraform (Python/TypeScript); mesmo escopo de recursos. |
| **AWS CDK** | Se a stack for só AWS e a equipe preferir código (TypeScript/Python) em vez de HCL. |
| **Pulumi/Terraform + CI** | Pipeline (GitHub Actions ou outro) aplica `terraform apply` ou `pulumi up` em branch específica ou tag, com state remoto (S3 + DynamoDB para Terraform, Pulumi backend). |

**Implementado:** O repositório passou a incluir IaC em **`infra/terraform/`**: Terraform para AWS (VPC, RDS, ElastiCache, Amazon MQ, ECS, ALB, S3 + CloudFront). Ver [infra/terraform/README.md](../infra/terraform/README.md).

### 2.3 O que criar com IaC (exemplo AWS)

Para a suite rodar 100% na cloud com IaC, um possível escopo:

1. **Rede:** VPC, subnets públicas/privadas, NAT (se necessário).
2. **Dados:** RDS PostgreSQL (instâncias ou DBs por serviço); ElastiCache Redis (por serviço ou compartilhado conforme política).
3. **Mensageria:** Amazon MQ for RabbitMQ (ou broker gerido equivalente); uma instância e URL única para Node e Python.
4. **Compute:** ECS cluster + Fargate (ou EKS); task definitions para Core, Orders API, Orders worker, Payments API, Payments worker; variáveis e secrets (Secrets Manager / SSM).
5. **Frontend:** S3 bucket + CloudFront (origem S3, cache, HTTPS); invalidação opcional no deploy.
6. **Entrada:** ALB (ou API Gateway) para as APIs; domínio e certificado (ACM).
7. **Secrets:** JWT secret, DB passwords, URLs de RabbitMQ etc. em Secrets Manager; referência nas task definitions.
8. **Observabilidade (opcional):** CloudWatch log groups, métricas, alarmes; opcionalmente X-Ray.

Cada serviço consome: `DATABASE_URL`, `REDIS_URL`, `RABBITMQ_URL` (Node/Python), `JWT_*`, etc., definidos no IaC ou em repositório de secrets.

### 2.4 Onde versionar o IaC

- **Opção A:** Repositório único `fluxe-b2b-suite` (ou novo repo `fluxe-b2b-infra`), com pasta `infra/` ou `terraform/` contendo módulos e ambientes.
- **Opção B:** Repositório dedicado de infraestrutura (ex.: `fluxe-b2b-infra`) referenciado pelos pipelines de deploy dos 4 repos.

Recomendação: **pasta no monorepo** (ex.: `fluxe-b2b-suite/infra/terraform`) para manter app e infra no mesmo ciclo de versão, ou **repo separado** se várias equipes ou políticas exigirem separação.

---

## 3. Próximos passos sugeridos

| Prioridade | Ação |
|------------|------|
| 1 | **Local 100%:** Já feito: `up-all.sh` usa rede `fluxe_shared` e RabbitMQ do Spring; Node e Python recebem `RABBITMQ_URL=amqp://guest:guest@fluxe-rabbitmq:5672`. Validar fluxo pedido → PAID manualmente. |
| 2 | **Doc e scripts:** E2E-RUN e `up-all.sh` já documentam RabbitMQ compartilhado. Smoke: `./scripts/smoke-suite.sh` (com backends no ar). |
| 3 | **Cloud + IaC:** Implementado em `infra/terraform/` (VPC, RDS, ElastiCache, Amazon MQ, ECS, ALB, S3+CloudFront). Próximo: task definitions ECS e deploy das imagens. |
| 4 | **CI/CD:** Manter build e push de imagens (GHCR) e frontend; opcional: job que aplica Terraform com state remoto (S3). |
| 5 | **Produção:** OIDC + Keycloak, silent refresh, config do frontend por ambiente; E2E em pipeline. |

---

## 4. Referências

- [E2E-RUN.md](E2E-RUN.md) — Subida local, variáveis, troubleshooting, sugestões de hospedagem.
- [documento-implantacao.md](documento-implantacao.md) — Ordem de deploy, variáveis por serviço, health checks.
- [ci-cd-e-deploy.md](ci-cd-e-deploy.md) — CI (testes/lint/build), CD (imagens GHCR, frontend GitHub Pages).
