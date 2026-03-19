# Deploy via GitHub (Actions)

CI/CD do monorepo: workflows em `.github/workflows/`.

O **CI** (`deploy.yml`) corre em push/PR para `develop`/`master` quando mudam `saas-suite-ui/**`, `scripts/**`, `docs/**` ou o próprio workflow. Podes também disparar em **Actions → CI → Run workflow** (`workflow_dispatch`), sem commits artificiais.

> **Nota:** Tentativas antigas de “deploy manual” fora do GitHub (scripts só no disco) foram descartadas; o fluxo oficial é Git + Actions + documentação neste repositório e no **spring-saas-core**.

## Workflows

| Nome no GitHub | Ficheiro | Gatilho | Função |
|----------------|----------|---------|--------|
| **CI** | `deploy.yml` | Push/PR em `develop`/`master` (paths filtrados) ou **Run workflow** | `pnpm install`, lint, test, build das 3 apps (ops-portal, admin-console, shop) |
| **Deploy Frontend** | `deploy-frontend.yml` | Push em `develop`/`master` (paths `saas-suite-ui/**`) ou **Run workflow** | Mesmos testes + deploy para **Cloudflare Pages** (produção em `master`; preview em `develop`) |
| **Deploy Production** | `deploy-prod.yml` | Push em `master` com alterações em `deploy/**`, `docker-compose.prod.yml`, `scripts/**`, ou **Run workflow** | `rsync` para o VPS, `./scripts/deploy.sh`, smoke tests |

## Secrets e variáveis (GitHub)

- **Deploy Frontend**: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; variáveis de ambiente do front (`CORE_API_BASE_URL`, etc.) em **Settings → Variables**.
- **Deploy Production**: `VPS_SSH_KEY`, `VPS_HOST`, `VPS_USER` (environment `production`).

## Relação com o spring-saas-core

O `deploy.sh` no VPS faz `docker pull` das imagens em **GHCR**, incluindo `spring-saas-core`. Essa imagem é publicada pelo workflow **Build & Push** do repositório **spring-saas-core** (push em `develop`/`master`). Garanta que o core foi mergeado e que o workflow correu **antes** ou em conjunto com o deploy do suite.

## Requisitos

- Conta GitHub com **Actions** ativas e **billing** ok (minutos / spending limit).
- Para produção: merge em `master` e, se necessário, executar manualmente **Deploy Production** com tags de imagem nos inputs (`saas_core_tag`, etc.).

## Documentação complementar

- [GUIA-DEPLOY-PASSO-A-PASSO.md](GUIA-DEPLOY-PASSO-A-PASSO.md) — servidor, Docker, domínios, SSL (contexto operacional).
- [PIPELINE-ESTEIRAS.md](PIPELINE-ESTEIRAS.md) — Git Flow e esteiras.
