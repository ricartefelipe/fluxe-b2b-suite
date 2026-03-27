# Análise estática (substituto Sonar-like)

## Decisão (2026-03)

- **Ferramenta primária:** [Semgrep](https://semgrep.dev/) via workflow `codeql.yml` (nome histórico do ficheiro; job Semgrep) nos repositórios `fluxe-b2b-suite`, `spring-saas-core`, `node-b2b-orders`, `py-payments-ledger`.
- **Objetivo:** regras de segurança e qualidade (OWASP-oriented, políticas da equipa) no pipeline de PR/push para `develop` e `master`.

## Por que não SonarQube Cloud neste momento

- Custo e manutenção de projeto por repo; Semgrep integra-se bem em GitHub Actions sem infraestrutura extra.
- Reavaliar Sonar ou equivalente se a equipa exigir métricas de cobertura centralizadas ou quality gate unificado fora do GitHub.

## Complementos por stack

| Stack | Ferramenta adicional |
|-------|----------------------|
| Java (Core) | Spotless + Maven / testes no CI |
| TypeScript (Orders, Suite) | ESLint, TypeScript compiler |
| Python (Payments) | Ruff, Black, Mypy (conforme CI) |

## Evolução

- Novas regras Semgrep: PR no repositório com `p/policy` ou `.semgrep.yml` conforme documentação Semgrep.
- **D-04** do backlog considerado **atendido** com Semgrep + linters nativos até decisão explícita de mudança.
