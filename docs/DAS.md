# Documento de Arquitetura de Software (DAS) — Fluxe B2B Suite

**Versão:** 1.0  
**Última atualização:** 2026-02

---

## 1. Visão geral

A Fluxe B2B Suite é uma plataforma **multi-tenant** para e-commerce B2B, operações (pedidos, inventário, pagamentos, ledger) e governança (tenants, políticas ABAC, feature flags, auditoria). A arquitetura é **distribuída**: frontend único (Angular/Nx) e três backends especializados (Spring, Node, Python), integrados por **HTTP** e **mensageria (RabbitMQ)**.

---

## 2. Objetivos e restrições

- **Objetivos:** Suportar múltiplos tenants com isolamento de dados, fluxo completo pedido → reserva → confirmação → pagamento, e governança centralizada (Core).
- **Restrições:** Uso de stack já definida (Angular, Spring Boot, NestJS, FastAPI); contrato de identidade (JWT) compartilhado entre backends; eventos assíncronos via RabbitMQ.

---

## 3. Visão da arquitetura

- **Frontend (fluxe-b2b-suite):** Aplicações Angular (Shop, Ops Portal, Admin Console) em Nx monorepo; API Express para produtos e proxy em dev. Autenticação em modo dev (token do Core) ou OIDC em produção.
- **Core (spring-saas-core):** Governança: CRUD de tenants, políticas ABAC, feature flags por tenant, auditoria. Emissão de JWT em ambiente dev (`/v1/dev/token`).
- **Orders (node-b2b-orders):** Pedidos e inventário; worker assíncrono (outbox); publica `payment.charge_requested` e consome `payment.settled`.
- **Payments (py-payments-ledger):** Pagamentos e ledger double-entry; consome `payment.charge_requested`, processa e publica `payment.settled`.

Diagramas detalhados: [C4 (Contexto e Container)](C4-suite.md).

---

## 4. Decisões arquiteturais principais

| Decisão | Justificativa |
|---------|----------------|
| Múltiplos backends (Spring, Node, Python) | Especialização por domínio e stack adequada por serviço (Core em Java, Orders em Node, Payments em Python). |
| JWT único (emitido pelo Core) em E2E | Um login no frontend aceito por todos os backends; mesmo secret/issuer nos três. |
| RabbitMQ compartilhado para orders ↔ payments | Fluxo assíncrono pedido confirmado → cobrança → pedido PAID sem acoplamento síncrono. |
| Outbox pattern (Orders e Payments) | Consistência entre persistência e publicação de eventos; reprocessamento em caso de falha. |
| Tenant por request (header X-Tenant-Id) | Isolamento lógico sem múltiplas conexões de banco; validação contra claim `tid` do JWT. |

---

## 5. Stack tecnológica

| Camada | Tecnologias |
|--------|-------------|
| Frontend | Angular 19+, Nx, Angular Material, RxJS |
| Core | Java 21, Spring Boot 3, Spring Security (JWT), JPA, Liquibase, PostgreSQL |
| Orders | Node 20+, NestJS, Fastify, Prisma, PostgreSQL, Redis, RabbitMQ |
| Payments | Python 3.12+, FastAPI, SQLAlchemy, Alembic, PostgreSQL, Redis, RabbitMQ |
| Infra | PostgreSQL (por serviço), Redis (por serviço), RabbitMQ (compartilhado em E2E) |
| Observabilidade | Prometheus, Grafana; health/ready e métricas por serviço |

---

## 6. Riscos e mitigações

- **Disponibilidade do RabbitMQ:** Ponto único de integração orders/payments; mitigação: broker gerido (ex.: CloudAMQP, Amazon MQ) e filas DLQ com retry.
- **Consistência eventual:** Fluxo pedido → PAID é assíncrono; mitigação: idempotência e contratos de eventos documentados; UI pode indicar “processando pagamento”.

---

## 7. Referências

- [Regras de negócio](regras-de-negocio.md)
- [E2E e hospedagem](E2E-RUN.md)
- [C4 — Suite](C4-suite.md)
