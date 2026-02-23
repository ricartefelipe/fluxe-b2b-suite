# Fluxe B2B Suite

Plataforma B2B multi-tenant para e-commerce, operações e gestão administrativa. Suíte completa desenvolvida com Angular, Nx monorepo e integração com backends Spring/Node/Python.

**Repositório:** [github.com/ricartefelipe/fluxe-b2b-suite](https://github.com/ricartefelipe/fluxe-b2b-suite)

---

## O que é a Suite

- **Shop** — E-commerce Angular com SSR, catálogo de produtos e checkout com pedidos
- **Ops Portal** — Pedidos, inventário, pagamentos e ledger para operações
- **Admin Console** — Tenants, políticas ABAC, feature flags e audit log
- **API** — Backend Express (produtos) e proxy para desenvolvimento local

Integra com:

- **spring-saas-core** (8080) — Tenants, policies, flags, audit
- **node-b2b-orders** (3000) — Pedidos e inventário
- **py-payments-ledger** (8000) — Pagamentos e ledger

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

```bash
# Clone o repositório
git clone https://github.com/ricartefelipe/fluxe-b2b-suite.git
cd fluxe-b2b-suite/saas-suite-ui

# Instale dependências
pnpm install

# Rode a API de produtos (necessária para o shop)
pnpm nx serve api

# Em outro terminal: rode o shop (com SSR e proxy para API)
pnpm nx serve shop

# Ou rode o ops-portal ou admin-console (com Dev Auth para demo)
pnpm nx serve ops-portal
# ou
pnpm nx serve admin-console
```

**URLs após subir:**

- Shop: http://localhost:4200
- Ops Portal: http://localhost:4200 (serve ops-portal)
- Admin Console: http://localhost:4200 (serve admin-console)
- API produtos: http://localhost:3333

---

## Demo em 3 Minutos

1. **Ops Portal**
   - Rode `pnpm nx serve ops-portal`
   - Acesse http://localhost:4200 → tela de login (Dev Auth)
   - Selecione perfil "Super Admin" ou "Ops User" → Login
   - Navegue: Pedidos, Inventário (Ajustes), Pagamentos, Ledger
   - Mostre lista de pedidos e status (CREATED, RESERVED, CONFIRMED etc.)

2. **Admin Console**
   - Rode `pnpm nx serve admin-console`
   - Faça login com Dev Auth
   - Navegue: Tenants, Policies, Feature Flags, Audit Log
   - Mostre CRUD de tenants e toggle de flags

3. **Shop**
   - Rode `pnpm nx serve api` + `pnpm nx serve shop`
   - Acesse catálogo de produtos
   - Mostre produto e checkout (cria pedido com Idempotency-Key)
   - Página "Meus Pedidos"

---

## Configuração e URLs dos Backends

Edite `apps/<app>/public/assets/config.json` (ops-portal e admin-console):

```json
{
  "coreApiBaseUrl": "http://localhost:8080",
  "ordersApiBaseUrl": "http://localhost:3000",
  "paymentsApiBaseUrl": "http://localhost:8000",
  "authMode": "dev",
  "oidc": {
    "issuer": "https://auth.exemplo.com",
    "clientId": "fluxe-b2b",
    "scope": "openid profile email"
  }
}
```

- **authMode:** `dev` = tela de login local com perfis; `oidc` = OAuth2/OIDC real
- Para desenvolvimento local sem backends, use `authMode: "dev"` — as chamadas HTTP falharão mas a UI demonstra os fluxos

---

## Segurança e Ambientes

- **Dev Auth:** Disponível apenas quando `authMode === 'dev'`. Gera JWT local para demos.
- **Produção:** Use `authMode: 'oidc'` e configure issuer/clientId/scope. Dev Auth não deve estar acessível em produção.

---

## Comandos

| Comando | Descrição |
|--------|-----------|
| `pnpm install` | Instala dependências (em saas-suite-ui) |
| `pnpm nx serve shop` | Sobe o shop (depende da API) |
| `pnpm nx serve api` | Sobe API Express (produtos) |
| `pnpm nx serve ops-portal` | Sobe portal de operações |
| `pnpm nx serve admin-console` | Sobe console admin |
| `pnpm nx run-many -t lint,test,build` | Lint, testes e build |
| `pnpm nx e2e shop-e2e` | Testes E2E do shop |
| `pnpm format` | Formata código com Prettier |
| `pnpm lint` | ESLint em todo workspace |

---

## OpenAPI / Documentação dos Serviços

- **spring-saas-core:** `/v1/tenants`, `/v1/policies`, `/v1/tenants/{id}/flags`, `/v1/audit`
- **node-b2b-orders:** `/v1/orders`, `/v1/inventory/adjustments`
- **py-payments-ledger:** `/v1/payment-intents`, `/v1/ledger/entries`, `/v1/ledger/balances`

(Consulte a documentação de cada serviço para specs OpenAPI completas.)

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

## Licença

MIT
