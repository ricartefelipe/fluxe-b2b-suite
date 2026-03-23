# Ramos Git e workflows GitHub Actions (referência factual)

Este documento descreve **apenas** o que está definido nos ficheiros `.github/workflows/*.yml` dos repositórios.  
Não substitui a verificação do separador **Actions** no GitHub (estado de cada execução: sucesso/falha).

---

## Convenção de ramos (Git Flow usado no projeto)

| Ramo | Uso |
|------|-----|
| `feature/*` | Desenvolvimento; integração via PR para `develop`. |
| `develop` | Integração: **CI** do monorepo; **staging** dos fronts via **Railway** (não Cloudflare deste workflow). Backends: imagens GHCR em push. |
| `master` | **Produção**: **Deploy Frontend** (Cloudflare Pages) quando mudam `saas-suite-ui/**`; VPS só com paths em `deploy-prod.yml`; `latest` em GHCR no ramo predefinido. |

---

## 1. Repositório `fluxe-b2b-suite`

### 1.1 `.github/workflows/deploy.yml` (nome do workflow: **CI**)

| Gatilho | Ramos | Filtro de paths |
|---------|--------|-----------------|
| `push` | `master`, `develop` | `saas-suite-ui/**`, `scripts/**`, `docs/**`, `.github/workflows/deploy.yml` |
| `pull_request` | destino `master`, `develop` | idem |
| `workflow_dispatch` | manual | — |

**Efeito:** lint, testes, typecheck, build das 3 apps, E2E Playwright. **Não** faz deploy para Cloudflare nem VPS.

---

### 1.2 `.github/workflows/deploy-frontend.yml` (nome: **Deploy Frontend**)

| Gatilho | Ramos | Filtro de paths |
|---------|--------|-----------------|
| `push` | **`master` apenas** | `saas-suite-ui/**`, `.github/workflows/deploy-frontend.yml` |
| `workflow_dispatch` | manual | — |

**Efeito:** um único job em matrix (shop, ops-portal, admin-console): `pnpm install` → build produção → injeção de `config.json` / `config.keycloak.json` → `wrangler pages deploy` para **Cloudflare Pages** (produção). Não duplica lint/test/E2E (isso fica no workflow **CI**).

**Staging:** não é este ficheiro. Fronts em ambiente de integração: **Railway** com ramo `develop`, ver [URLS-STAGING.md](URLS-STAGING.md).

---

### 1.3 `.github/workflows/deploy-prod.yml` (nome: **Deploy Production**)

| Gatilho | Ramos | Filtro de paths |
|---------|--------|-----------------|
| `push` | **`master` apenas** | `docker-compose.prod.yml`, `deploy/**`, `scripts/**`, `.github/workflows/deploy-prod.yml` |
| `workflow_dispatch` | manual | inputs opcionais de tags de imagem |

**Efeito:** sincronização por SSH para VPS e execução de `scripts/deploy.sh`, mais smoke tests nos serviços no host.

**Conclusão factual:** um push para `master` que **não** altere nenhum dos paths acima **não** dispara este workflow.

---

### 1.4 `saas-suite-ui/.github/workflows/ci.yml` (nome: **CI**)

| Gatilho | Ramos |
|---------|--------|
| `push` | `master`, `develop` |
| `pull_request` | qualquer PR (sem filtro de ramo no ficheiro) |

Usa Nx Cloud / Playwright conforme o próprio workflow.

---

### 1.5 `saas-suite-ui/.github/workflows/sonarcloud.yml` (nome: **SonarCloud**)

| Gatilho | Ramos |
|---------|--------|
| `push` | `master`, `develop` |
| `pull_request` | — |

Requer `SONAR_TOKEN` (e projeto no SonarCloud) para análise completa.

---

## 2. Repositório `node-b2b-orders`

### `ci.yml` (nome: **ci**)

| Gatilho | Ramos |
|---------|--------|
| `push` | `master`, `develop` |
| `pull_request` | destino `master`, `develop` |
| `workflow_dispatch` | manual |

### `build-push.yml` (nome: **Build & Push Docker Images**)

| Gatilho | Ramos |
|---------|--------|
| `push` | `master`, `develop` |
| `workflow_dispatch` | manual |

**Efeito:** build e push para **GHCR** (`ghcr.io/<owner>/node-b2b-orders`), com tags por SHA, nome do ramo e `latest` se o ramo for o predefinido do repositório.

**Conclusão factual:** push em `develop` ou `master` gera imagens; **não** define, por si só, qual servidor as puxa — isso depende de `docker-compose`, Railway, VPS, etc., fora deste ficheiro.

---

## 3. Repositório `py-payments-ledger`

Mesmo padrão que `node-b2b-orders`:

- **`ci.yml`:** `push`/`pull_request` em `master` e `develop`, mais `workflow_dispatch`.
- **`build-push.yml`:** `push` em `master` e `develop`, mais `workflow_dispatch` → GHCR com tags análogas.

---

## 4. Repositório `spring-saas-core`

- **`ci.yml`:** `push`/`pull_request` em `master` e `develop`, mais `workflow_dispatch`.
- **`build-push.yml`:** `push` em `master` e `develop`, mais `workflow_dispatch` → GHCR.

---

## 5. Onde verificar execução (sem suposições)

1. GitHub → repositório → **Actions** → escolher o workflow → última execução no ramo desejado.
2. Cloudflare Dashboard → **Workers & Pages** → projeto (`fluxe-shop`, etc.) → **Deployments** (após push em `master` que dispare **Deploy Frontend** com sucesso).
3. **Railway** (staging): painel do projeto com **branch** `develop` — ver [URLS-STAGING.md](URLS-STAGING.md).
4. VPS: conforme [DEPLOY-GITHUB.md](DEPLOY-GITHUB.md).

---

## 6. Referências aos ficheiros

Qualquer alteração de comportamento deve atualizar **este documento** e os comentários nos YAML correspondentes.
