# Histórias de Usuário — Fluxe B2B Suite

Epic: **Plataforma B2B multi-tenant para e-commerce, operações e governança.**

---

## Epic 1: Operações (Ops Portal)

| ID | História | Prioridade | Critérios de aceite |
|----|----------|------------|---------------------|
| OPS-1 | Como **usuário de operações**, quero **listar pedidos** do meu tenant para acompanhar status (CREATED, RESERVED, CONFIRMED, PAID, CANCELLED). | Alta | Lista paginada com filtro por status; colunas: ID, cliente, total, status, data; apenas dados do tenant do usuário. |
| OPS-2 | Como **usuário de operações**, quero **criar um pedido** com itens (SKU, qty, preço) para registrar a venda. | Alta | Formulário com cliente e itens; envio com Idempotency-Key; pedido criado com status CREATED. |
| OPS-3 | Como **usuário de operações**, quero **confirmar um pedido** reservado para liberar reserva e disparar cobrança. | Alta | Botão confirmar em pedido RESERVED; após confirmação status CONFIRMED; em seguida fluxo assíncrono até PAID. |
| OPS-4 | Como **usuário de operações**, quero **listar inventário e ajustes** para controlar estoque. | Alta | Listagem de estoque por SKU; listagem de ajustes (IN/OUT) com filtros; apenas meu tenant. |
| OPS-5 | Como **usuário de operações**, quero **criar ajuste de inventário** (entrada/saída) para corrigir estoque. | Média | Formulário tipo (IN/OUT), SKU, quantidade, motivo; Idempotency-Key; ajuste registrado. |
| OPS-6 | Como **usuário de operações**, quero **ver pagamentos e entradas do ledger** para conciliação. | Média | Listagem de payment intents e de entradas/saldos do ledger; filtros por período; apenas meu tenant. |

---

## Epic 2: Governança (Admin Console)

| ID | História | Prioridade | Critérios de aceite |
|----|----------|------------|---------------------|
| ADM-1 | Como **administrador**, quero **listar e criar tenants** para gerenciar clientes (plano, região, status). | Alta | CRUD de tenants; listagem paginada; soft delete (SUSPENDED). |
| ADM-2 | Como **administrador**, quero **gerenciar políticas ABAC** (permissão, allow/deny, planos/regiões) para controlar acesso. | Alta | CRUD de políticas; DENY tem precedência; default-deny quando não há política. |
| ADM-3 | Como **administrador**, quero **gerenciar feature flags por tenant** (on/off, rollout %) para liberar funcionalidades. | Média | CRUD de flags por tenant; rollout percentual e targeting por roles. |
| ADM-4 | Como **administrador**, quero **consultar o audit log** para auditoria de ações e negações. | Média | Listagem paginada com filtros (tenant, ação, período); inclui ACCESS_DENIED. |

---

## Epic 3: E-commerce (Shop)

| ID | História | Prioridade | Critérios de aceite |
|----|----------|------------|---------------------|
| SHOP-1 | Como **cliente B2B**, quero **navegar o catálogo de produtos** para escolher itens. | Alta | Listagem com filtros (categoria, preço); paginação; dados da API de produtos. |
| SHOP-2 | Como **cliente B2B**, quero **fazer checkout** (criar pedido) com itens do carrinho. | Alta | Checkout com Idempotency-Key; pedido criado; redirecionamento para “Meus Pedidos”. |
| SHOP-3 | Como **cliente B2B**, quero **ver meus pedidos e o status** para acompanhar entrega. | Alta | Listagem de pedidos do usuário/tenant; status visível (CREATED → RESERVED → CONFIRMED → PAID). |

---

## Epic 4: Autenticação e identidade

| ID | História | Prioridade | Critérios de aceite |
|----|----------|------------|---------------------|
| AUTH-1 | Como **usuário**, quero **fazer login** (dev ou OIDC) para acessar a aplicação. | Alta | Login com token aceito por Core, Orders e Payments; sessão e tenant no contexto. |
| AUTH-2 | Como **usuário**, quero **trocar de tenant** (quando permitido) para atuar em outro cliente. | Média | Seletor de tenant no header; chamadas subsequentes com X-Tenant-Id correto. |

---

**Prioridade:** Alta = MVP; Média = pós-MVP.  
**Refinamento:** Critérios de aceite podem ser detalhados com exemplos e regras de validação em backlog.
