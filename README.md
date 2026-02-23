# Union Solutions — B2B Suite

Plataforma B2B para gestão empresarial desenvolvida com Angular e Nx monorepo.

**Autor:** Felipe Ricarte — felipericartem@gmail.com

## Visão Geral

Monorepo com arquitetura modular contendo múltiplas aplicações e bibliotecas compartilhadas:

### Aplicações

| App | Descrição |
|-----|-----------|
| `shop` | Aplicação Angular de e-commerce com SSR (Server-Side Rendering) |
| `api` | API backend com Express e suporte a Docker |
| `ops-portal` | Portal de operações |
| `admin-console` | Console administrativo |

### Bibliotecas

| Biblioteca | Escopo | Descrição |
|------------|--------|-----------|
| `shared/config` | Shared | Configuração da aplicação e runtime config |
| `shared/auth` | Shared | Autenticação OAuth2/OIDC, guards e session management |
| `shared/http` | Shared | HTTP providers, interceptors (auth, tenant, correlation, idempotency, error) |
| `shared/ui` | Shared | Componentes UI reutilizáveis (shell, sidebar, header, dialogs, status chips) |
| `shared/util` | Shared | Utilitários (paginação, datas, UUID, HTTP context tokens) |
| `shared/telemetry` | Shared | Web Vitals, logging e telemetria |
| `shared/i18n` | Shared | Internacionalização (pt-BR) |
| `data-access/core` | Core | API client para tenants, policies, feature flags e audit |
| `data-access/orders` | Orders | Facades para pedidos e inventário |
| `data-access/payments` | Payments | Facades para pagamentos e ledger |
| `domains/tenancy` | Domain | Domínio de multi-tenancy |
| `domains/admin` | Domain | Domínio administrativo |
| `domains/ops` | Domain | Domínio de operações |
| `shop/feature-products` | Shop | Feature de listagem de produtos |
| `shop/feature-product-detail` | Shop | Feature de detalhe de produto |
| `shop/data` | Shop | Data access layer do shop |
| `shop/shared-ui` | Shop | UI compartilhada do shop |
| `api/products` | API | Serviço de produtos da API |

## Quick Start

```bash
pnpm install

pnpm nx serve shop

pnpm nx serve api

pnpm nx run-many -t build

pnpm nx run-many -t test

pnpm nx run-many -t lint

pnpm nx e2e shop-e2e
```

## Estrutura do Projeto

```
├── apps/
│   ├── shop/                  Aplicação e-commerce Angular + SSR
│   ├── shop-e2e/              Testes E2E (Playwright) do shop
│   ├── api/                   API backend Express + Docker
│   ├── ops-portal/            Portal de operações
│   ├── ops-portal-e2e/        Testes E2E do ops-portal
│   ├── admin-console/         Console administrativo
│   └── admin-console-e2e/     Testes E2E do admin-console
├── libs/
│   ├── shared/                Bibliotecas compartilhadas
│   │   ├── config/            Configuração runtime
│   │   ├── auth/              Autenticação e guards
│   │   ├── http/              HTTP client e interceptors
│   │   ├── ui/                Componentes UI
│   │   ├── util/              Utilitários
│   │   ├── telemetry/         Web Vitals e logging
│   │   ├── i18n/              Internacionalização
│   │   └── models/            Modelos compartilhados
│   ├── data-access/           Camada de acesso a dados
│   │   ├── core/              Tenants, policies, flags, audit
│   │   ├── orders/            Pedidos e inventário
│   │   └── payments/          Pagamentos e ledger
│   ├── domains/               Domínios de negócio
│   │   ├── tenancy/           Multi-tenancy
│   │   ├── admin/             Administração
│   │   └── ops/               Operações
│   ├── shop/                  Libs específicas do shop
│   │   ├── feature-products/
│   │   ├── feature-product-detail/
│   │   ├── data/
│   │   └── shared-ui/
│   └── api/
│       └── products/          Serviço de produtos
├── nx.json                    Configuração Nx
├── tsconfig.base.json         TypeScript base config
└── eslint.config.mjs          ESLint config
```

## Module Boundaries

O projeto usa tags para definir fronteiras arquiteturais:

| Tag | Pode importar de |
|-----|-------------------|
| `scope:shop` | `scope:shop`, `scope:shared` |
| `scope:api` | `scope:api`, `scope:shared` |
| `scope:shared` | `scope:shared` |

## Stack Tecnológica

- **Frontend:** Angular 21, Angular Material, Angular CDK
- **Backend:** Express, Node.js
- **Auth:** angular-oauth2-oidc (OAuth2/OIDC)
- **Build:** Nx 22, Vite 7, esbuild
- **Testes:** Vitest (unit), Playwright (E2E)
- **Lint:** ESLint, Prettier
- **Infra:** Docker, SSR com Angular SSR

## Comandos Úteis

```bash
pnpm nx graph                          # Grafo de dependências
pnpm nx show project shop --web        # Detalhes de um projeto
pnpm nx affected -t build              # Build dos projetos afetados
pnpm nx affected -t test               # Testes dos projetos afetados
pnpm nx docker:build api               # Build da imagem Docker
pnpm nx docker:run api                 # Executar container Docker
```

## Licença

MIT — Felipe Ricarte
