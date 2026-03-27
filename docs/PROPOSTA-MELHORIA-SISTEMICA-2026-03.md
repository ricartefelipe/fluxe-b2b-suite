# Proposta de melhoria sistemica (2026-03)

Objetivo: reduzir risco de quebra entre servicos, aumentar previsibilidade de release e consolidar um baseline de qualidade operacional para Core, Orders, Payments e Frontend.

## 1) Estado atual consolidado

- `spring-saas-core`: ajustes recentes de audit export em `develop`; Qodana removido do repositorio e da documentacao.
- `node-b2b-orders`: lint, build e testes passando localmente.
- `py-payments-ledger`: ruff, black, mypy e testes passando localmente; correcoes no fake gateway e tipagem Stripe aplicadas.
- `fluxe-b2b-suite/saas-suite-ui`: lint, build e testes passando localmente.

## 2) Pontos de quebra priorizados

### P0 - Quebra de esteira

- Dependencia de CI remoto sem fallback local padronizado por repo.
- Risco: bloqueio de merge/release por indisponibilidade de Actions/conta.
- Acao: padronizar script de validacao local "pre-merge" por repositorio.

### P1 - Contratos entre servicos

- Contratos estao documentados, mas falta um gate unico para validar compatibilidade entre eventos e OpenAPI em todos os repos.
- Risco: regressao silenciosa em payload/routing key.
- Acao: criar verificador de contratos multi-repo no `fluxe-b2b-suite`.

### P1 - Observabilidade de release

- Metricas existem, mas sem checklist unico de health pos-deploy por ambiente.
- Risco: problema em producao detectado tardiamente.
- Acao: padronizar smoke checks e SLO minimo por servico.

### P2 - Qualidade estatica padronizada

- Qodana foi removido; nao existe substituto unico para Java no Core.
- Risco: perda de cobertura estatica em regras de qualidade.
- Acao: adotar um gate estatica unico (ex.: SonarCloud ou equivalente) para os 4 repos.

## 3) Plano de execucao (4 frentes)

## Frente A - Gate de qualidade unificado

- A1. Definir matriz minima obrigatoria por repo:
  - Core: `spotless:check`, `test`
  - Orders: `lint`, `build`, `test`
  - Payments: `ruff`, `black --check`, `mypy`, `pytest`
  - Frontend: `lint`, `build`, `test`
- A2. Publicar script `scripts/pre-merge-checks.sh` no `fluxe-b2b-suite` com os comandos oficiais por repo.
- A3. Documentar tempo maximo esperado por suite e criterio de bloqueio de merge.

## Frente B - Contratos e compatibilidade

- B1. Criar checklist de compatibilidade de eventos (Core -> Orders/Payments).
- B2. Adicionar validacao automatica de schemas de evento e OpenAPI no pipeline de integracao.
- B3. Definir politica de versao de contrato (minor compativel, major com migracao).

## Frente C - Runtime e resiliencia

- C1. Padronizar smoke test pos-merge em `develop` para os 3 backends.
- C2. Definir threshold de fila/backlog RabbitMQ e alarmes minimos por ambiente.
- C3. Criar runbook curto de rollback por repositorio.

## Frente D - Governanca de release

- D1. Checklist unico de promocao `develop -> master`.
- D2. Congelar release se algum item P0/P1 estiver vermelho.
- D3. Publicar changelog sincronizado por release quando houver alteracao cross-repo.

## 4) Criterios de pronto

- 100% dos repos com gate de qualidade executavel localmente e no CI.
- Validacao de contrato rodando automaticamente em PR para `develop`.
- Smoke test pos-merge executado e registrado em release notes.
- Runbook de rollback documentado e testado ao menos 1 vez por trimestre.

## 5) Sequencia recomendada (ordem de execucao)

1. Frente A (qualidade unificada)
2. Frente B (contratos)
3. Frente C (resiliencia runtime)
4. Frente D (governanca de release)

Essa ordem reduz risco imediato de quebra e cria base para evolucoes sem regressao entre servicos.
