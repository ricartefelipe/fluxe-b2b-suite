# Esteira de CI/CD e onde são feitos os deploys

Resumo do que existe nos quatro repositórios: CI, CD automatizado (imagens + frontend) e como usar.

---

## 1. CI (GitHub Actions)

| Repositório | Workflow | Gatilho | O que roda |
|-------------|----------|---------|------------|
| **fluxe-b2b-suite** | `saas-suite-ui/.github/workflows/ci.yml` | `push` (main), `pull_request` | Nx Cloud, Node 20, `npm ci`, Playwright, `nx run-many -t lint test build typecheck e2e` |
| **node-b2b-orders** | `.github/workflows/ci.yml` | `push`, `pull_request` | Node 20, `npm install`, build, test, export OpenAPI |
| **py-payments-ledger** | `.github/workflows/ci.yml` | `push`, `pull_request` | Python 3.12, ruff, black, mypy, pytest, export OpenAPI |
| **spring-saas-core** | `.github/workflows/ci.yml` | `push` (main/master), `pull_request` | JDK 21, Maven test, spotless, package, Docker build, upload OpenAPI/jacoco |

---

## 2. CD (deploy automatizado)

### 2.1 Backends: imagem no GitHub Container Registry (GHCR)

Nos três backends, **push em `main` ou `master`** (ou execução manual do workflow) dispara:

1. Build da imagem Docker (usando o Dockerfile do repo).
2. Push para **GitHub Container Registry** com as tags `latest` e `<sha>`.

| Repositório | Workflow | Dockerfile | Imagem publicada |
|-------------|----------|------------|-------------------|
| **spring-saas-core** | `.github/workflows/deploy.yml` | `docker/app.Dockerfile` | `ghcr.io/<owner>/spring-saas-core:latest` e `:<sha>` |
| **node-b2b-orders** | `.github/workflows/deploy.yml` | `./Dockerfile` (raiz) | `ghcr.io/<owner>/node-b2b-orders:latest` e `:<sha>` |
| **py-payments-ledger** | `.github/workflows/deploy.yml` | `./docker/api.Dockerfile` | `ghcr.io/<owner>/py-payments-ledger:latest` e `:<sha>` |

- **Nenhum secret obrigatório:** o `GITHUB_TOKEN` do job já tem permissão para publicar no GHCR do próprio repositório.
- Para rodar essas imagens (Railway, ECS, Fly.io, etc.), use a URL da imagem no GHCR e configure variáveis de ambiente conforme o [documento de implantação](documento-implantacao.md).

### 2.2 Frontend: GitHub Pages

No **fluxe-b2b-suite**:

- **Workflow:** `.github/workflows/deploy.yml` (na raiz do repo).
- **Gatilho:** push em `main` ou `master`, ou execução manual.
- **O que faz:** build de produção de **ops-portal**, **admin-console** e **shop** (com `base-href` em subpaths), monta o site estático e faz deploy via **GitHub Pages**.

Para funcionar:

1. No repositório no GitHub: **Settings > Pages > Build and deployment > Source:** **GitHub Actions**.
2. Após o primeiro deploy, o site fica em `https://<owner>.github.io/<repo>/` (ex.: `https://myorg.github.io/fluxe-b2b-suite/`).
3. Rotas: `/ops-portal/`, `/admin-console/`, `/shop/` (página inicial do site lista os três links).

Nenhum secret é necessário; as permissões `pages: write` e `id-token: write` estão no workflow.

---

## 3. Resumo

| Pergunta | Resposta |
|----------|----------|
| **Existe esteira de CI?** | Sim, nos quatro repos (GitHub Actions). |
| **Existe CD / deploy automático?** | Sim. Backends: imagem no GHCR. Frontend: GitHub Pages. |
| **Onde são deployados?** | **Imagens:** GHCR (`ghcr.io`). **Frontend:** GitHub Pages (após ativar Pages no repo). |
| **Secrets obrigatórios?** | Não. `GITHUB_TOKEN` basta para GHCR e Pages. |

### O que foi criado/alterado

- **node-b2b-orders:** `Dockerfile` na raiz (multi-stage Node 20, Prisma, healthcheck em `/v1/healthz`).
- **spring-saas-core:** `.github/workflows/deploy.yml` (build + push para GHCR).
- **node-b2b-orders:** `.github/workflows/deploy.yml` (build + push para GHCR).
- **py-payments-ledger:** `.github/workflows/deploy.yml` (build + push para GHCR; usa `docker/api.Dockerfile` existente).
- **fluxe-b2b-suite:** `.github/workflows/deploy.yml` na raiz (build dos 3 apps + deploy no GitHub Pages).

---

## 4. Usar as imagens fora do GitHub (Railway, AWS, etc.)

- No **Railway:** criar um serviço “Deploy from image” e informar `ghcr.io/<owner>/<repo>:latest` (e configurar variáveis de ambiente).
- Em **AWS ECS/Fargate:** usar a mesma URL de imagem no task definition e configurar secrets no Secrets Manager ou em variáveis de ambiente.
- Migrations (Node/Prisma, Python/Alembic): rodar no startup do container ou como job de release na plataforma (ex.: comando de release no Railway).

Detalhes de variáveis e ordem de implantação: [documento-implantacao.md](documento-implantacao.md) e [E2E-RUN.md](E2E-RUN.md).
