# Fluxe B2B Suite

[![CI](https://github.com/ricartefelipe/fluxe-b2b-suite/actions/workflows/deploy.yml/badge.svg)](https://github.com/ricartefelipe/fluxe-b2b-suite/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![Nx](https://img.shields.io/badge/Nx-22.5-143055?logo=nx&logoColor=white)](https://nx.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

Plataforma B2B **multi-tenant** para e-commerce, operações e gestão administrativa. Suíte completa em **Angular** (Nx monorepo) com integração a backends **Spring** (core), **Node** (pedidos) e **Python** (pagamentos).

**Repositório:** [github.com/ricartefelipe/fluxe-b2b-suite](https://github.com/ricartefelipe/fluxe-b2b-suite)

---

## Índice

- [O que é a Suite](#o-que-é-a-suite)
- [Quando usar](#quando-usar)
- [Arquitetura](#arquitetura)
- [Quick Start](#quick-start)
- [URLs após subir](#urls-após-subir)
- [Demo em 3 minutos](#demo-em-3-minutos)
- [Configuração dos backends](#configuração-e-urls-dos-backends)
- [Segurança e ambientes](#segurança-e-ambientes)
- [Comandos](#comandos)
- [OpenAPI e documentação dos serviços](#openapi--documentação-dos-serviços)
- [Estrutura do monorepo](#estrutura-saas-suite-ui)
- [E2E e implantação](#execução-e2e-e-hospedagem)
- [Documentação adicional](#documentação)
- [Licença](#licença)

---

## O que é a Suite

A **Fluxe B2B Suite** reúne três aplicações Angular e uma API auxiliar:

| Aplicação | Descrição |
|-----------|-----------|
| **Shop** | E-commerce Angular com SSR: catálogo de produtos, carrinho e checkout com pedidos (Idempotency-Key). |
| **Ops Portal** | Pedidos, inventário (ajustes), pagamentos e ledger para equipes de operações. |
| **Admin Console** | Tenants, políticas ABAC, feature flags, audit log e onboarding de novos tenants. |
| **API** | Backend Express (produtos) e proxy para desenvolvimento local do Shop. |

### Integração com backends

| Backend | Porta | Responsabilidade |
|---------|-------|------------------|
| **spring-saas-core** | 8080 | Tenants, policies, flags, audit, identidade (JWT). |
| **node-b2b-orders** | 3000 | Pedidos e inventário. |
| **py-payments-ledger** | 8000 | Pagamentos e ledger. |

O frontend obtém o token (em modo dev ou OIDC) e envia nas requisições aos backends; cada backend valida o JWT e aplica ABAC.

---

## Quando usar

- Você precisa de um **frontend unificado** para loja (Shop), operações (Ops Portal) e administração (Admin Console).
- Os backends (spring-saas-core, node-b2b-orders, py-payments-ledger) já estão ou estarão disponíveis.
- Quer **modo dev** com login local (perfis) e **modo produção** com OIDC.
- Deseja rodar **tudo local** com um script (ex.: `./scripts/rodar-local.sh`) ou seguir o [índice de documentação](docs/README.md) (deploy e E2E).

---

## Arquitetura

```
                    ┌─────────────────────────────────────────┐
                    │           Fluxe B2B Suite (Nx)            │
                    └─────────────────────────────────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         │                               │                               │
         ▼                               ▼                               ▼
   ┌───────────┐                 ┌───────────────┐                 ┌─────────────┐
   │   Shop    │                 │  Ops Portal   │                 │Admin Console│
   │ (Angular) │                 │  (Angular)   │                 │ (Angular)   │
   └─────┬─────┘                 └──────┬──────┘                 └──────┬──────┘
         │                               │                               │
         │         ┌─────────────────────┼─────────────────────┐         │
         │         │                     │                     │         │
         ▼         ▼                     ▼                     ▼         ▼
   ┌─────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐
   │ API     │  │ spring-saas  │  │node-b2b-orders│  │   py-payments-ledger    │
   │(Express)│  │   (8080)     │  │    (3000)     │  │       (8000)            │
   └─────────┘  └─────────────┘  └──────────────┘  └─────────────────────────┘
```

---

## Quick Start

### Pré-requisitos

- **Node.js 20+**, **pnpm** (recomendado)
- Backends opcionais para desenvolvimento: pode rodar apenas o frontend com **Dev Auth** (chamadas HTTP falham, mas a UI demonstra os fluxos).

### Passos

```bash
git clone https://github.com/ricartefelipe/fluxe-b2b-suite.git
cd fluxe-b2b-suite/saas-suite-ui

pnpm install

# API de produtos (necessária para o Shop)
pnpm nx serve api

# Em outro terminal: Shop (SSR + proxy para API)
pnpm nx serve shop

# Ou Ops Portal ou Admin Console (Dev Auth para demo)
pnpm nx serve ops-portal
# ou
pnpm nx serve admin-console
```

Para subir **toda a suíte** (backends via Docker + frontend), use o script na raiz do repositório:

```bash
./scripts/rodar-local.sh
```

Requisito: pastas `spring-saas-core`, `node-b2b-orders` e `py-payments-ledger` no mesmo nível que `fluxe-b2b-suite` (ex.: `Documentos/wks/`). Ver [docs/README.md](docs/README.md) e [docs/GUIA-DEPLOY-PASSO-A-PASSO.md](docs/GUIA-DEPLOY-PASSO-A-PASSO.md).

### Rede Docker compartilhada

Todos os 4 projetos da plataforma usam a rede externa `fluxe_shared` para comunicação inter-serviço via Docker. O script `./scripts/up-all.sh` cria a rede automaticamente. Se subir backends individualmente, crie antes:

```bash
docker network create fluxe_shared
```

---

## URLs após subir

| Aplicação | URL (após serve) |
|-----------|-------------------|
| Shop | http://localhost:4200 |
| Ops Portal | http://localhost:4200 (ao rodar `serve ops-portal`) |
| Admin Console | http://localhost:4200 (ao rodar `serve admin-console`) |
| API produtos | http://localhost:3333 |

---

## Demo em 3 minutos

1. **Ops Portal**  
   - `pnpm nx serve ops-portal`  
   - http://localhost:4200 → login (Dev Auth)  
   - Perfis "Super Admin" ou "Ops User" → Pedidos, Inventário, Pagamentos, Ledger  

2. **Admin Console**  
   - `pnpm nx serve admin-console`  
   - Login com Dev Auth  
   - Tenants, Policies, Feature Flags, Audit Log; CRUD de tenants e toggle de flags  

3. **Shop**  
   - `pnpm nx serve api` + `pnpm nx serve shop`  
   - Catálogo, produto, checkout (cria pedido com Idempotency-Key), "Meus Pedidos"  

---

## Configuração e URLs dos backends

Em **modo dev** (`nx serve`), o front usa **URLs relativas** (`/api/core`, `/api/orders`, `/api/payments`) e um **proxy** no dev server encaminha para os backends (8080, 3000, 8000). Não é necessário CORS: as requisições saem para o mesmo host do front e o proxy redireciona.

Arquivos de config:
- `apps/ops-portal/public/assets/config.json`
- `apps/admin-console/public/assets/config.json`
- `apps/shop/public/assets/config.json`

Exemplo (já configurado para dev com proxy):

```json
{
  "coreApiBaseUrl": "/api/core",
  "ordersApiBaseUrl": "/api/orders",
  "paymentsApiBaseUrl": "/api/payments",
  "authMode": "dev",
  "logLevel": "debug"
}
```

- **authMode:** `dev` = login local (Core `/v1/dev/token`); `oidc` = OAuth2/OIDC.
- Para **produção** (build + deploy), use `scripts/inject-frontend-config.sh` com `CORE_API_URL`, `ORDERS_API_URL`, `PAYMENTS_API_URL`; o script grava URLs absolutas no `config.json` do build.

### Como verificar se o front fala com os backends

1. Suba **Core (8080)** e **Orders (3000)** antes do front.
2. Suba o front: `pnpm run dev` ou `pnpm nx serve ops-portal`.
3. Abra o app (ex.: http://localhost:4200), abra **DevTools → Aba Network**.
4. Faça login (modo dev): deve aparecer `POST .../api/core/v1/dev/token` com status 200 e, em seguida, chamadas para `/api/orders/...` ou `/api/core/...`.
5. Se aparecerem requisições para `http://localhost:8080` ou `http://localhost:3000` **diretamente** (e derem CORS ou falha), o proxy não está ativo: confira se está usando `nx serve` (e não abrindo o build estático) e se `proxy.conf.json` está referenciado no `project.json` do app.
6. Se `/assets/config.json` retornar 404, o app usa o fallback (também com `/api/...`), então o proxy ainda deve funcionar.

---

## Segurança e ambientes

### Git, branches e nuvem

| Branch | Deploy (Railway) | Função |
|--------|------------------|--------|
| **`develop`** | **Staging** | **Teste** — validação, QA, integração; não é uso “real” com clientes. |
| **`master`** | **Produção** | **Para valer** — dados e operações reais. |

Documento canónico: [docs/AMBIENTES-CONFIGURACAO.md](docs/AMBIENTES-CONFIGURACAO.md). URLs públicas: [docs/URLS-AMBIENTES.md](docs/URLS-AMBIENTES.md).

### Front e auth

- **Dev Auth:** Apenas quando `authMode === 'dev'`. Gera JWT local para demos.
- **Produção:** Use `authMode: 'oidc'` e configure issuer/clientId/scope. Dev Auth não deve estar acessível em produção.

> **Proteção automática:** Se o Angular estiver em production mode (`ng build` padrão) e `config.json` ainda tiver `authMode: "dev"`, o app força fallback para OIDC e emite um erro no console. Isso evita exposição acidental do Dev Auth em produção. Sempre configure `authMode: "oidc"` no `config.json` de produção.

---

## Comandos

| Comando | Descrição |
|---------|-----------|
| `pnpm install` | Instala dependências (em saas-suite-ui) |
| `pnpm nx serve shop` | Sobe o Shop (depende da API) |
| `pnpm nx serve api` | Sobe API Express (produtos) |
| `pnpm nx serve ops-portal` | Sobe portal de operações |
| `pnpm nx serve admin-console` | Sobe console admin |
| `pnpm nx run-many -t lint,test,build` | Lint, testes e build |
| `pnpm nx e2e shop-e2e` | Testes E2E do Shop |
| `pnpm format` | Formata código (Prettier) |
| `pnpm lint` | ESLint no workspace |

---

## OpenAPI / documentação dos serviços

- **spring-saas-core:** `/v1/tenants`, `/v1/policies`, `/v1/tenants/{id}/flags`, `/v1/audit`
- **node-b2b-orders:** `/v1/orders`, `/v1/inventory/adjustments`
- **py-payments-ledger:** `/v1/payment-intents`, `/v1/ledger/entries`, `/v1/ledger/balances`

Consulte a documentação de cada serviço para specs OpenAPI completas.

---

## Estrutura (saas-suite-ui)

```
saas-suite-ui/
├── apps/
│   ├── shop/           # E-commerce Angular + SSR
│   ├── api/            # API Express (produtos)
│   ├── ops-portal/     # Portal de operações
│   ├── admin-console/  # Console administrativo
│   └── *-e2e/          # Testes E2E (Playwright)
├── libs/
│   ├── shared/         # config, auth, http, ui, telemetry, i18n
│   ├── data-access/    # core, orders, payments
│   └── domains/        # tenancy, admin, ops
├── nx.json
├── tsconfig.base.json
└── eslint.config.mjs
```

---

## Execução E2E e hospedagem

- **Playwright no monorepo (mocks, comandos, CI):** [saas-suite-ui/docs/E2E.md](saas-suite-ui/docs/E2E.md)
- **Rodar os 4 repositórios integrados:** ver [docs/README.md](docs/README.md) e [docs/GUIA-DEPLOY-PASSO-A-PASSO.md](docs/GUIA-DEPLOY-PASSO-A-PASSO.md)
- **Validar backends com Docker:** `./scripts/e2e-integrated.sh`
- **Regras de negócio e implantação:** ver índice em [docs/README.md](docs/README.md) (documentos planejados: regras-de-negocio, documento-implantacao)

---

## Documentação

- [docs/BRANCHES-E-WORKFLOWS.md](docs/BRANCHES-E-WORKFLOWS.md) — Ramos Git e o que cada workflow dispara (só com base nos YAML)
- [docs/README.md](docs/README.md) — **Índice da documentação** (disponível e planejada)
- [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md) — Observabilidade (Sentry, backup)
- [docs/GUIA-DEPLOY-PASSO-A-PASSO.md](docs/GUIA-DEPLOY-PASSO-A-PASSO.md) — Deploy passo a passo
- [docs/VISTORIA-COMPLETA.md](docs/VISTORIA-COMPLETA.md) — Vistoria dos 4 serviços

---

## Licença

MIT — ver [LICENSE](LICENSE).
