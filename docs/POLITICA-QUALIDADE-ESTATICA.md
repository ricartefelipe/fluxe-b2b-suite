# Politica de qualidade estatica (Sonar-like)

Objetivo: padronizar analise estatica apos retirada do Qodana, com gate unico e auditavel.

## Stack oficial

- **CodeQL (GitHub Advanced Security)** para analise semantica e vulnerabilidades
- **Linters nativos por stack** para qualidade de codigo:
  - `fluxe-b2b-suite`: ESLint + build/test
  - `spring-saas-core`: Spotless + Maven test
  - `node-b2b-orders`: ESLint + TypeScript build + testes
  - `py-payments-ledger`: Ruff + Black + Mypy + pytest

## Politica de bloqueio

- PR para `develop`/`master` deve passar em:
  - CI principal do repositorio
  - workflow `CodeQL`
- Merge bloqueado em caso de:
  - falha de linter/format/typecheck/test
  - alerta CodeQL de severidade alta/critica nao tratado

## Operacao

- Revisao semanal de alertas CodeQL por repositorio
- Correcao prioritaria para achados em rotas publicas e componentes de identidade
- Excecoes devem ser justificadas no PR com prazo e responsavel
