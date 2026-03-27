# Backlog executavel - melhoria sistemica (2026-03)

Backlog derivado da proposta em `docs/PROPOSTA-MELHORIA-SISTEMICA-2026-03.md`, organizado para execucao por epicos, com ordem, dependencias, criterio de aceite e dono sugerido por repositorio.

**Estado de execucao (revisao 2026-03-27):** a coluna **Estado** indica o que ja esta implementado no repositorio ou em CI. Itens **Parcial** cumprem parte do criterio de aceite; **Pendente** ainda nao. EPICs B–D deste backlog estao **concluidos** no que respeita a B-04, C-04/C-05, D-01–D-04 (ver entregas referenciadas em cada item).

---

## Prioridade e sequencia

1. EPIC-A (P0): Gate de qualidade unificado
2. EPIC-B (P1): Contratos e compatibilidade
3. EPIC-C (P1): Runtime e resiliencia
4. EPIC-D (P2): Governanca de release e qualidade estatica

## EPIC-A - Gate de qualidade unificado (P0)

Objetivo: evitar merge/release sem baseline minimo de verificacao local e CI.

- **Estado: Concluído** — A-01 | `fluxe-b2b-suite` | Criar `scripts/pre-merge-checks.sh`
  - Escopo: script unico que executa checks dos 4 repositorios, com falha imediata e resumo final.
  - Aceite: script roda do inicio ao fim; retorna exit code != 0 em qualquer falha.
  - Entrega: `scripts/pre-merge-checks.sh`, `pnpm verify:all` na raiz; Maven com `MAVEN_REPO_LOCAL`; payments com `.venv` ou `uv`.
  - Dependencia: nenhuma.

- **Estado: Concluído** — A-02 | `spring-saas-core` | Padronizar comando oficial de verificacao
  - Escopo: documentar e alinhar `./mvnw spotless:check test`.
  - Aceite: comando descrito em doc operacional e usado no script do EPIC-A.
  - Entrega: `PIPELINE-ESTEIRAS.md` (tabela de qualidade); comando embutido em `pre-merge-checks.sh`.
  - Dependencia: A-01.

- **Estado: Concluído** — A-03 | `node-b2b-orders` | Padronizar comando oficial de verificacao
  - Escopo: alinhar `npm run lint && npm run build && npm test`.
  - Entrega: idem; integrado no gate unificado.
  - Dependencia: A-01.

- **Estado: Concluído** — A-04 | `py-payments-ledger` | Padronizar comando oficial de verificacao
  - Escopo: alinhar `ruff`, `black --check`, `mypy`, `pytest` (via `.venv` ou `uv run` no script).
  - Dependencia: A-01.

- **Estado: Concluído** — A-05 | `fluxe-b2b-suite/saas-suite-ui` | Padronizar comando oficial de verificacao
  - Escopo: alinhar `pnpm lint && pnpm build && pnpm test`.
  - Entrega: target `suite` no `pre-merge-checks.sh` (cwd `saas-suite-ui`).
  - Dependencia: A-01.

- **Estado: Concluído** — A-06 | `fluxe-b2b-suite` | Definir timeout e criterio de bloqueio
  - Escopo: registrar tempo esperado por suite e regra de bloqueio.
  - Aceite: tabela publicada em doc de pipeline.
  - Entrega: tabela orientativa abaixo + criterio: **merge em `develop` bloqueado se CI do PR falhar**; localmente falha se `verify:all` retornar != 0.

### Tabela orientativa — duracao do gate local (`pnpm verify:all`)

Ordens de grandeza em ambiente dev/CI tipico; variam com cache Nx/Maven e hardware.

| Grupo    | Conteudo resumido | Ordem de grandeza |
|----------|-------------------|-------------------|
| suite    | Nx lint, build, test (saas-suite-ui) | ~8–15 min |
| core     | Spotless + Maven test | ~2–4 min |
| orders   | eslint, tsc, jest | ~1–3 min |
| payments | ruff, black, mypy, pytest | ~0.5–2 min |
| **total**| os quatro em sequencia | ~15–25 min tipico |

## EPIC-B - Contratos e compatibilidade (P1)

Objetivo: bloquear regressao de contrato entre Core, Orders e Payments.

- **Estado: Concluído** — B-01 | `spring-saas-core` | Consolidar fonte canonica de eventos
  - Escopo: validar `docs/contracts/events.md` e schemas como referencia oficial.
  - Nota: fonte canonica no Core; revisao continua de exemplos em evolucao normal.
  - Dependencia: nenhuma.

- **Estado: Concluído** — B-02 | `node-b2b-orders` e `py-payments-ledger` | Sincronizar espelhos de contrato
  - Escopo: espelho de `events.md`, `headers.md`, `identity.md` + JSON Schema canonicos do Core em `docs/contracts/schemas/`.
  - Entrega: espelhos alinhados; `cmp`/drift zero no validador.
  - Dependencia: B-01.

- **Estado: Concluído** — B-03 | `fluxe-b2b-suite` | Criar validador de contrato multi-repo
  - Escopo: script que compara contratos e falha em divergencia.
  - Entrega: `scripts/check-contract-drift.sh`, `pnpm verify:contracts`, workflow `contracts-drift.yml` (com PAT opcional).
  - Dependencia: B-02.

