# SaaS Suite UI — Monorepo Angular (Fluxe B2B)

Monorepo **Nx** com três aplicações Angular partilhando bibliotecas internas, além de um serviço Node (`api`) usado como fallback local para desenvolvimento.

## Visão geral

| Aplicação | Descrição |
|-----------|-----------|
| **shop** | Loja B2B: catálogo, checkout, SSR (`@angular/ssr`), PWA/service worker. |
| **admin-console** | Consola de administração (tenants, políticas, utilizadores, billing, auditoria, flags). |
| **ops-portal** | Portal operacional (pagamentos, ledger, operações). |
| **api** | API Express **deprecated** (produtos mock); o `serve` do **shop** depende dela em desenvolvimento. Produção/staging usam APIs reais (ver `config.json`). |

Bibliotecas em `libs/` agrupam UI partilhada, autenticação, i18n, acesso a dados (Core, Orders, Payments), domínios (tenancy, admin, ops) e módulos específicos do **shop** (features, dados, PWA, performance).

**Stack:** Angular 21, Nx 22, Vitest (unit), Playwright (E2E), ESLint (flat config), Prettier via Nx.

---

## Pré-requisitos

- **Node.js** 20 (alinhado ao CI do repositório pai `fluxe-b2b-suite`).
- **pnpm** 9 (recomendado; o CI usa `pnpm/action-setup` com lockfile em `pnpm-lock.yaml`).
- Para integração completa com backends locais: serviços em **8080** (Core), **3000** (orders), **8000** (payments), conforme proxies — ver secção de ambiente.

Na raiz deste diretório:

```bash
pnpm install
```

---

## Estrutura do projeto

### Apps (`apps/`)

| Projeto Nx | Pasta | Saída de build (produção) |
|------------|-------|---------------------------|
| `shop` | `apps/shop` | `dist/apps/shop` (SSR: `browser/` + artefactos de servidor) |
| `admin-console` | `apps/admin-console` | `dist/apps/admin-console` |
| `ops-portal` | `apps/ops-portal` | `dist/apps/ops-portal` |
| `api` | `apps/api` | `apps/api/dist` |
| `*-e2e` | `apps/shop-e2e`, `ops-portal-e2e`, `admin-console-e2e` | — (apenas testes) |

### Bibliotecas (`libs/`)

- **`shared/`** — `config`, `auth`, `ui`, `i18n`, `http`, `telemetry`, `util`, `search`, `notifications`, `models` (aliases `@saas-suite/shared/*` e `@union.solutions/models`).
- **`data-access/`** — `core`, `orders`, `payments`.
- **`domains/`** — `tenancy`, `admin`, `ops`.
- **`shop/`** — `data`, `feature-products`, `feature-product-detail`, `shared-ui`, `performance`, `pwa` (aliases `@union.solutions/shop/*`).
- **`api/products`** — lógica de produtos usada pelo mock `api`.

Limites de dependências entre projetos são aplicados pelo ESLint (`@nx/enforce-module-boundaries`) com tags `scope:*` e `type:*` nos `project.json` das libs.

---

## Como rodar localmente

Na pasta `saas-suite-ui`:

| Objetivo | Comando |
|----------|---------|
| Shop (+ API mock em paralelo) | `pnpm run serve:shop` ou `pnpm exec nx serve shop` |
| Admin Console | `pnpm run serve:admin-console` |
| Ops Portal | `pnpm run serve:ops-portal` |
| Só a API mock | `pnpm run serve:api` |

**Portas usuais** (recomendado quando corre os três fronts ao mesmo tempo, alinhado a `scripts/up-all.sh` / `up-local.sh` no repo pai):

| App | Porta |
|-----|-------|
| Shop | **4200** |
| Ops Portal | **4300** (ex.: `pnpm exec nx serve ops-portal -c development --port 4300`) |
| Admin Console | **4400** (ex.: `pnpm exec nx serve admin-console -c development --port 4400`) |
| API mock (`api`) | **3333** (variáveis `HOST` / `PORT` no `apps/api`) |

O **shop** inicia o target `api:serve` automaticamente; o proxy do shop encaminha `/@union.solutions/api` para `http://127.0.0.1:3333` e `/api/core`, `/api/orders`, `/api/payments` para os backends locais indicados em `apps/shop/proxy.conf.json`.

---

## Build

```bash
# Todas as apps com target build
pnpm run build

# Uma app (produção)
pnpm exec nx build shop --configuration=production
pnpm exec nx build admin-console --configuration=production
pnpm exec nx build ops-portal --configuration=production
pnpm exec nx build api
```

