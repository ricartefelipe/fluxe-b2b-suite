# Regras de Negócio — Fluxe B2B Suite

> Documento de referência com todas as regras de negócio da plataforma Fluxe B2B Suite.
> Atualizado em: março/2026.

---

## Índice

1. [Regras de Multi-Tenancy](#1-regras-de-multi-tenancy)
2. [Regras de Acesso (ABAC/RBAC)](#2-regras-de-acesso-abacrbac)
3. [Regras de Pedidos](#3-regras-de-pedidos)
4. [Regras de Inventário](#4-regras-de-inventário)
5. [Regras de Pagamento](#5-regras-de-pagamento)
6. [Regras de Ledger](#6-regras-de-ledger)
7. [Regras de Webhooks](#7-regras-de-webhooks)
8. [Regras de Auditoria](#8-regras-de-auditoria)
9. [Regras de Feature Flags](#9-regras-de-feature-flags)
10. [Regras de Faturamento](#10-regras-de-faturamento)

---

## 1. Regras de Multi-Tenancy

### 1.1 Isolamento por Tenant

| Regra | Descrição |
|---|---|
| **RN-MT-001** | Todo request HTTP deve conter um `tenantId` válido, extraído do JWT ou header. |
| **RN-MT-002** | Todas as queries ao banco de dados incluem filtro `WHERE tenant_id = ?` — não há acesso cross-tenant. |
| **RN-MT-003** | Eventos de outbox, webhooks, ledger entries e audit logs são sempre particionados por `tenantId`. |
| **RN-MT-004** | O contexto do tenant (`TenantContext`) é propagado via thread-local no spring-saas-core e via header/JWT nos demais serviços. |

### 1.2 Planos e Limites

| Plano | maxUsers | maxProjects | storageGb | Descrição |
|---|---|---|---|---|
| `free` | Limitado | Limitado | Limitado | Plano gratuito com funcionalidades básicas. |
| `pro` | Maior | Maior | Maior | Plano intermediário com recursos avançados. |
| `enterprise` | Ilimitado | Ilimitado | Ilimitado | Plano corporativo com todos os recursos. |

- **RN-MT-005**: Cada plano (`PlanDefinition`) define: `slug`, `displayName`, `monthlyPriceCents`, `yearlyPriceCents`, `maxUsers`, `maxProjects`, `storageGb`.
- **RN-MT-006**: Apenas planos com `active = true` podem ser assinados.
- **RN-MT-007**: Os limites do plano são avaliados nas políticas ABAC — uma policy pode restringir permissões por `allowedPlans`.

### 1.3 Regiões e Restrições Geográficas

- **RN-MT-008**: Cada tenant possui uma `region` (ex.: `BR`, `US`, `EU`).
- **RN-MT-009**: Políticas ABAC podem restringir permissões por `allowedRegions`, impedindo acesso a funcionalidades indisponíveis em determinada região.
- **RN-MT-010**: A região é propagada no contexto do tenant e avaliada em cada decisão de acesso.

### 1.4 Ciclo de Vida do Tenant

```
ACTIVE ──→ SUSPENDED ──→ DELETED
  │                         ▲
  └─────────────────────────┘
```

| Status | Descrição |
|---|---|
| `ACTIVE` | Tenant operacional, todas as funcionalidades disponíveis. |
| `SUSPENDED` | Tenant temporariamente suspenso (ex.: inadimplência). Funcionalidades restritas. |
| `DELETED` | Tenant excluído via soft-delete. Dados preservados para auditoria. |

- **RN-MT-011**: Apenas o método `isActive()` retorna `true` para tenants com status `ACTIVE`.
- **RN-MT-012**: Soft-delete marca o status como `DELETED` e registra um evento `tenant.deleted` no outbox.
- **RN-MT-013**: Toda criação, atualização e exclusão de tenant gera: (a) evento no outbox, (b) log de auditoria, (c) incremento de métrica.

---

## 2. Regras de Acesso (ABAC/RBAC)

### 2.1 Modelo de Políticas

Uma **Policy** define:

| Campo | Tipo | Descrição |
|---|---|---|
| `permissionCode` | string | Código da permissão (ex.: `orders:write`, `audit:read`). |
| `effect` | enum | `ALLOW` ou `DENY`. |
| `allowedPlans` | lista | Planos aos quais a política se aplica. Lista vazia = todos os planos. |
| `allowedRegions` | lista | Regiões às quais a política se aplica. Lista vazia = todas as regiões. |
| `enabled` | boolean | Política só é considerada se `enabled = true`. |

### 2.2 Algoritmo de Avaliação

```
1. Buscar todas as policies habilitadas para o permissionCode solicitado.
2. Se nenhuma policy encontrada → DENY ("no_matching_allow_policy").
3. Iterar sobre as policies:
   a. Se existe policy com effect=DENY que aplica ao (plan, region) → DENY ("denied_by_policy").
4. Verificar se existe pelo menos uma policy com effect=ALLOW que aplica ao (plan, region):
   a. Se não existe → DENY ("no_matching_allow_policy").
   b. Se existe → ALLOW.
```

- **RN-AC-001**: **DENY tem precedência sobre ALLOW** — qualquer policy DENY aplicável bloqueia o acesso, independentemente de quantas policies ALLOW existam.
- **RN-AC-002**: **Default-deny** — se não existir nenhuma policy para a permissão solicitada, o acesso é negado.
- **RN-AC-003**: Policies desabilitadas (`enabled = false`) são ignoradas na avaliação (`appliesTo` retorna `false`).
- **RN-AC-004**: O match de uma policy considera plan E region — ambos devem satisfazer (lista vazia = wildcard).

### 2.3 Contexto de Avaliação (AbacContext)

A cada request, o contexto ABAC é montado a partir do `TenantContext`:

| Campo | Origem |
|---|---|
| `tenantId` | JWT / Header |
| `subject` | JWT (`sub` claim) |
| `permission` | Endpoint / operação |
| `plan` | Plano do tenant (do JWT ou cache) |
| `region` | Região do tenant |
| `correlationId` | Header `X-Correlation-Id` |

### 2.4 Auditoria de Negação

- **RN-AC-005**: Toda negação de acesso (`ACCESS_DENIED`) é auditada com detalhes: permission, plan, region, policy_id, reason.
- **RN-AC-006**: O contador Prometheus `accessDeniedCounter` é incrementado a cada negação.

---

## 3. Regras de Pedidos

### 3.1 Ciclo de Vida do Pedido

```
CREATED ──→ RESERVED ──→ CONFIRMED ──→ PAID ──→ SHIPPED ──→ DELIVERED
   │            │             │          │
   │            │             │          └──→ CANCELLED
   │            │             └──→ CANCELLED
   │            └──→ CANCELLED
   └──→ CANCELLED
```

| Transição | Condição |
|---|---|
| `CREATED → RESERVED` | Inventário reservado com sucesso para todos os itens. |
| `RESERVED → CONFIRMED` | Validação de negócio aprovada. `totalAmount` é calculado. |
| `CONFIRMED → PAID` | Pagamento confirmado (evento `payment.settled` recebido). |
| `PAID → SHIPPED` | Dados de rastreio informados (`trackingCode` obrigatório). |
| `SHIPPED → DELIVERED` | Confirmação de entrega. `deliveredAt` registrado. |
| `* → CANCELLED` | Cancelamento pode ocorrer de qualquer status anterior a `DELIVERED`. |

### 3.2 Validações de Transição

- **RN-PD-001**: Confirmação (`confirmOrder`) só é permitida a partir do status `RESERVED`. Qualquer outro status resulta em `ConflictException`.
- **RN-PD-002**: Envio (`shipOrder`) só é permitido a partir do status `PAID`. Status diferente resulta em `ConflictException`.
- **RN-PD-003**: Entrega (`deliverOrder`) só é permitida a partir do status `SHIPPED`. Status diferente resulta em `ConflictException`.
- **RN-PD-004**: Cancelamento pode ser executado em qualquer status pré-entrega; o pedido é marcado como `CANCELLED`.

### 3.3 Cálculo do Total

- **RN-PD-005**: O `totalAmount` é calculado como `Σ(item.price × item.qty)` para todos os itens do pedido, no momento da confirmação.
- **RN-PD-006**: A moeda padrão é `BRL` (informada no evento `order.confirmed`).

### 3.4 Criação do Pedido

- **RN-PD-007**: Um pedido deve ter ao menos 1 item (`items required`).
- **RN-PD-008**: Cada item possui: `sku`, `qty` (quantidade) e `price` (preço unitário).
- **RN-PD-009**: O pedido é criado com status `CREATED`.

### 3.5 Tracking de Envio

- **RN-PD-010**: Ao enviar um pedido, `trackingCode` é obrigatório.
- **RN-PD-011**: `trackingUrl` é opcional.
- **RN-PD-012**: `shippedAt` é registrado automaticamente com a data/hora do envio.
- **RN-PD-013**: `deliveredAt` é registrado automaticamente com a data/hora da entrega.

### 3.6 Idempotência e Eventos

- **RN-PD-014**: Operações de criação, confirmação, envio e entrega exigem `Idempotency-Key` no header.
- **RN-PD-015**: A chave de idempotência é armazenada no Redis com TTL de 24 horas, no formato `idem:{tenantId}:{operação}:{orderId}:{key}`.
- **RN-PD-016**: Se a chave já foi processada, o resultado cacheado é retornado sem reprocessar.
- **RN-PD-017**: Toda transição de status gera um evento no outbox (ex.: `order.created`, `order.confirmed`, `order.shipped`, `order.delivered`, `order.cancelled`).
- **RN-PD-018**: Toda transição de status gera um log de auditoria.
- **RN-PD-019**: Métricas Prometheus são incrementadas por operação: `ordersCreated`, `ordersConfirmed`, `ordersCancelled`.

### 3.7 Listagem e Busca

- **RN-PD-020**: A listagem de pedidos usa paginação por cursor (keyset pagination).
- **RN-PD-021**: Filtros disponíveis: `status`, `q` (busca textual por customerId, status, SKU, nome do produto), `minAmount`, `maxAmount`, `dateFrom`, `dateTo`.
- **RN-PD-022**: A busca textual (`q`) cruza dados de pedidos e produtos para encontrar resultados por nome do produto.

---

## 4. Regras de Inventário

### 4.1 Modelo de Inventário

Cada `InventoryItem` é identificado pela chave composta `(tenantId, sku)` e mantém:

| Campo | Descrição |
|---|---|
| `availableQty` | Quantidade disponível para venda. |
| `reservedQty` | Quantidade reservada por pedidos pendentes. |

### 4.2 Tipos de Ajuste

| Tipo | Efeito | Descrição |
|---|---|---|
| `IN` | `availableQty += qty` | Entrada de estoque (recebimento, devolução). |
| `OUT` | `availableQty -= qty` | Saída de estoque (venda, perda). |
| `ADJUSTMENT` | `availableQty = qty` | Ajuste absoluto (contagem/inventário). |

- **RN-IN-001**: Ajuste `OUT` requer `availableQty >= qty`. Caso contrário, `ConflictException` com mensagem indicando a quantidade disponível.
- **RN-IN-002**: Ajuste `OUT` em SKU inexistente resulta em `NotFoundException`.
- **RN-IN-003**: Ajuste `IN` ou `ADJUSTMENT` em SKU inexistente cria automaticamente o `InventoryItem` com `availableQty = 0` e `reservedQty = 0`, antes de aplicar o ajuste.
- **RN-IN-004**: O tipo de ajuste é verificado exaustivamente (exhaustive switch) — tipos desconhecidos resultam em `BadRequestException`.

### 4.3 Reserva e Liberação (Integração com Pedidos)

- **RN-IN-005**: Ao confirmar um pedido, o inventário dos itens é reservado: `availableQty -= qty` e `reservedQty += qty`.
- **RN-IN-006**: Ao cancelar um pedido, o inventário reservado é liberado: `reservedQty -= qty` e `availableQty += qty`.

### 4.4 Idempotência

- **RN-IN-007**: Ajustes de inventário aceitam `idempotencyKey` opcional.
- **RN-IN-008**: Quando presente, a chave é armazenada no Redis com TTL de 24h (`idem:{tenantId}:inv-adj:{key}`).
- **RN-IN-009**: A `idempotencyKey` também é persistida no registro de ajuste para rastreabilidade.

### 4.5 Auditoria e Métricas

- **RN-IN-010**: Todo ajuste de inventário gera log de auditoria com: `adjustmentId`, `type`, `qty`, `reason`.
- **RN-IN-011**: Métrica `inventoryAdjusted` é incrementada a cada ajuste, com labels `tenant_id` e `type`.

### 4.6 Listagem

- **RN-IN-012**: A listagem de itens e ajustes usa paginação por cursor.
- **RN-IN-013**: Filtro por `sku` disponível tanto para itens quanto para ajustes.

---

## 5. Regras de Pagamento

### 5.1 Ciclo de Vida do PaymentIntent

```
CREATED ──→ AUTHORIZED ──→ SETTLED
   │             │
   │             ├──→ VOIDED
   │             │
   │             └──→ FAILED
   │
   └──→ FAILED
   └──→ VOIDED
```

| Transição | Condição |
|---|---|
| `CREATED → AUTHORIZED` | Gateway autoriza o pagamento com sucesso. |
| `AUTHORIZED → SETTLED` | Gateway captura o valor; lançamentos no ledger criados. |
| `AUTHORIZED → VOIDED` | Pagamento cancelado antes da captura. |
| `AUTHORIZED → FAILED` | Falha no gateway (ex.: cartão recusado). |
| `CREATED → FAILED` | Falha antes mesmo da autorização. |
| `CREATED → VOIDED` | Cancelamento antes da autorização. |
| `SETTLED → REFUNDED` | Estorno processado (via webhook Stripe). |

### 5.2 Transições Permitidas (Reconciliação via Stripe Webhook)

```python
allowed_transitions = {
    "AUTHORIZED": ["SETTLED", "FAILED", "VOIDED"],
    "SETTLED":    ["REFUNDED"],
    "CREATED":    ["FAILED", "VOIDED"],
}
```

- **RN-PG-001**: Transições fora da tabela acima são silenciosamente ignoradas (log de info, sem erro).

### 5.3 Validações

- **RN-PG-002**: `amount` deve ser > 0; caso contrário, erro 400.
- **RN-PG-003**: `currency` deve ser uma das suportadas: `BRL`, `USD`, `EUR`. Caso contrário, erro 400.
- **RN-PG-004**: Confirmação (`confirm`) só é permitida a partir do status `CREATED`. Status `SETTLED` ou `FAILED` retorna o intent atual sem erro (idempotência).
- **RN-PG-005**: Void só é permitido a partir do status `AUTHORIZED`. Status `VOIDED` retorna o intent atual sem erro (idempotência).
- **RN-PG-006**: Tanto confirm quanto void usam `SELECT ... FOR UPDATE` para garantir consistência sob concorrência.

### 5.4 Integração com Gateways

- **RN-PG-007**: A plataforma suporta múltiplos provedores de gateway: `stripe` (produção) e `fake` (testes/desenvolvimento).
- **RN-PG-008**: Se `stripe_api_key` não estiver configurada, o sistema faz fallback automático para o gateway fake.

#### Multi-Gateway por Tenant

- **RN-PG-009**: Cada tenant pode ter múltiplas configurações de gateway (`GatewayConfig`) com diferentes provedores.
- **RN-PG-010**: A seleção do gateway segue a prioridade:
  1. Se `provider` especificado no request → usa a config desse provider.
  2. Senão → usa a config marcada como `is_default = true` para o tenant.
  3. Se nenhuma config do tenant → usa as configurações globais (`STRIPE_API_KEY`).
- **RN-PG-011**: O gateway pode ser selecionado por `currency` — se a config default não suporta a moeda, busca alternativas do tenant.
- **RN-PG-012**: O gateway pode ser selecionado por `payment_type` — mesma lógica de fallback.
- **RN-PG-013**: A `api_key_ref` da config aponta para uma variável de ambiente, evitando credenciais em banco.

### 5.5 Circuit Breaker

- **RN-PG-014**: O adapter Stripe implementa circuit breaker com os parâmetros:
  - `failure_threshold`: Número de falhas consecutivas para abrir o circuito (padrão: 5).
  - `recovery_timeout`: Tempo em segundos para tentar fechar o circuito (padrão: 30s).
- **RN-PG-015**: Com o circuito aberto, chamadas ao gateway retornam `circuit_open` sem tentar, evitando cascata de falhas.
- **RN-PG-016**: Após `recovery_timeout`, o circuito entra em half-open — a próxima chamada bem-sucedida fecha o circuito.

### 5.6 Retry com Backoff Exponencial

- **RN-PG-017**: Operações no gateway são retentadas automaticamente para erros retryable: `rate_limit`, `api_connection_error`, `api_error`, `timeout`.
- **RN-PG-018**: Máximo de retries configurável (padrão: 3).
- **RN-PG-019**: Delay entre retries: `min(base_delay × 2^attempt + jitter, max_delay)`.
  - `base_delay` padrão: 1.0s
  - `max_delay` padrão: 30.0s
  - Jitter: `random(0, 1)` para evitar thundering herd.
- **RN-PG-020**: Erros não-retryable causam falha imediata e registro no circuit breaker.

### 5.7 Conversão de Moeda

- **RN-PG-021**: Valores são convertidos para minor units antes de enviar ao gateway:

| Moeda | Multiplicador |
|---|---|
| BRL | 100 |
| USD | 100 |
| EUR | 100 |
| JPY | 1 |

### 5.8 Eventos e Auditoria

- **RN-PG-022**: Toda criação, confirmação, settlement e void de PaymentIntent gera:
  - Evento no outbox (ex.: `payment.intent.created`, `payment.authorized`, `payment.settled`, `payment.voided`).
  - Webhook delivery enfileirado para endpoints ativos do tenant.
  - Log de auditoria.
- **RN-PG-023**: Métricas Prometheus: `payment_intents_created_total`, `payment_intents_confirmed_total`, `payment_intents_voided_total`.

---

## 6. Regras de Ledger

### 6.1 Double-Entry (Partidas Dobradas)

- **RN-LD-001**: Cada pagamento liquidado (`SETTLED`) gera um `LedgerEntry` com exatamente **duas linhas**:
  - `DEBIT` na conta de caixa (ex.: `CASH`)
  - `CREDIT` na conta de receita (ex.: `REVENUE`)
- **RN-LD-002**: O valor e a moeda de ambas as linhas são idênticos ao `amount` e `currency` do PaymentIntent.
- **RN-LD-003**: As contas são resolvidas via `AccountConfig` por tenant, permitindo personalização do plano de contas.

### 6.2 Reversão (Void)

- **RN-LD-004**: Ao fazer void de um PaymentIntent que já possui lançamentos no ledger, um lançamento reverso é criado:
  - `DEBIT` em `REVENUE` (reverso do crédito original)
  - `CREDIT` em `CASH` (reverso do débito original)
- **RN-LD-005**: Se não existir lançamento prévio para o PaymentIntent, nenhuma reversão é necessária.

### 6.3 Reconciliação

A reconciliação compara transações do gateway com o estado local dos PaymentIntents.

#### Tipos de Discrepância

| Tipo | Descrição |
|---|---|
| `MISSING_LOCAL` | Transação existe no gateway mas não há PaymentIntent local correspondente. |
| `MISSING_REMOTE` | PaymentIntent local tem `gateway_ref` mas não foi encontrado no gateway. |
| `AMOUNT_MISMATCH` | O valor local difere do valor no gateway. |
| `STATUS_MISMATCH` | O status local não é compatível com o status do gateway. |

- **RN-LD-006**: A reconciliação é executada por tenant, comparando cada `gateway_ref` com o PaymentIntent local.
- **RN-LD-007**: Discrepâncias são persistidas na tabela `ReconciliationDiscrepancy`.
- **RN-LD-008**: O modo `auto_fix` pode corrigir automaticamente `STATUS_MISMATCH`, atualizando o status local para corresponder ao gateway.
- **RN-LD-009**: Mapeamento de status Stripe → local:

| Status Stripe | Status Local |
|---|---|
| `requires_capture` | `AUTHORIZED` |
| `requires_confirmation` | `AUTHORIZED` |
| `succeeded` | `SETTLED` |
| `canceled` | `FAILED` |
| `requires_payment_method` | `FAILED` |

- **RN-LD-010**: Se discrepâncias forem encontradas, um evento `reconciliation.discrepancy_found` é publicado no outbox e webhooks.
- **RN-LD-011**: Discrepâncias podem ser resolvidas manualmente via API (`resolve_discrepancy`), marcando `resolved = true`.
- **RN-LD-012**: A listagem de discrepâncias suporta filtro por `resolved` e é limitada a 200 registros.

---

## 7. Regras de Webhooks

### 7.1 Registro de Endpoints

- **RN-WH-001**: Cada tenant pode registrar múltiplos endpoints de webhook.
- **RN-WH-002**: Ao criar um endpoint, um `secret` (token hex de 32 bytes) é gerado automaticamente para assinatura HMAC.
- **RN-WH-003**: Cada endpoint define uma lista de `events` de interesse (ex.: `["payment.settled", "order.confirmed"]`).
- **RN-WH-004**: O wildcard `"*"` indica que o endpoint recebe todos os tipos de evento.
- **RN-WH-005**: Endpoints podem ser ativados/desativados (`is_active`).
- **RN-WH-006**: Criação e exclusão de endpoints são auditadas.

### 7.2 Assinatura HMAC-SHA256

- **RN-WH-007**: O payload de cada delivery é assinado com o `secret` do endpoint usando `HMAC-SHA256`.
- **RN-WH-008**: A assinatura é enviada no header para que o receptor valide a autenticidade.

### 7.3 Enfileiramento de Deliveries

- **RN-WH-009**: Quando um evento é emitido, o sistema busca todos os endpoints ativos do tenant cujo `events` contenha o tipo do evento (ou `"*"`).
- **RN-WH-010**: Para cada endpoint elegível, um `WebhookDelivery` é criado com status `PENDING`.

### 7.4 Ciclo de Vida da Delivery

```
PENDING ──→ DELIVERED (sucesso)
   │
   └──→ RETRYING ──→ DELIVERED (sucesso em retry)
            │
            └──→ FAILED (após máximo de tentativas)
```

### 7.5 Retry com Backoff

- **RN-WH-011**: Se a delivery falhar, ela entra em status `RETRYING` com atraso progressivo.
- **RN-WH-012**: Delays entre retries (em segundos): `[60, 300, 1800]` — ou seja, 1 min, 5 min, 30 min.
- **RN-WH-013**: Após 3 tentativas (contando a primeira), se todas falharem, a delivery é marcada como `FAILED`.
- **RN-WH-014**: A lógica de claim (`claim_pending_deliveries`) busca deliveries com status `PENDING` ou `RETRYING` cujo `next_retry_at` já passou.
- **RN-WH-015**: Cada tentativa registra: `attempts`, `last_attempt_at`, `response_code`.

---

## 8. Regras de Auditoria

### 8.1 Registro de Eventos

- **RN-AU-001**: Toda ação sensível é registrada no log de auditoria, incluindo:
  - Criação, atualização e exclusão de tenants.
  - Criação, toggle e exclusão de feature flags.
  - Criação, confirmação, envio, entrega e cancelamento de pedidos.
  - Criação, confirmação, void e settlement de pagamentos.
  - Ajustes de inventário.
  - Criação e exclusão de webhook endpoints.
  - Execução de reconciliação.
  - Resolução de discrepâncias.
- **RN-AU-002**: Toda negação de acesso (`ACCESS_DENIED`) é auditada com detalhes da policy e do contexto.

### 8.2 Campos do Audit Log

| Campo | Descrição |
|---|---|
| `tenantId` | Tenant associado à ação. |
| `actorSub` | Subject (usuário) que executou a ação. |
| `actorRoles` | Roles do ator no momento da ação. |
| `actorPerms` | Permissions do ator no momento da ação. |
| `action` | Código da ação (ex.: `order.created`, `ACCESS_DENIED`). |
| `resourceType` | Tipo do recurso afetado (ex.: `Order`, `tenant`, `permission`). |
| `resourceId` | Identificador do recurso afetado. |
| `method` | Método HTTP (quando aplicável). |
| `path` | Path do endpoint (quando aplicável). |
| `statusCode` | Código HTTP da resposta. |
| `correlationId` | ID de correlação para rastreamento distribuído. |
| `details` | Detalhes adicionais em formato livre (JSON string). |

### 8.3 Retenção

- **RN-AU-003**: A retenção de audit logs é configurável via `app.audit.retention-days` (padrão: 90 dias).
- **RN-AU-004**: O job de purge roda diariamente às 02:00 UTC (`cron: 0 0 2 * * *`).
- **RN-AU-005**: A purge é feita em batches de 1.000 registros para evitar locks longos.
- **RN-AU-006**: Se `retention-days <= 0`, a purge é desabilitada.
- **RN-AU-007**: A própria execução da purge é auditada (ação `audit.retention.cleanup`).

### 8.4 Exportação para Compliance

- **RN-AU-008**: Audit logs podem ser exportados via `GET /v1/audit/export` em dois formatos: `json` e `csv`.
- **RN-AU-009**: A exportação exige filtros `from` e `to` para limitar o volume.
- **RN-AU-010**: Máximo de 10.000 registros por requisição de exportação.
- **RN-AU-011**: A exportação usa streaming para não carregar todos os registros em memória.
- **RN-AU-012**: O acesso à exportação requer a permissão `audit:read` avaliada pelo ABAC.

### 8.5 Consulta

- **RN-AU-013**: A listagem de audit logs suporta filtros por: `tenantId`, `action`, `actorSub`, `correlationId`, `from`, `to`.
- **RN-AU-014**: Paginação disponível por cursor (keyset) e por offset.
- **RN-AU-015**: Limite máximo de 100 registros por página.

---

## 9. Regras de Feature Flags

### 9.1 Modelo

Cada `FeatureFlag` é vinculada a um tenant e possui:

| Campo | Descrição |
|---|---|
| `tenantId` | Tenant proprietário da flag. |
| `name` | Nome único da flag dentro do tenant (ex.: `new-checkout-flow`). |
| `enabled` | Se a flag está ativa (`true`) ou inativa (`false`). |
| `rolloutPercent` | Percentual de rollout (0–100). Clamped: `max(0, min(100, valor))`. |
| `allowedRoles` | Lista de roles autorizadas a ver a feature. Lista vazia = todas as roles. |

### 9.2 Regras de Avaliação

- **RN-FF-001**: Flag desabilitada (`enabled = false`) → feature indisponível para todos os usuários do tenant.
- **RN-FF-002**: Flag habilitada com `rolloutPercent < 100` → feature disponível apenas para a porcentagem especificada de usuários.
- **RN-FF-003**: Se `allowedRoles` não está vazia, apenas usuários com uma das roles listadas podem ver a feature.
- **RN-FF-004**: `rolloutPercent` é sempre clampado entre 0 e 100 (inclusive no setter).

### 9.3 Ciclo de Vida

- **RN-FF-005**: Criação de flag usa `createOrResurrect` — se uma flag soft-deleted com o mesmo nome existir, ela é reativada.
- **RN-FF-006**: Atualização permite alterar `enabled`, `rolloutPercent` e `allowedRoles` independentemente (campos nulos são ignorados).
- **RN-FF-007**: Exclusão é soft-delete.
- **RN-FF-008**: Toda operação (create, update, delete) gera:
  - Evento no outbox (`flag.created`, `flag.toggled`, `flag.deleted`).
  - Log de auditoria (`FLAG_CREATED`, `FLAG_UPDATED`, `FLAG_DELETED`).
  - Incremento de métrica `flagsToggledCounter` (apenas em update).

---

## 10. Regras de Faturamento

### 10.1 Definição de Planos

Cada `PlanDefinition` define:

| Campo | Descrição |
|---|---|
| `slug` | Identificador único (ex.: `free`, `pro`, `enterprise`). |
| `displayName` | Nome exibido ao usuário. |
| `description` | Descrição do plano. |
| `monthlyPriceCents` | Preço mensal em centavos. |
| `yearlyPriceCents` | Preço anual em centavos. |
| `maxUsers` | Limite de usuários. |
| `maxProjects` | Limite de projetos. |
| `storageGb` | Limite de armazenamento em GB. |
| `active` | Se o plano está disponível para novas assinaturas. |

- **RN-BL-001**: Apenas planos com `active = true` podem ser assinados. Tentativa de assinar plano inativo resulta em `IllegalArgumentException`.
- **RN-BL-002**: A API `listPlans` retorna apenas planos ativos.

### 10.2 Assinaturas

Cada `Subscription` possui:

| Campo | Descrição |
|---|---|
| `tenantId` | Tenant assinante. |
| `planSlug` | Plano assinado. |
| `status` | Status da assinatura. |
| `currentPeriodStart` | Início do período atual. |
| `currentPeriodEnd` | Fim do período atual. |
| `cancelledAt` | Data de cancelamento (quando aplicável). |

#### Status da Assinatura

| Status | Descrição |
|---|---|
| `ACTIVE` | Assinatura vigente. |
| `PAST_DUE` | Pagamento atrasado. |
| `CANCELLED` | Assinatura cancelada. |
| `TRIALING` | Período de teste. |

### 10.3 Regras de Negócio

- **RN-BL-003**: Ao criar uma nova assinatura, se o tenant já possui uma assinatura ativa, a anterior é cancelada automaticamente (substituição).
- **RN-BL-004**: O período da assinatura é de 30 dias (`currentPeriodEnd = now + 30 days`).
- **RN-BL-005**: Ao criar a assinatura, o campo `plan` do tenant é atualizado para refletir o novo plano.
- **RN-BL-006**: O cancelamento de assinatura registra `cancelledAt` e muda o status para `CANCELLED`.
- **RN-BL-007**: Cada tenant pode ter no máximo uma assinatura ativa por vez.

---

## Glossário

| Termo | Descrição |
|---|---|
| **Tenant** | Organização/empresa cliente da plataforma. Unidade de isolamento. |
| **ABAC** | Attribute-Based Access Control — controle de acesso baseado em atributos. |
| **Outbox** | Padrão transactional outbox para garantia de publicação de eventos. |
| **PaymentIntent** | Intenção de pagamento — representa o ciclo de vida de uma cobrança. |
| **Ledger** | Livro-razão contábil com partidas dobradas. |
| **Circuit Breaker** | Padrão de resiliência que interrompe chamadas a serviços em falha. |
| **Idempotência** | Propriedade que garante que repetir a mesma operação produz o mesmo resultado. |
| **Soft-delete** | Exclusão lógica (marca como deletado sem remover fisicamente). |
| **Reconciliação** | Processo de comparação entre o estado local e o estado no gateway de pagamento. |

---

## Referência de Serviços

| Serviço | Responsabilidade | Stack |
|---|---|---|
| `spring-saas-core` | Tenants, políticas, flags, auditoria, billing, onboarding, JWT | Java / Spring Boot |
| `node-b2b-orders` | Pedidos, produtos, inventário | TypeScript / NestJS / Prisma |
| `py-payments-ledger` | Pagamentos, ledger, reconciliação, webhooks, integração gateway | Python / FastAPI / SQLAlchemy |
