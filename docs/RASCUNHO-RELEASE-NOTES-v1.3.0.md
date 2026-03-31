# Rascunho — release notes multi-repo — v1.3.0

> **Estado:** rascunho para GitHub Releases / `CHANGELOG`. Ajustar datas e números de PR antes de publicar.  
> **Baseline:** alterações acumuladas desde `v1.2.0` (suite, orders, payments); `spring-saas-core` já tem tag `v1.3.0` no histórico — alinhar versão nos quatro repos na mesma janela se for release coordenada.

---

## Fluxe B2B Suite — v1.3.0 — (data a preencher)

### Resumo

- Documentação operacional (Railway, checklists, plano comercial 30 dias), UIs admin/ops com home e billing, shell de auth premium, smoke staging até PAID (saga), correções E2E e worker Railway.

### spring-saas-core

- **Corrigido:** Liquibase idempotente / checksum em soft-delete e políticas (vários PRs até compatibilidade com schema existente).
- **Corrigido / alterado:** Chat IA (quota 429, fallback LLM, saudações, insights off-hours).
- **Docs:** link canónico pipeline, notas `payment.settled` / fila worker.
- **Seed / dados:** ajustes de seed admin e remoção de migração com email hardcoded (substituído por doc SQL manual onde aplicável).

### node-b2b-orders

- **Corrigido:** startup com Prisma P3005 / baseline sem migration destrutiva; healthcheck Railway com timeout maior.
- **Docs / ops:** staging PAID saga, events, link pipeline; script DDL Outbox; overrides de segurança npm.
- **Railway:** config worker / sync de variáveis; smoke OpenAPI pós-merge.

### py-payments-ledger

- **Corrigido:** Alembic baseline / `DuplicateTable`; healthcheck Railway.
- **Corrigido:** worker ignora `payment.settled` na fila adequada.
- **Docs / qualidade:** contratos espelhados, smoke HTTP, Semgrep.

### fluxe-b2b-suite (UI / scripts / docs)

- **Adicionado:** Admin Console — Início, banner trial/past-due, Ajuda com API; shell auth premium; recuperação de senha.
- **Adicionado:** documentação `EXECUCAO-VENDA-MONITORIZACAO`, pipeline PAID/saga, checklists de ambientes, plano comercial 30 dias, manutenção Railway.
- **Adicionado:** smoke pedido staging (incl. opção até PAID).
- **Corrigido:** worker orders a partir do suite (imagem GHCR), E2E local/admin redirect `/home`.

### Contratos

- Drift: rever `docs/contracts` nos quatro repos na data do release; alinhar com Core.

### Migrações

- **Liquibase (Core):** changesets relacionados a soft-delete / policies (ver histórico `fix/liquibase-*`).
- **Prisma (Orders):** política P3005 / baseline — ver PRs `fix/prisma-*`, `fix/startup`.
- **Alembic (Payments):** baseline passivo — ver PRs `fix/alembic-*`.

### Operação

- Variáveis: confirmar timeouts de healthcheck nos serviços Docker (orders, payments); URLs de API nos fronts; sem valores secretos neste doc.

### Rollback

- Tags anteriores: `v1.2.0` (suite, orders, payments). Ver [RUNBOOK-ROLLBACK.md](RUNBOOK-ROLLBACK.md).

---

## Versão por repositório

| Repo | Tag sugerida | Nota |
|------|----------------|------|
| spring-saas-core | `v1.3.0` | Já existe no histórico local; confirmar remoto |
| node-b2b-orders | `v1.3.0` | Alinhar com Core na mesma release |
| py-payments-ledger | `v1.3.0` | Idem |
| fluxe-b2b-suite | `v1.3.0` | Idem |

---

## Referência de commits (desde v1.2.0)

Gerar lista atualizada:

```bash
git log v1.2.0..HEAD --oneline
```

em cada repositório (executar na raiz de cada clone).