- **Estado: Concluído** — B-04 | `spring-saas-core` + consumidores | Politica de versao de contrato
  - Escopo: definir regra de alteracao minor/major e janela de compatibilidade.
  - Entrega: `spring-saas-core/docs/contracts/POLITICA-VERSAO-CONTRATO.md` (canonico); apontadores em `node-b2b-orders` e `py-payments-ledger` (`docs/contracts/POLITICA-VERSAO-CONTRATO.md`). O validador `check-contract-drift` compara apenas espelhos de contrato (`events`, `headers`, `identity`, schemas); a politica e doc de processo e nao entra no `cmp`.
  - Dependencia: B-03.

## EPIC-C - Runtime e resiliencia (P1)

Objetivo: detectar quebra funcional cedo em staging e reduzir MTTR.

- **Estado: Concluído** — C-01 | `spring-saas-core` | Criar smoke pos-merge em `develop`
  - Escopo: health + contrato basico via OpenAPI (`/v3/api-docs`).
  - Entrega: `scripts/smoke-post-merge.sh`, workflow, secret `CORE_SMOKE_URL`.
  - Dependencia: A-02.

- **Estado: Parcial** — C-02 | `node-b2b-orders` | Criar smoke pos-merge em `develop`
  - Entrega atual: `/v1/healthz` + `/v1/docs-json` em staging (secret `ORDERS_SMOKE_URL`).
  - Pendencia opcional: fluxo minimo de pedido e validacao de evento publicado (ampliacao futura).
  - Dependencia: A-03.

- **Estado: Parcial** — C-03 | `py-payments-ledger` | Criar smoke pos-merge em `develop`
  - Entrega atual: `/healthz` + `/openapi.json` em staging (secret `PAYMENTS_SMOKE_URL`).
  - Pendencia opcional: settle basico e evidencia de fila/evento (ampliacao futura).
  - Dependencia: A-04.

- **Estado: Concluído** — C-04 | `fluxe-b2b-suite` | Definir thresholds de monitoramento
  - Entrega: `docs/MONITORING-THRESHOLDS.md` (thresholds + secao **Mapeamento de alertas (operacao)** para Railway/Grafana/logs); referencia no `PIPELINE-ESTEIRAS.md`.
  - Dependencia: C-01..C-03.

- **Estado: Concluído** — C-05 | Todos os repos | Runbook de rollback enxuto
  - Entrega: `docs/RUNBOOK-ROLLBACK.md` (por servico; alinhado a tags/imagem em `PIPELINE-ESTEIRAS.md`).
  - Dependencia: C-04.

## EPIC-D - Governanca de release e qualidade estatica (P2)

Objetivo: fechar lacunas de processo e garantir trilha de release.

- **Estado: Concluído** — D-01 | `fluxe-b2b-suite` | Checklist unico de promocao `develop -> master`
  - Entrega: `docs/CHECKLIST-PROMOCAO-DEVELOP-MASTER.md`; contexto em `PIPELINE-ESTEIRAS.md`, `GO-LIVE-VENDA.md`.
  - Dependencia: EPIC-A, EPIC-B, EPIC-C.

- **Estado: Concluído** — D-02 | Todos os repos | Politica de freeze por risco
  - Entrega: `docs/POLITICA-FREEZE-RELEASE.md`.
  - Dependencia: D-01.

- **Estado: Concluído** — D-03 | Todos os repos | Padrao de changelog cross-repo
  - Entrega: `CHANGELOG.md` por repo; template multi-servico em `docs/TEMPLATE-RELEASE-NOTES.md`.
  - Dependencia: D-01.

- **Estado: Concluído** — D-04 | `spring-saas-core` + demais repos | Definir substituto de analise estatica Sonar-like
  - Entrega: Semgrep + linters por stack; decisao formal em `docs/ANALISE-ESTATICA.md`; politica operacional em `docs/POLITICA-QUALIDADE-ESTATICA.md`.
  - Dependencia: D-01.

## Sprint sugerida (execucao pratica)

- Sprint 1: A-01..A-06 (baseline de qualidade e bloqueio de quebra) — **concluido**
- Sprint 2: B-01..B-04 (contrato e compatibilidade) — **concluido**
- Sprint 3: C-01..C-05 (smoke e resiliencia) — **concluido** (C-02/C-03 com ampliacoes opcionais futuras)
- Sprint 4: D-01..D-04 (governanca de release) — **concluido (P2)**

## Definition of Done global

| Criterio | Estado |
|----------|--------|
| Baseline de qualidade executavel local + CI em todos os repos | **OK** (`verify:all`, CI por repo) |
| Validacao contratual automatica em PR para `develop` | **OK** (`contracts-drift` + `verify:contracts` local) |
| Smoke pos-merge implantado para os 3 backends | **OK** (HTTP + secrets staging) |
| Checklist de release ativo e usado em promocao real | **OK** (`CHECKLIST-PROMOCAO-DEVELOP-MASTER.md`, freeze, template, runbook) |