- **Shop:** `dist/apps/shop/` — inclui `browser/` (estáticos) e output de SSR conforme `project.json`.
- **admin-console / ops-portal:** `dist/apps/<app>/browser/` para hospedagem estática típica.
- **api:** `apps/api/dist/`.

---

## Testes

**Unitários / Vitest** (Nx):

```bash
pnpm run test
pnpm exec nx test shop
pnpm exec nx test admin-console
```

**Typecheck** (alinhado ao CI):

```bash
pnpm exec nx run-many -t typecheck --projects=ops-portal,admin-console,shop
```

**E2E (Playwright):**

```bash
pnpm run e2e
```

Para E2E com servidores **já** a correr (portas 4200 / 4300 / 4400), use o script do repositório pai:

```bash
# a partir da raiz fluxe-b2b-suite
pnpm run e2e:local
# ou: bash ../scripts/run-e2e-local.sh
```

Cobre `shop-e2e`, `ops-portal-e2e` e `admin-console-e2e` com `BASE_URL` adequado por app.

---

## Lint e formatação

```bash
pnpm run lint              # nx run-many -t lint
pnpm run format            # nx format:write
pnpm run format:check      # nx format:check
```

Configuração ESLint: `eslint.config.mjs` (flat config, regras Nx + Prettier).

---

## Configuração de ambiente em runtime

As apps carregam **`/assets/config.json`** no arranque (`RuntimeConfigService` em `@saas-suite/shared/config`). Se o ficheiro falhar, aplicam-se valores por defeito (`DEFAULT_CONFIG`).

### Formato (`AppConfig`)

Principais campos: `coreApiBaseUrl`, `ordersApiBaseUrl`, `paymentsApiBaseUrl`, `authMode` (`oidc` | `dev` | `hs256`), `oidc` (issuer, clientId, scope), `devAuth` (JWT em modo dev), `logLevel`, `version`, e opcionalmente `supportEmail`, `supportDocsUrl`, `platformDocsUrl`.

### Gerar `config.json` em desenvolvimento

1. **Templates por app:** `apps/<app>/config.template.json` — placeholders `${...}`.
2. **Script:** `scripts/generate-config.sh` — gera `apps/<app>/public/assets/config.json` a partir de variáveis de ambiente (`CORE_API_BASE_URL`, `ORDERS_API_BASE_URL`, `PAYMENTS_API_BASE_URL`, `AUTH_MODE`, OIDC, `LOG_LEVEL`, `APP_VERSION`, etc.).

```bash
bash scripts/generate-config.sh
```

### Build de produção / staging (repo pai)

Após `nx build` com `--configuration=production`, o repositório **fluxe-b2b-suite** disponibiliza `scripts/inject-frontend-config.sh`, que grava `config.json` **no output** (`dist/apps/<app>/browser/assets/`) com URLs absolutas:

- Variáveis típicas: `CORE_API_URL`, `ORDERS_API_URL`, `PAYMENTS_API_URL`, `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `AUTH_MODE`, `APP_VERSION`, e por app `KEYCLOAK_CLIENT_SHOP`, `KEYCLOAK_CLIENT_OPS`, `KEYCLOAK_CLIENT_ADMIN`.

Uso documentado no cabeçalho desse script (executar a partir da raiz do monorepo `fluxe-b2b-suite`).

### Keycloak local (opcional)

Ver `docker/keycloak/README.md` — cópia de `config.keycloak.json` para `public/assets/config.json` quando se testa OIDC localmente.

---

## Deploy

O pipeline, imagens Docker e variáveis por serviço no Railway estão descritos no repositório pai:

**[docs/DEPLOY-RAILWAY.md](../docs/DEPLOY-RAILWAY.md)** (caminho relativo a partir da raiz `fluxe-b2b-suite`).

Inclui serviços `shop` (SSR), `admin-console` e `ops-portal` e a relação com branches `develop` / `master`.

---

## Convenções

- **Estilo:** TypeScript estrito; SCSS nas apps; seguir regras ESLint e limites de módulos Nx (não importar `scope:admin` a partir de `scope:shop`, etc.).
- **Aliases:** `@saas-suite/*` para shared/data/domains internos; `@union.solutions/*` para models, shop e API products — ver `tsconfig.base.json`.
- **i18n:** mensagens em `libs/shared/i18n` (ex.: `pt-br.messages.ts`, `en-us.messages.ts`); tokens centralizados.
- **Componentes partilhados:** `libs/shared/ui` (shell, layout); reutilizar antes de duplicar em apps.
- **Autenticação:** `libs/shared/auth` — modo `dev` vs `oidc` controlado por `config.json`.

Para verificação completa antes de integrar alterações no repositório pai, pode usar `pnpm run verify:all` na raiz `fluxe-b2b-suite` (orquestra lint/testes/checks).
