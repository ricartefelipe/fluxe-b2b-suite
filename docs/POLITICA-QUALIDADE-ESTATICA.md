# Politica de qualidade estatica (Sonar-like)

Objetivo: padronizar analise estatica apos retirada do Qodana, com gate unico e auditavel.

## Stack oficial

- **Semgrep (OWASP Top Ten ruleset)** para analise estatica e vulnerabilidades
- **Linters nativos por stack** para qualidade de codigo:
  - `fluxe-b2b-suite`: ESLint + build/test
  - `spring-saas-core`: Spotless + Maven test
  - `node-b2b-orders`: ESLint + TypeScript build + testes
  - `py-payments-ledger`: Ruff + Black + Mypy + pytest

## Politica de bloqueio

- PR para `develop`/`master` deve passar em:
  - CI principal do repositorio
  - workflow estatico (`semgrep.yml`)
- Merge bloqueado em caso de:
  - falha de linter/format/typecheck/test
  - alerta Semgrep de severidade alta/critica nao tratado

## Operacao

- Revisao semanal de alertas Semgrep por repositorio
- Correcao prioritaria para achados em rotas publicas e componentes de identidade
- Excecoes devem ser justificadas no PR com prazo e responsavel

## Decisao formal e evolucao

Ver [ANALISE-ESTATICA.md](ANALISE-ESTATICA.md) (registo da escolha Semgrep vs Sonar e criterio D-04 do backlog).
