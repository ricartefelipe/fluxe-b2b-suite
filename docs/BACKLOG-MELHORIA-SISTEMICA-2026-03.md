# Backlog executavel - melhoria sistemica (2026-03)

Backlog derivado da proposta em `docs/PROPOSTA-MELHORIA-SISTEMICA-2026-03.md`, organizado para execucao por epicos, com ordem, dependencias, criterio de aceite e dono sugerido por repositorio.

## Prioridade e sequencia

1. EPIC-A (P0): Gate de qualidade unificado
2. EPIC-B (P1): Contratos e compatibilidade
3. EPIC-C (P1): Runtime e resiliencia
4. EPIC-D (P2): Governanca de release e qualidade estatica

## EPIC-A - Gate de qualidade unificado (P0)

Objetivo: evitar merge/release sem baseline minimo de verificacao local e CI.

- A-01 | `fluxe-b2b-suite` | Criar `scripts/pre-merge-checks.sh`
  - Escopo: script unico que executa checks dos 4 repositorios, com falha imediata e resumo final.
  - Aceite: script roda do inicio ao fim; retorna exit code != 0 em qualquer falha.
  - Dependencia: nenhuma.

- A-02 | `spring-saas-core` | Padronizar comando oficial de verificacao
  - Escopo: documentar e alinhar `./mvnw spotless:check test`.
  - Aceite: comando descrito em doc operacional e usado no script do EPIC-A.
  - Dependencia: A-01.

- A-03 | `node-b2b-orders` | Padronizar comando oficial de verificacao
  - Escopo: alinhar `npm run lint && npm run build && npm test`.
  - Aceite: comandos listados na doc e integrados no script do EPIC-A.
  - Dependencia: A-01.

- A-04 | `py-payments-ledger` | Padronizar comando oficial de verificacao
  - Escopo: alinhar `.venv/bin/ruff check . && .venv/bin/black --check . && .venv/bin/mypy src && .venv/bin/pytest`.
  - Aceite: comando documentado e integrado no script do EPIC-A.
  - Dependencia: A-01.

- A-05 | `fluxe-b2b-suite/saas-suite-ui` | Padronizar comando oficial de verificacao
  - Escopo: alinhar `pnpm lint && pnpm build && pnpm test`.
  - Aceite: comando documentado e integrado no script do EPIC-A.
  - Dependencia: A-01.

- A-06 | `fluxe-b2b-suite` | Definir timeout e criterio de bloqueio
  - Escopo: registrar tempo esperado por suite e regra de bloqueio.
  - Aceite: tabela publicada em doc de pipeline.
  - Dependencia: A-02..A-05.

## EPIC-B - Contratos e compatibilidade (P1)

Objetivo: bloquear regressao de contrato entre Core, Orders e Payments.

- B-01 | `spring-saas-core` | Consolidar fonte canonica de eventos
  - Escopo: validar `docs/contracts/events.md` e schemas como referencia oficial.
  - Aceite: docs sem divergencia interna; exemplos de routing key atualizados.
  - Dependencia: nenhuma.

- B-02 | `node-b2b-orders` e `py-payments-ledger` | Sincronizar espelhos de contrato
  - Escopo: garantir espelho de `events.md`, `headers.md`, `identity.md` com Core.
  - Aceite: diff semantico zero em campos obrigatorios e eventos suportados.
  - Dependencia: B-01.

- B-03 | `fluxe-b2b-suite` | Criar validador de contrato multi-repo
  - Escopo: script que compara contratos e falha em divergencia.
  - Aceite: job CI falha se houver drift contratual.
  - Dependencia: B-02.

- B-04 | `spring-saas-core` + consumidores | Politica de versao de contrato
  - Escopo: definir regra de alteracao minor/major e janela de compatibilidade.
  - Aceite: politica documentada e referenciada nos repos.
  - Dependencia: B-03.

## EPIC-C - Runtime e resiliencia (P1)

Objetivo: detectar quebra funcional cedo em staging e reduzir MTTR.

- C-01 | `spring-saas-core` | Criar smoke pos-merge em `develop`
  - Escopo: health, endpoint principal e contrato basico de auth/tenant.
  - Aceite: script executavel em pipeline com retorno claro.
  - Dependencia: A-02.

- C-02 | `node-b2b-orders` | Criar smoke pos-merge em `develop`
  - Escopo: health, fluxo minimo de pedido, validacao de evento publicado.
  - Aceite: smoke passa em ambiente staging.
  - Dependencia: A-03.

- C-03 | `py-payments-ledger` | Criar smoke pos-merge em `develop`
  - Escopo: health, settle basico, validacao de consumo/publicacao de evento.
  - Aceite: smoke passa em staging com log de evidencias.
  - Dependencia: A-04.

- C-04 | `fluxe-b2b-suite` | Definir thresholds de monitoramento
  - Escopo: backlog de fila, erro 5xx, latencia p95 por servico.
  - Aceite: thresholds documentados e mapeados em alerta.
  - Dependencia: C-01..C-03.

- C-05 | Todos os repos | Runbook de rollback enxuto
  - Escopo: procedimento de rollback por servico e criterio de acionamento.
  - Aceite: runbook validado em simulacao.
  - Dependencia: C-04.

## EPIC-D - Governanca de release e qualidade estatica (P2)

Objetivo: fechar lacunas de processo e garantir trilha de release.

- D-01 | `fluxe-b2b-suite` | Checklist unico de promocao `develop -> master`
  - Escopo: gate de qualidade, contrato, smoke, observabilidade e changelog.
  - Aceite: checklist versionado e aplicado em 1 ciclo real.
  - Dependencia: EPIC-A, EPIC-B, EPIC-C.

- D-02 | Todos os repos | Politica de freeze por risco
  - Escopo: bloquear release com pendencia P0/P1.
  - Aceite: regra registrada no pipeline e guia operacional.
  - Dependencia: D-01.

- D-03 | Todos os repos | Padrao de changelog cross-repo
  - Escopo: quando mudanca impactar multiplos servicos, atualizar changelog sincronizado.
  - Aceite: template padrao de release notes publicado.
  - Dependencia: D-01.

- D-04 | `spring-saas-core` + demais repos | Definir substituto de analise estatica Sonar-like
  - Escopo: selecionar e implantar uma ferramenta unica para analise estatica.
  - Aceite: job ativo em CI para os repositorios alvo.
  - Dependencia: D-01.

## Sprint sugerida (execucao pratica)

- Sprint 1: A-01..A-06 (baseline de qualidade e bloqueio de quebra)
- Sprint 2: B-01..B-04 (contrato e compatibilidade)
- Sprint 3: C-01..C-05 (smoke e resiliencia)
- Sprint 4: D-01..D-04 (governanca de release)

## Definition of Done global

- Baseline de qualidade executavel local + CI em todos os repos.
- Validacao contratual automatica em PR para `develop`.
- Smoke pos-merge implantado para os 3 backends.
- Checklist de release ativo e usado em promocao real.
