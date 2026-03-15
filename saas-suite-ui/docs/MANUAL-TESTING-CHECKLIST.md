# Checklist de teste manual – tela a tela

Use este checklist após subir o sistema localmente (ou em staging) para validar as telas.

## Pré-requisitos

- Core API rodando (ex.: `spring-saas-core` em `http://localhost:8080` ou proxy `/api/core`)
- Orders API e Payments API (se for testar shop/checkout)
- Admin Console: `pnpm exec nx serve admin-console` → http://localhost:4200
- Ops Portal: `pnpm exec nx serve ops-portal` → http://localhost:4201 (ou 4200 se admin não estiver rodando)
- Shop: `pnpm exec nx serve shop` → http://localhost:4200 (ou outra porta)

---

## Admin Console

- [ ] **Login** – Abre `/login`, preenche email/senha ou usa “Login com Dev”, redireciona para tenants/dashboard/onboarding
- [ ] **Tenants** – Lista tenants, cria novo, edita, (soft) delete
- [ ] **Tenant detail** – Abre detalhe, vê dados, edita nome/plan/region/status
- [ ] **Policies** – Lista políticas, cria, edita, remove
- [ ] **Feature flags** – Lista flags por tenant, cria, liga/desliga
- [ ] **Audit** – Lista audit log, filtra por action/outcome
- [ ] **Users** – Lista usuários do tenant, cria, edita, desativa
- [ ] **Billing** – Abre página de billing/planos sem erro
- [ ] **Onboarding** – Fluxo de onboarding (se aplicável)
- [ ] **Navegação** – Menu lateral e breadcrumbs levam às rotas corretas

---

## Ops Portal

- [ ] **Login** – Login e redirecionamento para dashboard/orders
- [ ] **Dashboard** – Métricas / resumo visíveis
- [ ] **Orders** – Lista de pedidos, filtros, detalhe de um pedido
- [ ] **Navegação** – Links do menu funcionando

---

## Shop

- [ ] **Landing** – Página inicial carrega
- [ ] **Listagem de produtos** – Lista produtos, filtros, paginação, busca
- [ ] **Detalhe do produto** – Abre produto, quantidade, “Adicionar ao carrinho”
- [ ] **Carrinho / Checkout** – Adiciona item, abre carrinho, inicia checkout (se integrado)
- [ ] **Auth** – Login/registro (se aplicável) e guard de rotas

---

## Observações

- Se alguma tela depender de Core API (ex.: lista de tenants), confirme que `CORE_API_BASE_URL` (ou proxy) está correto.
- Em staging, use as URLs do Railway (admin-console-staging, spring-saas-core-staging, etc.).
