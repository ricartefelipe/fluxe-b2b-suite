# Regras de Negócio — Fluxe B2B Suite

Resumo das regras de negócio implementadas nos backends e refletidas no frontend.

---

## 1. Autenticação e autorização

- **Identidade:** JWT com claims `sub`, `tid`, `roles`, `perms`, `plan`, `region`. Em modo integrado (E2E), o token é emitido pelo **spring-saas-core** (`/v1/dev/token`) e validado por **node-b2b-orders** e **py-payments-ledger** com o mesmo secret/issuer.
- **Tenant:** Header obrigatório `X-Tenant-Id`; deve coincidir com a claim `tid` do token (exceto para admin global com `tid === '*'`).
- **ABAC (Core):** Políticas por `permission_code` com filtros por plano/região; **DENY tem precedência** sobre ALLOW; **default-deny** quando não há política aplicável.
- **RBAC (Orders/Payments):** Roles (admin, ops, sales, viewer) com permissões fixas (ex.: ops pode orders:rw e inventory:rw; sales só leitura).

---

## 2. Pedidos (node-b2b-orders)

- **Criação:** `POST /v1/orders` exige header **Idempotency-Key**; body com `customerId` e `items[]` (sku, qty, price). Status inicial **CREATED**.
- **Reserva:** Worker consome `order.created`, reserva estoque por tenant. Se estoque insuficiente → pedido **CANCELLED**; senão → **RESERVED**.
- **Confirmação:** `POST /v1/orders/:id/confirm` exige Idempotency-Key; transição **RESERVED → CONFIRMED**. Worker libera reserva e publica `payment.charge_requested` no RabbitMQ.
- **Cancelamento:** `POST /v1/orders/:id/cancel`; possível em CREATED/RESERVED; status → **CANCELLED**.
- **Pagamento:** Worker consome evento `payment.settled` (de py-payments-ledger) e atualiza pedido para **PAID**.
- **Fluxo canônico:** CREATED → RESERVED → CONFIRMED → PAID (ou CANCELLED em qualquer etapa antes de CONFIRMED).

---

## 3. Pagamentos e Ledger (py-payments-ledger)

- **Payment Intent:** `POST /v1/payment-intents` exige Idempotency-Key; body com `amount`, `currency`, `customer_ref`. Status **CREATED**.
- **Confirmação:** `POST /v1/payment-intents/:id/confirm` exige Idempotency-Key; status → **AUTHORIZED**. Worker processa e lança no ledger → **SETTLED**; publica `payment.settled` no RabbitMQ (para orders marcar PAID).
- **Integração com Orders:** Com `ORDERS_INTEGRATION_ENABLED=true`, o worker consome `payment.charge_requested` (e opcionalmente `order.confirmed`), cria PaymentIntent e segue o fluxo até SETTLED e publicação de `payment.settled`.
- **Ledger:** Double-entry; entradas e saldos por conta/tenant; consulta em `/v1/ledger/entries` e `/v1/ledger/balances`.
- **Idempotência:** Operações de escrita exigem Idempotency-Key; respostas repetidas com mesma chave retornam o mesmo resultado.

---

## 4. Inventário (node-b2b-orders)

- **Ajustes:** `POST /v1/inventory/adjustments` com tipo IN/OUT/ADJUSTMENT, `sku`, `qty`, `reason`; exige Idempotency-Key.
- **Consulta:** `GET /v1/inventory` e `GET /v1/inventory/adjustments` com filtros (ex.: `?sku=`). Isolamento por tenant.

---

## 5. Core (spring-saas-core)

- **Tenants:** CRUD com plano, região e status (ACTIVE/SUSPENDED). Soft delete → status SUSPENDED.
- **Políticas:** CRUD de políticas ABAC (permission_code, effect allow/deny, allowedPlans, allowedRegions).
- **Feature flags:** Por tenant; on/off, rollout percentual, targeting por roles.
- **Auditoria:** Todas as ações CRUD e negações (ACCESS_DENIED) registradas; consulta em `/v1/audit` com filtros.

---

## 6. Frontend

- **Login (dev):** Perfis com `tid` e permissões alinhados aos backends; token obtido do Core quando `coreApiBaseUrl` está configurado; fallback para JWT local se Core indisponível.
- **Tenant:** Contexto de tenant enviado em `X-Tenant-Id` em todas as chamadas às APIs; troca de tenant no header/shell quando permitido.
- **Mensagens:** Erros HTTP (401, 403, 404, 409, 429, 5xx) exibidos via snackbar com texto claro e, quando disponível, correlation ID.

Estas regras garantem consistência entre os quatro repositórios e o comportamento esperado ponta a ponta.
