# SonarCloud — saas-suite-ui

Análise estática do monorepo (lint, duplicação, vulnerabilidades, code smells). O workflow está em `.github/workflows/sonarcloud.yml`.

## Configuração (uma vez)

1. **Criar conta e projeto**
   - Acesse [sonarcloud.io](https://sonarcloud.io) e faça login com GitHub.
   - **Add new organization** (se ainda não tiver).
   - **Analyze new project** → selecione o repositório (ex.: `fluxe-b2b-suite` ou o repo onde está o `saas-suite-ui`).
   - Escolha o plan **Free** e confirme. Anote o **Project Key** (ex.: `org_fluxe-b2b-suite_saas-suite-ui` ou o que o SonarCloud sugerir).

2. **Token**
   - No SonarCloud: **My Account** → **Security** → **Generate Token** (nome: `github-actions`).
   - No GitHub: **Settings** → **Secrets and variables** → **Actions**:
     - Crie o secret `SONAR_TOKEN` com o valor do token.
     - (Opcional) Crie variables `SONAR_ORGANIZATION` e `SONAR_PROJECT_KEY` para não hardcodar no workflow.

3. **Propriedades do projeto**
   - Edite `saas-suite-ui/sonar-project.properties` e preencha:
     - `sonar.organization` = sua organização no SonarCloud.
     - `sonar.projectKey` = Project Key do passo 1.
   - Se o repositório for só o `saas-suite-ui` (não monorepo), no workflow remova ou ajuste `projectBaseDir: saas-suite-ui`.

4. **Rodar**
   - O job **SonarCloud** roda em todo push em `master`/`develop` e em pull requests.
   - Resultados e badge: página do projeto no SonarCloud.

## Cobertura (opcional)

Para enviar cobertura de testes ao SonarCloud:

- Configure os testes (Vitest) para gerar relatório **lcov** (ex.: `coverage.reporter: 'lcov'` nos `vite.config` onde há coverage).
- Gere um único `lcov.info` (por exemplo com `nx run-many -t test --coverage` e um script que una os `lcov.info` de cada app/lib em `coverage/lcov.info`).
- No `sonar-project.properties`, descomente:
  `sonar.typescript.lcov.reportPaths=coverage/lcov.info`
- No workflow, adicione um step que rode os testes com coverage antes do step **SonarCloud Scan**.
