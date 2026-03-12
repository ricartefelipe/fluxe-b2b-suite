# Histórias de Usuário — Fluxe B2B Suite

> Documento de referência com todas as histórias de usuário da plataforma Fluxe B2B Suite.
> Organizado por épicos, com critérios de aceitação no formato Gherkin (Dado/Quando/Então).
> Atualizado em: março/2026.

---

## Índice

1. [Personas](#personas)
2. [Epic 1: Gestão de Pedidos](#epic-1-gestão-de-pedidos)
3. [Epic 2: Gestão de Produtos](#epic-2-gestão-de-produtos)
4. [Epic 3: Gestão de Inventário](#epic-3-gestão-de-inventário)
5. [Epic 4: Pagamentos](#epic-4-pagamentos)
6. [Epic 5: Administração de Tenants](#epic-5-administração-de-tenants)
7. [Epic 6: Autenticação e Segurança](#epic-6-autenticação-e-segurança)
8. [Epic 7: Auditoria e Compliance](#epic-7-auditoria-e-compliance)
9. [Epic 8: Webhooks e Integrações](#epic-8-webhooks-e-integrações)
10. [Epic 9: Analytics e IA](#epic-9-analytics-e-ia)
11. [Epic 10: Onboarding e Billing](#epic-10-onboarding-e-billing)
12. [Matriz de Prioridades](#matriz-de-prioridades)

---

## Personas

| Persona | Descrição | Aplicação Principal |
|---|---|---|
| **Lojista** | Comprador B2B que navega o catálogo, realiza pedidos e acompanha entregas e pagamentos. | Shop (:4200) |
| **Operador** | Membro da equipe que gerencia pedidos, inventário, produtos e pagamentos no dia a dia. | Ops Portal (:4300) |
| **Administrador** | Responsável por configurar tenants, políticas ABAC, feature flags, billing e auditoria. | Admin Console (:4400) |
| **Desenvolvedor** | Integrador externo que consome as APIs REST, configura webhooks e monitora entregas. | APIs REST / Webhooks |

---

## Epic 1: Gestão de Pedidos

### US-001 — Criar pedido

| Campo | Valor |
|---|---|
| **ID** | US-001 |
| **Título** | Criar pedido via Shop |
| **Como** | Lojista |
| **Quero** | criar um pedido com os itens do meu carrinho |
| **Para** | formalizar a compra de produtos junto ao fornecedor |
| **Prioridade** | Alta |
| **Serviço(s)** | node-b2b-orders, Shop |

**Critérios de aceitação:**

```gherkin
Cenário: Criar pedido com itens válidos
  Dado que estou autenticado como Lojista no Shop
  E tenho pelo menos 1 item no carrinho com SKU, quantidade e preço
  Quando envio o pedido com um Idempotency-Key válido
  Então o sistema cria o pedido com status "CREATED"
  E retorna o orderId no response 201
  E um evento "order.created" é registrado no outbox
  E um log de auditoria é gravado

Cenário: Rejeitar pedido sem itens
  Dado que estou autenticado como Lojista
  Quando tento criar um pedido sem itens
  Então o sistema retorna erro 400 com detalhes da validação

Cenário: Idempotência na criação
  Dado que já criei um pedido com o Idempotency-Key "abc-123"
  Quando envio novamente o mesmo request com a mesma chave
  Então o sistema retorna o resultado original sem reprocessar
```

---

### US-002 — Listar pedidos

| Campo | Valor |
|---|---|
| **ID** | US-002 |
| **Título** | Listar meus pedidos |
| **Como** | Lojista |
| **Quero** | visualizar a lista dos meus pedidos |
| **Para** | acompanhar o andamento das minhas compras |
| **Prioridade** | Alta |
| **Serviço(s)** | node-b2b-orders, Shop |

**Critérios de aceitação:**

```gherkin
Cenário: Listar pedidos com paginação por cursor
  Dado que estou autenticado como Lojista
  E possuo pedidos registrados no meu tenant
  Quando acesso a lista de pedidos
  Então o sistema retorna pedidos paginados por cursor (keyset pagination)
  E cada pedido exibe: ID, status, data de criação e valor total
  E apenas pedidos do meu tenant são retornados

Cenário: Navegar páginas
  Dado que existem mais pedidos do que o limite por página
  Quando utilizo o cursor da resposta anterior
  Então o sistema retorna a próxima página de pedidos
```

---

### US-003 — Confirmar pedido

| Campo | Valor |
|---|---|
| **ID** | US-003 |
| **Título** | Confirmar pedido reservado |
| **Como** | Operador |
| **Quero** | confirmar um pedido que já teve estoque reservado |
| **Para** | avançar o pedido para cobrança e despacho |
| **Prioridade** | Alta |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Confirmar pedido com status RESERVED
  Dado que existe um pedido com status "RESERVED"
  Quando o Operador confirma o pedido via API com Idempotency-Key
  Então o status muda para "CONFIRMED"
  E o totalAmount é calculado como Σ(item.price × item.qty)
  E um evento "order.confirmed" é registrado no outbox
  E um evento "payment.charge_requested" é publicado no exchange payments.x
  E um log de auditoria é gravado

Cenário: Rejeitar confirmação de pedido com status inválido
  Dado que existe um pedido com status "CREATED"
  Quando o Operador tenta confirmar o pedido
  Então o sistema retorna erro 409 (ConflictException)
```

---

### US-004 — Enviar pedido

| Campo | Valor |
|---|---|
| **ID** | US-004 |
| **Título** | Registrar envio do pedido |
| **Como** | Operador |
| **Quero** | registrar o envio de um pedido pago com dados de rastreio |
| **Para** | que o lojista possa acompanhar a entrega |
| **Prioridade** | Alta |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Enviar pedido pago
  Dado que existe um pedido com status "PAID"
  Quando o Operador registra o envio com trackingCode obrigatório
  Então o status muda para "SHIPPED"
  E o campo shippedAt é registrado automaticamente
  E um evento "order.shipped" é registrado no outbox

Cenário: Rejeitar envio sem trackingCode
  Dado que existe um pedido com status "PAID"
  Quando o Operador tenta enviar sem informar trackingCode
  Então o sistema retorna erro 400

Cenário: Rejeitar envio de pedido não pago
  Dado que existe um pedido com status "CONFIRMED"
  Quando o Operador tenta enviar
  Então o sistema retorna erro 409 (ConflictException)
```

---

### US-005 — Entregar pedido

| Campo | Valor |
|---|---|
| **ID** | US-005 |
| **Título** | Confirmar entrega do pedido |
| **Como** | Operador |
| **Quero** | registrar a entrega de um pedido enviado |
| **Para** | finalizar o ciclo do pedido |
| **Prioridade** | Alta |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Confirmar entrega de pedido enviado
  Dado que existe um pedido com status "SHIPPED"
  Quando o Operador confirma a entrega
  Então o status muda para "DELIVERED"
  E o campo deliveredAt é registrado automaticamente
  E um evento "order.delivered" é registrado no outbox

Cenário: Rejeitar entrega de pedido não enviado
  Dado que existe um pedido com status "PAID"
  Quando o Operador tenta confirmar a entrega
  Então o sistema retorna erro 409 (ConflictException)
```

---

### US-006 — Cancelar pedido

| Campo | Valor |
|---|---|
| **ID** | US-006 |
| **Título** | Cancelar pedido |
| **Como** | Operador |
| **Quero** | cancelar um pedido que ainda não foi entregue |
| **Para** | interromper uma compra inviável e liberar estoque |
| **Prioridade** | Alta |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Cancelar pedido pré-entrega
  Dado que existe um pedido com status "CREATED", "RESERVED", "CONFIRMED" ou "PAID"
  Quando o Operador cancela o pedido
  Então o status muda para "CANCELLED"
  E o inventário reservado é liberado (reservedQty -= qty, availableQty += qty)
  E um evento "order.cancelled" é registrado no outbox
  E um log de auditoria é gravado

Cenário: Rejeitar cancelamento de pedido entregue
  Dado que existe um pedido com status "DELIVERED"
  Quando o Operador tenta cancelar
  Então o sistema retorna erro 409

Cenário: Cancelamento automático por estoque insuficiente
  Dado que um pedido foi criado com status "CREATED"
  E o Worker tenta reservar estoque
  Quando o estoque é insuficiente para algum item
  Então o Worker cancela o pedido automaticamente
  E um evento "order.cancelled" é publicado com reason "insufficient_stock"
```

---

### US-007 — Busca textual de pedidos

| Campo | Valor |
|---|---|
| **ID** | US-007 |
| **Título** | Busca full-text em pedidos |
| **Como** | Operador |
| **Quero** | buscar pedidos por texto livre (ID do cliente, SKU, nome do produto, status) |
| **Para** | localizar rapidamente pedidos específicos |
| **Prioridade** | Média |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Buscar pedido por termo textual
  Dado que estou autenticado como Operador
  Quando faço uma busca com o parâmetro "q" contendo um texto
  Então o sistema retorna pedidos cujo customerId, status, SKU ou nome do produto correspondam
  E os resultados são paginados por cursor
  E apenas pedidos do meu tenant são retornados
```

---

### US-008 — Filtros avançados de pedidos

| Campo | Valor |
|---|---|
| **ID** | US-008 |
| **Título** | Filtrar pedidos por critérios avançados |
| **Como** | Operador |
| **Quero** | filtrar pedidos por status, valor mínimo/máximo e intervalo de datas |
| **Para** | analisar pedidos de forma segmentada |
| **Prioridade** | Média |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Filtrar por status e intervalo de valor
  Dado que estou autenticado como Operador
  Quando filtro pedidos com status "CONFIRMED", minAmount 100 e maxAmount 5000
  Então o sistema retorna apenas pedidos que atendem a todos os filtros

Cenário: Filtrar por intervalo de datas
  Dado que estou autenticado como Operador
  Quando filtro pedidos com dateFrom "2026-01-01" e dateTo "2026-03-31"
  Então o sistema retorna apenas pedidos criados nesse período
```

---

### US-009 — Exportar pedidos

| Campo | Valor |
|---|---|
| **ID** | US-009 |
| **Título** | Exportar lista de pedidos |
| **Como** | Operador |
| **Quero** | exportar pedidos filtrados em formato CSV ou JSON |
| **Para** | gerar relatórios e integrar com ferramentas externas |
| **Prioridade** | Baixa |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Exportar pedidos em JSON
  Dado que estou autenticado como Operador com permissão orders:read
  Quando solicito a exportação de pedidos com filtros aplicados
  Então o sistema retorna um arquivo JSON com os pedidos
  E o streaming é utilizado para não sobrecarregar a memória
```

---

### US-010 — Rastrear pedido

| Campo | Valor |
|---|---|
| **ID** | US-010 |
| **Título** | Rastrear envio do pedido |
| **Como** | Lojista |
| **Quero** | visualizar o código de rastreio e URL de acompanhamento do meu pedido |
| **Para** | saber quando a entrega será realizada |
| **Prioridade** | Alta |
| **Serviço(s)** | node-b2b-orders, Shop |

**Critérios de aceitação:**

```gherkin
Cenário: Visualizar rastreio de pedido enviado
  Dado que possuo um pedido com status "SHIPPED"
  E o pedido possui trackingCode preenchido
  Quando acesso o detalhe do pedido
  Então o sistema exibe o trackingCode
  E exibe o trackingUrl quando disponível
  E exibe a data de envio (shippedAt)

Cenário: Visualizar entrega confirmada
  Dado que possuo um pedido com status "DELIVERED"
  Quando acesso o detalhe do pedido
  Então o sistema exibe o trackingCode, shippedAt e deliveredAt
```

---

## Epic 2: Gestão de Produtos

### US-011 — Cadastrar produto

| Campo | Valor |
|---|---|
| **ID** | US-011 |
| **Título** | Cadastrar novo produto no catálogo |
| **Como** | Operador |
| **Quero** | cadastrar um novo produto com SKU, nome, descrição, preço, categoria e imagem |
| **Para** | disponibilizar o item para compra pelos lojistas |
| **Prioridade** | Alta |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Cadastrar produto válido
  Dado que estou autenticado como Operador com permissão products:write
  Quando envio os dados: sku, name, description, price, currency, category, imageUrl
  Então o sistema cria o produto vinculado ao meu tenant
  E retorna o produto criado com ID
  E um log de auditoria é gravado

Cenário: Rejeitar produto sem campos obrigatórios
  Dado que estou autenticado como Operador
  Quando envio os dados sem sku ou name
  Então o sistema retorna erro 400 com detalhes de validação
```

---

### US-012 — Listar produtos com filtros

| Campo | Valor |
|---|---|
| **ID** | US-012 |
| **Título** | Listar e filtrar catálogo de produtos |
| **Como** | Lojista |
| **Quero** | navegar o catálogo com filtros por categoria, faixa de preço, estoque e busca textual |
| **Para** | encontrar facilmente os produtos que preciso comprar |
| **Prioridade** | Alta |
| **Serviço(s)** | node-b2b-orders, Shop |

**Critérios de aceitação:**

```gherkin
Cenário: Listar produtos por categoria
  Dado que estou autenticado como Lojista
  Quando filtro produtos pela categoria "Eletrônicos"
  Então o sistema retorna apenas produtos dessa categoria
  E os resultados são paginados

Cenário: Busca textual de produtos
  Dado que estou autenticado como Lojista
  Quando busco por "monitor"
  Então o sistema retorna produtos cujo nome ou descrição correspondam ao termo

Cenário: Filtrar por faixa de preço
  Dado que estou autenticado como Lojista
  Quando filtro com preço mínimo 100 e máximo 500
  Então o sistema retorna apenas produtos dentro da faixa
```

---

### US-013 — Atualizar produto

| Campo | Valor |
|---|---|
| **ID** | US-013 |
| **Título** | Atualizar dados de produto |
| **Como** | Operador |
| **Quero** | atualizar campos de um produto existente (nome, preço, descrição, imagem) |
| **Para** | manter o catálogo atualizado |
| **Prioridade** | Alta |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Atualizar preço de produto
  Dado que existe um produto com ID válido no meu tenant
  Quando o Operador atualiza o campo price via PATCH
  Então o sistema persiste a alteração
  E retorna o produto atualizado
  E um log de auditoria é gravado

Cenário: Rejeitar atualização de produto de outro tenant
  Dado que existe um produto pertencente a outro tenant
  Quando o Operador tenta atualizá-lo
  Então o sistema retorna erro 404
```

---

### US-014 — Categorizar produto

| Campo | Valor |
|---|---|
| **ID** | US-014 |
| **Título** | Definir categoria do produto |
| **Como** | Operador |
| **Quero** | atribuir ou alterar a categoria de um produto |
| **Para** | organizar o catálogo e facilitar a navegação do lojista |
| **Prioridade** | Média |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Alterar categoria do produto
  Dado que existe um produto na categoria "Escritório"
  Quando o Operador altera a categoria para "Eletrônicos"
  Então o produto passa a aparecer nos filtros de "Eletrônicos"
  E não aparece mais em "Escritório"

Cenário: Consultar categorias disponíveis
  Dado que estou autenticado
  Quando consulto o endpoint /v1/products/metadata/categories
  Então o sistema retorna a lista de categorias existentes
```

---

### US-015 — Controlar preços

| Campo | Valor |
|---|---|
| **ID** | US-015 |
| **Título** | Gerenciar preços e moeda dos produtos |
| **Como** | Operador |
| **Quero** | definir o preço e a moeda de cada produto |
| **Para** | que os valores estejam corretos no checkout |
| **Prioridade** | Alta |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Definir preço e moeda
  Dado que existe um produto cadastrado
  Quando o Operador atualiza o price para 299.90 e currency para "BRL"
  Então o sistema persiste os novos valores
  E o produto é exibido com o preço atualizado no catálogo

Cenário: Consultar faixa de preço
  Dado que existem produtos no catálogo
  Quando consulto /v1/products/metadata/price-range
  Então o sistema retorna o preço mínimo e máximo do catálogo
```

---

### US-016 — Ativar/desativar produto

| Campo | Valor |
|---|---|
| **ID** | US-016 |
| **Título** | Ativar ou desativar produto no catálogo |
| **Como** | Operador |
| **Quero** | remover temporariamente um produto do catálogo sem excluí-lo |
| **Para** | gerenciar a disponibilidade sem perder dados históricos |
| **Prioridade** | Média |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Desativar produto (soft delete)
  Dado que existe um produto ativo no catálogo
  Quando o Operador executa DELETE no produto
  Então o produto é marcado como inativo via soft-delete
  E não aparece mais na listagem pública do catálogo
  E um log de auditoria é gravado

Cenário: Reativar produto
  Dado que existe um produto desativado
  Quando o Operador solicita a reativação
  Então o produto volta a aparecer no catálogo
```

---

### US-017 — Visualizar detalhe do produto

| Campo | Valor |
|---|---|
| **ID** | US-017 |
| **Título** | Visualizar detalhes de um produto |
| **Como** | Lojista |
| **Quero** | ver todos os detalhes de um produto (nome, descrição, preço, imagem, avaliação, estoque) |
| **Para** | tomar a decisão de compra informada |
| **Prioridade** | Alta |
| **Serviço(s)** | node-b2b-orders, Shop |

**Critérios de aceitação:**

```gherkin
Cenário: Exibir detalhe do produto
  Dado que existe um produto com ID válido no catálogo
  Quando o Lojista acessa /product/:id
  Então o sistema exibe: name, description, price, currency, category, imageUrl, inStock, rating, reviewCount
```

---

### US-018 — Adicionar produto ao carrinho

| Campo | Valor |
|---|---|
| **ID** | US-018 |
| **Título** | Adicionar produto ao carrinho |
| **Como** | Lojista |
| **Quero** | adicionar um ou mais produtos ao carrinho com a quantidade desejada |
| **Para** | montar meu pedido antes de finalizar a compra |
| **Prioridade** | Alta |
| **Serviço(s)** | Shop (frontend) |

**Critérios de aceitação:**

```gherkin
Cenário: Adicionar produto ao carrinho
  Dado que estou na página de detalhe de um produto em estoque
  Quando clico em "Adicionar ao carrinho" com quantidade 3
  Então o produto é adicionado ao carrinho com quantidade 3
  E o carrinho exibe o total atualizado

Cenário: Alterar quantidade no carrinho
  Dado que tenho um produto no carrinho
  Quando altero a quantidade para 5
  Então o carrinho recalcula o subtotal automaticamente
```

---

### US-019 — Finalizar checkout

| Campo | Valor |
|---|---|
| **ID** | US-019 |
| **Título** | Finalizar checkout |
| **Como** | Lojista |
| **Quero** | revisar os itens do carrinho e confirmar a compra |
| **Para** | transformar o carrinho em um pedido formal |
| **Prioridade** | Alta |
| **Serviço(s)** | node-b2b-orders, Shop |

**Critérios de aceitação:**

```gherkin
Cenário: Checkout com sucesso
  Dado que tenho itens no carrinho
  Quando confirmo o checkout
  Então um pedido é criado via POST /v1/orders com Idempotency-Key
  E o sistema redireciona para a página do pedido criado
  E o carrinho é esvaziado

Cenário: Checkout com carrinho vazio
  Dado que meu carrinho está vazio
  Quando tento finalizar o checkout
  Então o sistema exibe mensagem de erro e impede a criação
```

---

### US-020 — Visualizar timeline de status do pedido

| Campo | Valor |
|---|---|
| **ID** | US-020 |
| **Título** | Visualizar timeline completa do pedido |
| **Como** | Operador |
| **Quero** | ver toda a timeline de transições de status de um pedido |
| **Para** | entender o histórico e diagnosticar problemas |
| **Prioridade** | Média |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Timeline do pedido
  Dado que existe um pedido com várias transições de status
  Quando o Operador acessa o detalhe do pedido
  Então o sistema exibe a timeline: CREATED → RESERVED → CONFIRMED → PAID → SHIPPED → DELIVERED
  E cada transição exibe data/hora correspondente
```

---

## Epic 3: Gestão de Inventário

### US-021 — Consultar estoque

| Campo | Valor |
|---|---|
| **ID** | US-021 |
| **Título** | Consultar estoque disponível |
| **Como** | Operador |
| **Quero** | consultar a quantidade disponível e reservada de cada SKU |
| **Para** | planejar reposições e priorizar atendimentos |
| **Prioridade** | Alta |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Listar inventário
  Dado que estou autenticado como Operador com permissão inventory:read
  Quando acesso GET /v1/inventory
  Então o sistema retorna a lista de itens com: sku, availableQty, reservedQty
  E os resultados são paginados por cursor
  E apenas itens do meu tenant são retornados

Cenário: Filtrar por SKU
  Dado que estou autenticado como Operador
  Quando filtro por sku "PROD-001"
  Então o sistema retorna apenas o item de inventário com esse SKU
```

---

### US-022 — Ajustar estoque manualmente (entrada)

| Campo | Valor |
|---|---|
| **ID** | US-022 |
| **Título** | Registrar entrada de estoque |
| **Como** | Operador |
| **Quero** | registrar uma entrada de estoque (tipo IN) para um SKU |
| **Para** | atualizar o saldo disponível após recebimento de mercadoria |
| **Prioridade** | Alta |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Entrada de estoque para SKU existente
  Dado que existe um item de inventário com sku "PROD-001" e availableQty 10
  Quando o Operador registra um ajuste tipo "IN" com qty 20 e reason "Recebimento NF-1234"
  Então o availableQty passa a ser 30
  E um registro de ajuste é gravado com o tipo, quantidade e reason
  E um log de auditoria é gravado
  E a métrica inventoryAdjusted é incrementada

Cenário: Entrada de estoque para SKU inexistente
  Dado que não existe item de inventário com sku "PROD-NEW"
  Quando o Operador registra um ajuste tipo "IN" com qty 50
  Então o sistema cria o InventoryItem com availableQty 0 e reservedQty 0
  E aplica o ajuste, resultando em availableQty 50
```

---

### US-023 — Ajustar estoque manualmente (saída)

| Campo | Valor |
|---|---|
| **ID** | US-023 |
| **Título** | Registrar saída de estoque |
| **Como** | Operador |
| **Quero** | registrar uma saída de estoque (tipo OUT) para um SKU |
| **Para** | contabilizar perdas, devoluções ao fornecedor ou consumo interno |
| **Prioridade** | Alta |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Saída de estoque com saldo suficiente
  Dado que existe um item com sku "PROD-001" e availableQty 30
  Quando o Operador registra um ajuste tipo "OUT" com qty 5
  Então o availableQty passa a ser 25

Cenário: Rejeitar saída com saldo insuficiente
  Dado que existe um item com sku "PROD-001" e availableQty 2
  Quando o Operador registra um ajuste tipo "OUT" com qty 10
  Então o sistema retorna erro 409 (ConflictException) com a quantidade disponível

Cenário: Rejeitar saída para SKU inexistente
  Dado que não existe item de inventário com sku "PROD-INEXISTENTE"
  Quando o Operador tenta registrar um ajuste tipo "OUT"
  Então o sistema retorna erro 404 (NotFoundException)
```

---

### US-024 — Ajustar estoque (correção absoluta)

| Campo | Valor |
|---|---|
| **ID** | US-024 |
| **Título** | Corrigir estoque por contagem física |
| **Como** | Operador |
| **Quero** | definir a quantidade absoluta de estoque (tipo ADJUSTMENT) após contagem |
| **Para** | corrigir divergências entre o estoque físico e o sistêmico |
| **Prioridade** | Média |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Ajuste absoluto de estoque
  Dado que existe um item com sku "PROD-001" e availableQty 30
  Quando o Operador registra um ajuste tipo "ADJUSTMENT" com qty 25
  Então o availableQty é definido como 25 (não soma, substitui)
  E um log de auditoria é gravado com o tipo ADJUSTMENT
```

---

### US-025 — Reserva automática de estoque

| Campo | Valor |
|---|---|
| **ID** | US-025 |
| **Título** | Reservar estoque automaticamente ao criar pedido |
| **Como** | Lojista |
| **Quero** | que o estoque seja reservado automaticamente quando meu pedido é processado |
| **Para** | garantir que os produtos estarão disponíveis quando o pedido for confirmado |
| **Prioridade** | Alta |
| **Serviço(s)** | node-b2b-orders (Worker) |

**Critérios de aceitação:**

```gherkin
Cenário: Reserva automática com sucesso
  Dado que um pedido foi criado com 2 itens (SKU-A: qty 5, SKU-B: qty 3)
  E o estoque de SKU-A tem availableQty >= 5
  E o estoque de SKU-B tem availableQty >= 3
  Quando o Worker processa o evento "order.created"
  Então para cada item: availableQty -= qty e reservedQty += qty
  E o pedido muda para status "RESERVED"
  E um evento "stock.reserved" é publicado

Cenário: Reserva falha por estoque insuficiente
  Dado que um pedido foi criado com item SKU-A: qty 100
  E o estoque de SKU-A tem availableQty = 10
  Quando o Worker tenta reservar
  Então o pedido é cancelado automaticamente
  E um evento "order.cancelled" é publicado com reason "insufficient_stock"
```

---

### US-026 — Liberação automática de estoque ao cancelar

| Campo | Valor |
|---|---|
| **ID** | US-026 |
| **Título** | Liberar estoque reservado ao cancelar pedido |
| **Como** | Operador |
| **Quero** | que o estoque reservado seja devolvido ao disponível quando um pedido é cancelado |
| **Para** | que outros pedidos possam utilizar esses itens |
| **Prioridade** | Alta |
| **Serviço(s)** | node-b2b-orders (Worker) |

**Critérios de aceitação:**

```gherkin
Cenário: Liberação de estoque no cancelamento
  Dado que um pedido com status "RESERVED" possui itens reservados
  Quando o pedido é cancelado
  Então para cada item: reservedQty -= qty e availableQty += qty
  E um evento "stock.released" é publicado
```

---

### US-027 — Idempotência em ajustes de inventário

| Campo | Valor |
|---|---|
| **ID** | US-027 |
| **Título** | Garantir idempotência em ajustes de inventário |
| **Como** | Desenvolvedor |
| **Quero** | enviar ajustes de inventário com idempotencyKey |
| **Para** | evitar ajustes duplicados em caso de retry |
| **Prioridade** | Média |
| **Serviço(s)** | node-b2b-orders |

**Critérios de aceitação:**

```gherkin
Cenário: Ajuste idempotente
  Dado que enviei um ajuste de inventário com idempotencyKey "inv-adj-001"
  Quando envio o mesmo ajuste com a mesma chave novamente
  Então o sistema retorna o resultado original sem reprocessar
  E a chave é armazenada no Redis com TTL de 24h
```

---

### US-028 — Listar histórico de ajustes

| Campo | Valor |
|---|---|
| **ID** | US-028 |
| **Título** | Listar histórico de ajustes de estoque |
| **Como** | Operador |
| **Quero** | consultar o histórico de ajustes de inventário com filtro por SKU |
| **Para** | auditar movimentações e identificar padrões de consumo |
| **Prioridade** | Média |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Listar ajustes com filtro
  Dado que existem ajustes de inventário para múltiplos SKUs
  Quando o Operador acessa GET /v1/inventory/adjustments com filtro sku "PROD-001"
  Então o sistema retorna apenas ajustes do SKU informado
  E cada ajuste exibe: adjustmentId, type, qty, reason, data
  E os resultados são paginados por cursor
```

---

### US-029 — Alertas de estoque baixo

| Campo | Valor |
|---|---|
| **ID** | US-029 |
| **Título** | Receber alerta de estoque baixo |
| **Como** | Operador |
| **Quero** | ser notificado quando o estoque de um SKU atingir nível crítico |
| **Para** | providenciar reposição antes que falte produto |
| **Prioridade** | Média |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Notificação de estoque baixo
  Dado que o availableQty de um item fica abaixo do threshold configurado
  Quando o sistema detecta a condição
  Então uma notificação é exibida no Ops Portal
  E opcionalmente um evento "inventory.low_stock" é publicado
```

---

### US-030 — Previsão de estoque

| Campo | Valor |
|---|---|
| **ID** | US-030 |
| **Título** | Visualizar previsão de estoque |
| **Como** | Operador |
| **Quero** | visualizar projeções de consumo de estoque baseadas em histórico |
| **Para** | planejar compras com antecedência e evitar rupturas |
| **Prioridade** | Baixa |
| **Serviço(s)** | node-b2b-orders, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Projeção de consumo
  Dado que existem dados históricos de ajustes e pedidos para o SKU "PROD-001"
  Quando o Operador consulta a previsão de estoque
  Então o sistema exibe uma projeção estimada de dias até ruptura
  E exibe a tendência de consumo (diário/semanal)
```

---

## Epic 4: Pagamentos

### US-031 — Processar pagamento

| Campo | Valor |
|---|---|
| **ID** | US-031 |
| **Título** | Criar payment intent |
| **Como** | Operador |
| **Quero** | criar uma intenção de pagamento com valor, moeda e referência do cliente |
| **Para** | iniciar o fluxo de cobrança de um pedido |
| **Prioridade** | Alta |
| **Serviço(s)** | py-payments-ledger, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Criar payment intent válido
  Dado que estou autenticado como Operador com permissão payments:write
  Quando envio POST /v1/payment-intents com amount > 0, currency "BRL" e Idempotency-Key
  Então o sistema cria o PaymentIntent com status "CREATED"
  E o gateway é acionado para autorização
  E um evento "payment.intent.created" é registrado no outbox
  E um log de auditoria é gravado

Cenário: Rejeitar amount inválido
  Dado que estou autenticado como Operador
  Quando envio POST /v1/payment-intents com amount = 0
  Então o sistema retorna erro 400

Cenário: Rejeitar moeda não suportada
  Dado que estou autenticado como Operador
  Quando envio POST /v1/payment-intents com currency "GBP"
  Então o sistema retorna erro 400 (moedas aceitas: BRL, USD, EUR)
```

---

### US-032 — Consultar status do pagamento

| Campo | Valor |
|---|---|
| **ID** | US-032 |
| **Título** | Consultar status de um payment intent |
| **Como** | Operador |
| **Quero** | consultar o status atual de um pagamento |
| **Para** | acompanhar o andamento da cobrança |
| **Prioridade** | Alta |
| **Serviço(s)** | py-payments-ledger, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Consultar payment intent existente
  Dado que existe um PaymentIntent com ID válido no meu tenant
  Quando acesso GET /v1/payment-intents/{id}
  Então o sistema retorna: id, amount, currency, status, customer_ref, gateway_ref, created_at

Cenário: Rejeitar consulta cross-tenant
  Dado que existe um PaymentIntent de outro tenant
  Quando tento consultar pelo ID
  Então o sistema retorna erro 404
```

---

### US-033 — Confirmar pagamento (authorize)

| Campo | Valor |
|---|---|
| **ID** | US-033 |
| **Título** | Confirmar (autorizar) payment intent |
| **Como** | Operador |
| **Quero** | confirmar um pagamento pendente para que o gateway autorize a cobrança |
| **Para** | avançar o pagamento no ciclo de vida |
| **Prioridade** | Alta |
| **Serviço(s)** | py-payments-ledger, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Confirmar pagamento com status CREATED
  Dado que existe um PaymentIntent com status "CREATED"
  Quando o Operador confirma via POST /v1/payment-intents/{id}/confirm com Idempotency-Key
  Então o gateway autoriza a cobrança
  E o status muda para "AUTHORIZED"
  E um evento "payment.authorized" é registrado no outbox

Cenário: Idempotência em confirmação
  Dado que um PaymentIntent já está em status "SETTLED"
  Quando o Operador tenta confirmar novamente
  Então o sistema retorna o intent atual sem erro (idempotente)

Cenário: Consistência sob concorrência
  Dado que dois requests simultâneos tentam confirmar o mesmo PaymentIntent
  Quando ambos atingem o banco
  Então SELECT ... FOR UPDATE garante que apenas um processa
  E o segundo recebe o resultado do primeiro (idempotência)
```

---

### US-034 — Liquidar pagamento (settle)

| Campo | Valor |
|---|---|
| **ID** | US-034 |
| **Título** | Liquidar pagamento autorizado |
| **Como** | Operador |
| **Quero** | que pagamentos autorizados sejam liquidados automaticamente |
| **Para** | que o valor seja capturado e registrado no ledger |
| **Prioridade** | Alta |
| **Serviço(s)** | py-payments-ledger (Worker) |

**Critérios de aceitação:**

```gherkin
Cenário: Settlement automático
  Dado que existe um PaymentIntent com status "AUTHORIZED"
  Quando o Worker processa o evento "payment.authorized"
  Então o gateway captura o valor
  E o status muda para "SETTLED"
  E um LedgerEntry é criado com DEBIT em CASH e CREDIT em REVENUE
  E um evento "payment.settled" é publicado no outbox
  E o pedido associado é atualizado para "PAID" via evento

Cenário: Conversão de moeda
  Dado que o PaymentIntent tem currency "BRL" e amount 150.00
  Quando o sistema envia ao gateway
  Então o valor é convertido para minor units: 15000 centavos
```

---

### US-035 — Estornar pagamento (refund)

| Campo | Valor |
|---|---|
| **ID** | US-035 |
| **Título** | Processar reembolso |
| **Como** | Operador |
| **Quero** | solicitar o reembolso total ou parcial de um pagamento liquidado |
| **Para** | devolver o valor ao cliente em caso de cancelamento ou problema |
| **Prioridade** | Alta |
| **Serviço(s)** | py-payments-ledger, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Reembolso total
  Dado que existe um PaymentIntent com status "SETTLED" e amount 500.00
  Quando o Operador solicita refund via POST /v1/payment-intents/{id}/refund com amount 500.00
  Então o gateway processa o reembolso
  E o status muda para "REFUNDED"
  E um LedgerEntry reverso é criado (DEBIT REFUND_EXPENSE, CREDIT CASH)
  E um evento "payment.refunded" é publicado
  E webhook delivery é enfileirado

Cenário: Reembolso parcial
  Dado que existe um PaymentIntent com status "SETTLED" e amount 500.00
  Quando o Operador solicita refund com amount 200.00
  Então o gateway processa o reembolso parcial
  E o status muda para "PARTIALLY_REFUNDED"
```

---

### US-036 — Conciliar pagamentos

| Campo | Valor |
|---|---|
| **ID** | US-036 |
| **Título** | Executar reconciliação com gateway |
| **Como** | Administrador |
| **Quero** | executar a reconciliação entre os pagamentos locais e o gateway (Stripe) |
| **Para** | identificar e resolver divergências financeiras |
| **Prioridade** | Alta |
| **Serviço(s)** | py-payments-ledger, Admin Console |

**Critérios de aceitação:**

```gherkin
Cenário: Reconciliação sem discrepâncias
  Dado que todos os PaymentIntents locais correspondem ao gateway
  Quando o Administrador executa POST /v1/reconciliation/run
  Então o sistema informa que não há discrepâncias

Cenário: Reconciliação com discrepâncias
  Dado que existem pagamentos com status divergente entre local e gateway
  Quando a reconciliação é executada
  Então as discrepâncias são persistidas na tabela ReconciliationDiscrepancy
  E cada discrepância é tipada: MISSING_LOCAL, MISSING_REMOTE, AMOUNT_MISMATCH ou STATUS_MISMATCH
  E um evento "reconciliation.discrepancy_found" é publicado no outbox

Cenário: Auto-fix de STATUS_MISMATCH
  Dado que a reconciliação é executada com modo auto_fix ativado
  E existe um STATUS_MISMATCH para um PaymentIntent
  Quando o auto_fix processa
  Então o status local é atualizado para corresponder ao gateway
```

---

### US-037 — Multi-gateway por tenant

| Campo | Valor |
|---|---|
| **ID** | US-037 |
| **Título** | Configurar múltiplos gateways de pagamento |
| **Como** | Administrador |
| **Quero** | configurar múltiplos provedores de gateway (Stripe, fake) para o meu tenant |
| **Para** | ter flexibilidade na escolha do gateway por moeda ou tipo de pagamento |
| **Prioridade** | Média |
| **Serviço(s)** | py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Seleção de gateway por provider
  Dado que o tenant possui configs para "stripe" e "fake"
  Quando o request especifica provider "stripe"
  Então o sistema utiliza a config do Stripe

Cenário: Fallback para gateway default
  Dado que o tenant possui uma config marcada como is_default = true
  Quando o request não especifica provider
  Então o sistema utiliza a config default do tenant

Cenário: Fallback para config global
  Dado que o tenant não possui nenhuma GatewayConfig
  Quando um pagamento é processado
  Então o sistema utiliza a STRIPE_API_KEY global
```

---

### US-038 — Void (cancelar pagamento antes da captura)

| Campo | Valor |
|---|---|
| **ID** | US-038 |
| **Título** | Cancelar pagamento autorizado (void) |
| **Como** | Operador |
| **Quero** | cancelar um pagamento autorizado antes da captura |
| **Para** | interromper uma cobrança indevida antes que o valor seja capturado |
| **Prioridade** | Alta |
| **Serviço(s)** | py-payments-ledger, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Void de pagamento autorizado
  Dado que existe um PaymentIntent com status "AUTHORIZED"
  Quando o Operador solicita void
  Então o status muda para "VOIDED"
  E se existem lançamentos no ledger, um lançamento reverso é criado
  E um evento "payment.voided" é registrado no outbox

Cenário: Void idempotente
  Dado que existe um PaymentIntent com status "VOIDED"
  Quando o Operador tenta void novamente
  Então o sistema retorna o intent atual sem erro
```

---

### US-039 — Retry automático no gateway

| Campo | Valor |
|---|---|
| **ID** | US-039 |
| **Título** | Retry automático para erros transientes do gateway |
| **Como** | Desenvolvedor |
| **Quero** | que o sistema faça retry automático com backoff exponencial para erros retryable do gateway |
| **Para** | garantir resiliência contra falhas intermitentes do Stripe |
| **Prioridade** | Média |
| **Serviço(s)** | py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Retry em rate_limit
  Dado que o gateway retorna erro "rate_limit"
  Quando o sistema detecta o erro retryable
  Então o sistema retenta até 3 vezes com backoff exponencial
  E o delay segue: min(base_delay × 2^attempt + jitter, max_delay)
  E jitter aleatório é adicionado para evitar thundering herd

Cenário: Circuit breaker aberto
  Dado que o gateway falhou 5 vezes consecutivas
  Quando o circuit breaker abre
  Então chamadas subsequentes retornam "circuit_open" sem tentar
  E após 30s de recovery_timeout, o circuito entra em half-open

Cenário: Falha não-retryable
  Dado que o gateway retorna erro "card_declined"
  Quando o sistema detecta o erro não-retryable
  Então o sistema registra falha imediata sem retry
  E o circuit breaker é notificado
```

---

### US-040 — Consultar saldos contábeis

| Campo | Valor |
|---|---|
| **ID** | US-040 |
| **Título** | Consultar saldos por conta contábil |
| **Como** | Operador |
| **Quero** | consultar os saldos de cada conta contábil (CASH, REVENUE, REFUND_EXPENSE) |
| **Para** | ter visibilidade da posição financeira do tenant |
| **Prioridade** | Média |
| **Serviço(s)** | py-payments-ledger, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Consultar saldos
  Dado que existem lançamentos no ledger do meu tenant
  Quando acesso GET /v1/ledger/balances
  Então o sistema retorna o saldo de cada conta contábil
  E os valores refletem todos os DEBIT e CREDIT registrados

Cenário: Consultar entradas contábeis
  Dado que existem lançamentos no ledger
  Quando acesso GET /v1/ledger/entries com filtro de data
  Então o sistema retorna as entradas com: entry_id, payment_intent_id, lines (side, account, amount)
```

---

## Epic 5: Administração de Tenants

### US-041 — Criar tenant

| Campo | Valor |
|---|---|
| **ID** | US-041 |
| **Título** | Criar novo tenant na plataforma |
| **Como** | Administrador |
| **Quero** | criar um novo tenant com nome, plano e região |
| **Para** | onboardar uma nova empresa na plataforma |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core, Admin Console |

**Critérios de aceitação:**

```gherkin
Cenário: Criar tenant com sucesso
  Dado que estou autenticado como Administrador com permissão tenants:write
  Quando envio POST /v1/tenants com name, plan (free/pro/enterprise) e region (BR/US/EU)
  Então o sistema cria o tenant com status "ACTIVE"
  E políticas ABAC default são criadas automaticamente
  E feature flags default são criadas
  E um evento "tenant.created" é registrado no outbox
  E o evento é consumido por node-b2b-orders e py-payments-ledger
  E um log de auditoria é gravado
  E a métrica saas_tenants_created_total é incrementada

Cenário: Propagar tenant para serviços downstream
  Dado que um tenant foi criado no spring-saas-core
  Quando o evento "tenant.created" é consumido
  Então node-b2b-orders registra a configuração do tenant
  E py-payments-ledger cria o tenant local com contas contábeis padrão (CASH, REVENUE, REFUND_EXPENSE)
```

---

### US-042 — Configurar plano do tenant

| Campo | Valor |
|---|---|
| **ID** | US-042 |
| **Título** | Definir ou alterar o plano do tenant |
| **Como** | Administrador |
| **Quero** | configurar o plano (free, pro, enterprise) de um tenant |
| **Para** | definir os limites e funcionalidades disponíveis |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core, Admin Console |

**Critérios de aceitação:**

```gherkin
Cenário: Alterar plano do tenant
  Dado que existe um tenant com plano "free"
  Quando o Administrador atualiza o plano para "pro"
  Então o campo plan do tenant é atualizado
  E um evento "tenant.updated" é publicado
  E as políticas ABAC são reavaliadas com o novo plano
  E os limites de rate limiting mudam para o novo plano

Cenário: Limites do plano
  Dado que o tenant está no plano "free"
  Então os limites de rate limiting são 60 req/min
  E políticas ABAC com allowedPlans restrito podem negar acesso a funcionalidades premium
```

---

### US-043 — Definir políticas ABAC

| Campo | Valor |
|---|---|
| **ID** | US-043 |
| **Título** | Criar e gerenciar políticas ABAC |
| **Como** | Administrador |
| **Quero** | criar, listar, atualizar e desativar políticas ABAC |
| **Para** | controlar de forma granular quem pode acessar o quê em cada plano e região |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core, Admin Console |

**Critérios de aceitação:**

```gherkin
Cenário: Criar política ALLOW
  Dado que estou autenticado como Administrador com permissão policies:write
  Quando crio uma política com permissionCode "orders:write", effect "ALLOW", allowedPlans ["pro", "enterprise"]
  Então a política é criada como habilitada
  E um evento "policy.created" é publicado
  E um log de auditoria é gravado

Cenário: DENY tem precedência sobre ALLOW
  Dado que existe uma política ALLOW para "orders:write" nos planos pro e enterprise
  E existe uma política DENY para "orders:write" na região EU
  Quando um usuário do plano pro na região EU tenta acessar
  Então o acesso é negado (DENY tem precedência)
  E a negação é auditada com detalhes: permission, plan, region, policy_id, reason

Cenário: Default-deny sem política
  Dado que não existe nenhuma política para a permissão "analytics:read"
  Quando um usuário tenta acessar analytics
  Então o acesso é negado por default-deny
  E a negação é auditada com reason "no_matching_allow_policy"
```

---

### US-044 — Gerenciar feature flags

| Campo | Valor |
|---|---|
| **ID** | US-044 |
| **Título** | Criar e controlar feature flags |
| **Como** | Administrador |
| **Quero** | criar, ativar/desativar, definir rollout e roles de feature flags por tenant |
| **Para** | controlar a disponibilidade de funcionalidades de forma gradual e segura |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core, Admin Console |

**Critérios de aceitação:**

```gherkin
Cenário: Criar feature flag
  Dado que estou autenticado como Administrador com permissão flags:write
  Quando crio uma flag com name "new-checkout-flow", enabled true, rolloutPercent 50
  Então a flag é criada vinculada ao tenant
  E um evento "flag.created" é publicado
  E um log de auditoria é gravado

Cenário: Rollout parcial
  Dado que a flag "new-checkout-flow" está habilitada com rolloutPercent 30
  Quando o sistema avalia a flag para um usuário
  Então apenas ~30% dos usuários veem a funcionalidade

Cenário: Restrição por role
  Dado que a flag "admin-beta" possui allowedRoles ["admin"]
  Quando um usuário com role "ops" consulta a flag
  Então a feature não está disponível para esse usuário

Cenário: Soft-delete e resurrect
  Dado que a flag "old-feature" foi soft-deleted
  Quando o Administrador cria uma nova flag com o mesmo nome
  Então a flag existente é reativada em vez de criar duplicata

Cenário: Clamping de rolloutPercent
  Dado que o Administrador define rolloutPercent como 150
  Quando o valor é persistido
  Então o sistema clampeia para 100
```

---

### US-045 — Suspender tenant

| Campo | Valor |
|---|---|
| **ID** | US-045 |
| **Título** | Suspender tenant inadimplente |
| **Como** | Administrador |
| **Quero** | suspender temporariamente um tenant |
| **Para** | restringir acesso em caso de inadimplência ou violação de termos |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core, Admin Console |

**Critérios de aceitação:**

```gherkin
Cenário: Suspender tenant ativo
  Dado que existe um tenant com status "ACTIVE"
  Quando o Administrador altera o status para "SUSPENDED"
  Então o tenant não pode mais operar normalmente
  E um evento "tenant.suspended" é publicado
  E os serviços downstream bloqueiam operações para esse tenant
  E um log de auditoria é gravado

Cenário: isActive() retorna false para suspenso
  Dado que um tenant está com status "SUSPENDED"
  Quando isActive() é verificado
  Então retorna false
```

---

### US-046 — Reativar tenant

| Campo | Valor |
|---|---|
| **ID** | US-046 |
| **Título** | Reativar tenant suspenso |
| **Como** | Administrador |
| **Quero** | reativar um tenant previamente suspenso |
| **Para** | restaurar o acesso após regularização |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core, Admin Console |

**Critérios de aceitação:**

```gherkin
Cenário: Reativar tenant
  Dado que existe um tenant com status "SUSPENDED"
  Quando o Administrador altera o status para "ACTIVE"
  Então o tenant volta a operar normalmente
  E um evento "tenant.reactivated" é publicado
  E os serviços downstream desbloqueiam operações
```

---

### US-047 — Excluir tenant (soft delete)

| Campo | Valor |
|---|---|
| **ID** | US-047 |
| **Título** | Excluir tenant via soft delete |
| **Como** | Administrador |
| **Quero** | excluir logicamente um tenant |
| **Para** | remover acesso permanentemente mantendo dados para auditoria |
| **Prioridade** | Média |
| **Serviço(s)** | spring-saas-core, Admin Console |

**Critérios de aceitação:**

```gherkin
Cenário: Soft delete de tenant
  Dado que existe um tenant com status "ACTIVE" ou "SUSPENDED"
  Quando o Administrador executa DELETE /v1/tenants/{id}
  Então o status muda para "DELETED"
  E um evento "tenant.deleted" é publicado
  E os dados são preservados para auditoria
  E um log de auditoria é gravado
```

---

### US-048 — Listar tenants

| Campo | Valor |
|---|---|
| **ID** | US-048 |
| **Título** | Listar todos os tenants |
| **Como** | Administrador |
| **Quero** | visualizar a lista de todos os tenants com seus planos, regiões e status |
| **Para** | ter visibilidade da base de clientes |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core, Admin Console |

**Critérios de aceitação:**

```gherkin
Cenário: Listar tenants com paginação
  Dado que estou autenticado como Administrador com permissão tenants:read
  Quando acesso GET /v1/tenants
  Então o sistema retorna a lista paginada por cursor
  E cada tenant exibe: id, name, plan, region, status
```

---

### US-049 — Visualizar snapshot do tenant

| Campo | Valor |
|---|---|
| **ID** | US-049 |
| **Título** | Consultar snapshot completo do tenant |
| **Como** | Administrador |
| **Quero** | visualizar o snapshot de um tenant com todas as suas políticas e flags |
| **Para** | ter uma visão completa da configuração do tenant para diagnóstico |
| **Prioridade** | Média |
| **Serviço(s)** | spring-saas-core, Admin Console |

**Critérios de aceitação:**

```gherkin
Cenário: Consultar snapshot
  Dado que existe um tenant com políticas e flags configuradas
  Quando acesso GET /v1/tenants/{id}/snapshot
  Então o sistema retorna: dados do tenant, lista de policies, lista de feature flags
```

---

### US-050 — Configurar região do tenant

| Campo | Valor |
|---|---|
| **ID** | US-050 |
| **Título** | Definir região do tenant |
| **Como** | Administrador |
| **Quero** | definir a região (BR, US, EU) de um tenant |
| **Para** | aplicar restrições geográficas e políticas regionais |
| **Prioridade** | Média |
| **Serviço(s)** | spring-saas-core, Admin Console |

**Critérios de aceitação:**

```gherkin
Cenário: Definir região
  Dado que existe um tenant sem região definida ou com região "BR"
  Quando o Administrador atualiza a região para "EU"
  Então a região é persistida
  E políticas ABAC com allowedRegions passam a restringir funcionalidades conforme a nova região
  E um evento "tenant.updated" é publicado
```

---

## Epic 6: Autenticação e Segurança

### US-051 — Login (ambiente desenvolvimento)

| Campo | Valor |
|---|---|
| **ID** | US-051 |
| **Título** | Autenticar via login local (dev) |
| **Como** | Lojista |
| **Quero** | fazer login com email e senha em ambiente de desenvolvimento |
| **Para** | acessar o Shop e realizar pedidos |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core, node-b2b-orders, py-payments-ledger, Shop |

**Critérios de aceitação:**

```gherkin
Cenário: Login com sucesso
  Dado que estou na página de login
  Quando informo email "ops@demo.example.com" e senha "ops123"
  Então o sistema valida as credenciais
  E emite um JWT (HS256) com claims: sub, tid, roles, perms, plan, region
  E o token é armazenado em sessionStorage
  E sou redirecionado para a página inicial

Cenário: Login com credenciais inválidas
  Dado que estou na página de login
  Quando informo email ou senha incorretos
  Então o sistema retorna erro 401
```

---

### US-052 — Login OIDC (produção)

| Campo | Valor |
|---|---|
| **ID** | US-052 |
| **Título** | Autenticar via OIDC/Keycloak |
| **Como** | Lojista |
| **Quero** | fazer login via provedor OIDC (Keycloak) em ambiente de produção |
| **Para** | autenticar de forma segura usando identidade federada |
| **Prioridade** | Alta |
| **Serviço(s)** | Keycloak, Shop, Ops Portal, Admin Console |

**Critérios de aceitação:**

```gherkin
Cenário: Login OIDC com sucesso
  Dado que authMode está configurado como "oidc"
  Quando acesso a aplicação
  Então sou redirecionado ao Keycloak (Authorization Code + PKCE)
  E após autenticação, recebo um access_token RS256
  E o token é validado via JWKS endpoint
  E o refresh automático é configurado

Cenário: Forçar OIDC em produção
  Dado que authMode está como "dev" mas isDevMode() retorna false
  Quando acesso a aplicação em produção
  Então o sistema força o fluxo OIDC
```

---

### US-053 — Registro de novo usuário

| Campo | Valor |
|---|---|
| **ID** | US-053 |
| **Título** | Registrar nova conta de usuário |
| **Como** | Lojista |
| **Quero** | criar uma nova conta com email e senha |
| **Para** | me tornar cliente e realizar compras |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core, node-b2b-orders |

**Critérios de aceitação:**

```gherkin
Cenário: Registro com sucesso
  Dado que estou na página de registro
  Quando informo email, senha e dados do perfil
  Então o sistema cria a conta com senha hasheada (bcrypt)
  E atribui role e permissões default
  E um log de auditoria é gravado

Cenário: Rejeitar email duplicado
  Dado que já existe uma conta com email "user@example.com"
  Quando tento registrar com o mesmo email
  Então o sistema retorna erro 409
```

---

### US-054 — Reset de senha

| Campo | Valor |
|---|---|
| **ID** | US-054 |
| **Título** | Recuperar/redefinir senha |
| **Como** | Lojista |
| **Quero** | solicitar a redefinição de senha caso eu a esqueça |
| **Para** | recuperar o acesso à minha conta |
| **Prioridade** | Média |
| **Serviço(s)** | spring-saas-core |

**Critérios de aceitação:**

```gherkin
Cenário: Solicitar reset de senha
  Dado que possuo uma conta registrada
  Quando solicito o reset informando meu email
  Então o sistema envia um link/token de reset por e-mail
  E o token tem validade limitada

Cenário: Redefinir senha com token válido
  Dado que possuo um token de reset válido
  Quando informo a nova senha
  Então a senha é atualizada (hash bcrypt)
  E um log de auditoria é gravado
```

---

### US-055 — Autenticação 2FA (futuro)

| Campo | Valor |
|---|---|
| **ID** | US-055 |
| **Título** | Autenticação de dois fatores |
| **Como** | Administrador |
| **Quero** | habilitar 2FA (TOTP) para minha conta |
| **Para** | aumentar a segurança do acesso administrativo |
| **Prioridade** | Baixa |
| **Serviço(s)** | spring-saas-core, Keycloak |

**Critérios de aceitação:**

```gherkin
Cenário: Ativar 2FA
  Dado que estou autenticado como Administrador
  Quando ativo 2FA via TOTP
  Então o sistema exibe o QR code para configuração no app autenticador
  E a partir do próximo login, o segundo fator é exigido

Cenário: Login com 2FA
  Dado que possuo 2FA ativado
  Quando informo email, senha e código TOTP
  Então o sistema valida o código e emite o JWT
```

---

### US-056 — Token JWT com claims padronizados

| Campo | Valor |
|---|---|
| **ID** | US-056 |
| **Título** | Emissão de JWT com claims padronizados |
| **Como** | Desenvolvedor |
| **Quero** | que o JWT emitido contenha claims padronizados (sub, tid, roles, perms, plan, region) |
| **Para** | que todos os serviços possam validar e extrair informações de forma consistente |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core |

**Critérios de aceitação:**

```gherkin
Cenário: JWT com claims completos
  Dado que um usuário se autentica com sucesso
  Quando o JWT é emitido
  Então o payload contém: sub, tid, roles, perms, plan, region, iss, iat, exp
  E o header contém: alg (HS256 ou RS256), typ "JWT"

Cenário: Rotação de chaves
  Dado que a chave HS256 foi rotacionada
  E existe uma jwt.hs256-secret-previous configurada
  Quando um request chega com token assinado pela chave anterior
  Então o token é aceito até expirar
```

---

### US-057 — Permissões baseadas em role

| Campo | Valor |
|---|---|
| **ID** | US-057 |
| **Título** | Controlar permissões por role |
| **Como** | Administrador |
| **Quero** | que cada role tenha permissões específicas que determinam o acesso |
| **Para** | que cada usuário veja e faça apenas o que é permitido |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core, node-b2b-orders, py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Role admin tem acesso total
  Dado que o usuário possui role "admin" com tid "*"
  Quando acessa qualquer endpoint
  Então o acesso é permitido (bypass de ABAC)

Cenário: Role ops tem acesso operacional
  Dado que o usuário possui role "ops" com perms [orders:read, orders:write, inventory:read, inventory:write, payments:read]
  Quando tenta acessar tenants:write
  Então o acesso é negado

Cenário: Role sales tem acesso somente leitura
  Dado que o usuário possui role "sales" com perms [orders:read, products:read]
  Quando tenta criar um pedido
  Então o acesso é negado
```

---

### US-058 — Isolamento multi-tenant no request

| Campo | Valor |
|---|---|
| **ID** | US-058 |
| **Título** | Garantir isolamento de dados por tenant |
| **Como** | Desenvolvedor |
| **Quero** | que todo request HTTP contenha tenantId válido e filtre dados automaticamente |
| **Para** | garantir que nenhum dado cross-tenant seja acessível |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core, node-b2b-orders, py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Filtro automático por tenant
  Dado que o request contém header X-Tenant-Id e JWT com tid
  Quando a query ao banco é executada
  Então o filtro WHERE tenant_id = ? é aplicado automaticamente
  E dados de outros tenants são invisíveis

Cenário: Rejeitar request sem tenantId
  Dado que o request não contém X-Tenant-Id nem tid no JWT
  Quando o sistema processa
  Então o sistema retorna erro 400 ou 401

Cenário: X-Tenant-Id deve coincidir com tid do JWT
  Dado que o header X-Tenant-Id é "tenant-A"
  E o tid no JWT é "tenant-B"
  Quando o tenant guard verifica
  Então o acesso é negado
```

---

### US-059 — Rate limiting por plano

| Campo | Valor |
|---|---|
| **ID** | US-059 |
| **Título** | Aplicar rate limiting baseado no plano do tenant |
| **Como** | Desenvolvedor |
| **Quero** | que cada plano tenha limites de requisições por minuto |
| **Para** | proteger a plataforma contra abuso e garantir fair-use |
| **Prioridade** | Média |
| **Serviço(s)** | spring-saas-core, node-b2b-orders, py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Rate limit respeitado
  Dado que o tenant está no plano "free" com limite de 60 req/min
  Quando o tenant faz 60 requests em 1 minuto
  Então todos são aceitos
  E os headers X-RateLimit-Limit e X-RateLimit-Remaining são retornados

Cenário: Rate limit excedido
  Dado que o tenant está no plano "free" com limite de 60 req/min
  Quando o tenant faz a 61ª request no mesmo minuto
  Então o sistema retorna HTTP 429 (Too Many Requests)
  E o header Retry-After indica quando tentar novamente
```

---

### US-060 — Criptografia de dados sensíveis

| Campo | Valor |
|---|---|
| **ID** | US-060 |
| **Título** | Criptografar dados sensíveis em repouso |
| **Como** | Administrador |
| **Quero** | que dados sensíveis (tokens de gateway, secrets de webhook) sejam criptografados no banco |
| **Para** | proteger informações confidenciais em caso de vazamento de dados |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core, py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Criptografia AES-256-GCM
  Dado que um secret de webhook é armazenado
  Quando o dado é persistido no banco
  Então é criptografado com AES-256-GCM usando a ENCRYPTION_KEY
  E um IV aleatório é gerado por operação
  E ao recuperar, o dado é descriptografado transparentemente
```

---

## Epic 7: Auditoria e Compliance

### US-061 — Consultar audit log

| Campo | Valor |
|---|---|
| **ID** | US-061 |
| **Título** | Consultar log de auditoria |
| **Como** | Administrador |
| **Quero** | consultar o log de auditoria com filtros por tenant, ação, ator, datas e correlationId |
| **Para** | investigar incidentes e garantir compliance |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core, node-b2b-orders, py-payments-ledger, Admin Console |

**Critérios de aceitação:**

```gherkin
Cenário: Consultar audit log com filtros
  Dado que estou autenticado como Administrador com permissão audit:read
  Quando acesso GET /v1/audit com filtros: action "order.created", from "2026-01-01", to "2026-03-31"
  Então o sistema retorna registros que atendem aos filtros
  E cada registro contém: tenantId, actorSub, actorRoles, action, resourceType, resourceId, method, path, statusCode, correlationId, details
  E os resultados são paginados (máximo 100 por página)

Cenário: Paginação por cursor e offset
  Dado que existem mais de 100 registros no audit log
  Quando navego pelas páginas
  Então a paginação por cursor (keyset) e por offset estão disponíveis
```

---

### US-062 — Exportar audit log em JSON

| Campo | Valor |
|---|---|
| **ID** | US-062 |
| **Título** | Exportar audit log em formato JSON |
| **Como** | Administrador |
| **Quero** | exportar os registros de auditoria em formato JSON |
| **Para** | integrar com ferramentas externas de compliance e SIEM |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core, node-b2b-orders, py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Exportar em JSON
  Dado que estou autenticado com permissão audit:read
  Quando acesso GET /v1/audit/export com format "json", from e to obrigatórios
  Então o sistema retorna até 10.000 registros em formato JSON
  E o streaming é utilizado para não sobrecarregar a memória

Cenário: Rejeitar exportação sem filtros de data
  Dado que estou autenticado com permissão audit:read
  Quando acesso GET /v1/audit/export sem from e to
  Então o sistema retorna erro 400
```

---

### US-063 — Exportar audit log em CSV

| Campo | Valor |
|---|---|
| **ID** | US-063 |
| **Título** | Exportar audit log em formato CSV |
| **Como** | Administrador |
| **Quero** | exportar os registros de auditoria em formato CSV |
| **Para** | abrir em planilhas para análise e compliance |
| **Prioridade** | Média |
| **Serviço(s)** | spring-saas-core |

**Critérios de aceitação:**

```gherkin
Cenário: Exportar em CSV
  Dado que estou autenticado com permissão audit:read
  Quando acesso GET /v1/audit/export com format "csv", from e to
  Então o sistema retorna até 10.000 registros em formato CSV
  E o cabeçalho do CSV contém os nomes dos campos do audit log
```

---

### US-064 — Configurar retenção de audit logs

| Campo | Valor |
|---|---|
| **ID** | US-064 |
| **Título** | Configurar política de retenção de audit logs |
| **Como** | Administrador |
| **Quero** | definir por quantos dias os audit logs são retidos |
| **Para** | cumprir políticas internas de retenção e otimizar armazenamento |
| **Prioridade** | Média |
| **Serviço(s)** | spring-saas-core, py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Retenção padrão de 90 dias
  Dado que a configuração audit.retention-days está com valor padrão 90
  Quando o job de purge executa diariamente às 02:00 UTC
  Então registros com mais de 90 dias são removidos em batches de 1.000
  E a execução da purge é auditada (ação "audit.retention.cleanup")

Cenário: Desabilitar purge
  Dado que a configuração retention-days é definida como 0
  Quando o job de purge executa
  Então nenhum registro é removido

Cenário: Retenção customizada
  Dado que o Administrador define retention-days como 365
  Quando o job de purge executa
  Então apenas registros com mais de 365 dias são removidos
```

---

### US-065 — Auditar negações de acesso

| Campo | Valor |
|---|---|
| **ID** | US-065 |
| **Título** | Auditar todas as negações de acesso (ACCESS_DENIED) |
| **Como** | Administrador |
| **Quero** | que toda negação de acesso pelo ABAC seja registrada no audit log |
| **Para** | detectar tentativas de acesso indevido e ajustar políticas |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core |

**Critérios de aceitação:**

```gherkin
Cenário: Auditoria de ACCESS_DENIED
  Dado que um usuário tenta acessar um recurso sem permissão
  Quando o ABAC nega o acesso
  Então um registro de auditoria é criado com action "ACCESS_DENIED"
  E os detalhes incluem: permission, plan, region, policy_id, reason
  E o contador Prometheus accessDeniedCounter é incrementado
```

---

### US-066 — Alertas de anomalia em auditoria

| Campo | Valor |
|---|---|
| **ID** | US-066 |
| **Título** | Detectar anomalias no audit log |
| **Como** | Administrador |
| **Quero** | receber alertas quando padrões anômalos forem detectados no audit log |
| **Para** | reagir rapidamente a comportamentos suspeitos |
| **Prioridade** | Média |
| **Serviço(s)** | spring-saas-core, Admin Console |

**Critérios de aceitação:**

```gherkin
Cenário: Consultar anomalias
  Dado que estou autenticado como Administrador
  Quando acesso GET /v1/analytics/anomalies
  Então o sistema retorna padrões anômalos detectados (ex.: pico de ACCESS_DENIED, volume atípico de operações)
```

---

### US-067 — Correlação de auditoria distribuída

| Campo | Valor |
|---|---|
| **ID** | US-067 |
| **Título** | Rastrear ações por correlation ID |
| **Como** | Administrador |
| **Quero** | filtrar audit logs por correlationId |
| **Para** | rastrear uma operação de ponta a ponta entre todos os serviços |
| **Prioridade** | Média |
| **Serviço(s)** | spring-saas-core, node-b2b-orders, py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Rastrear por correlationId
  Dado que uma operação gerou logs em múltiplos serviços com correlationId "abc-123"
  Quando o Administrador filtra o audit log por correlationId "abc-123"
  Então o sistema retorna todos os registros relacionados à mesma operação
  E os registros estão ordenados por timestamp
```

---

### US-068 — Auditoria de operações de inventário

| Campo | Valor |
|---|---|
| **ID** | US-068 |
| **Título** | Auditar ajustes de inventário |
| **Como** | Administrador |
| **Quero** | que todo ajuste de inventário seja auditado |
| **Para** | rastrear movimentações de estoque e identificar irregularidades |
| **Prioridade** | Alta |
| **Serviço(s)** | node-b2b-orders |

**Critérios de aceitação:**

```gherkin
Cenário: Ajuste de inventário auditado
  Dado que um Operador fez um ajuste de inventário tipo "OUT" com qty 10
  Quando o ajuste é processado
  Então um log de auditoria é gravado com: adjustmentId, type, qty, reason
  E a métrica inventoryAdjusted é incrementada com labels tenant_id e type
```

---

### US-069 — Auditoria de operações de pagamento

| Campo | Valor |
|---|---|
| **ID** | US-069 |
| **Título** | Auditar operações de pagamento |
| **Como** | Administrador |
| **Quero** | que toda criação, confirmação, settlement e void de PaymentIntent seja auditado |
| **Para** | garantir compliance financeiro |
| **Prioridade** | Alta |
| **Serviço(s)** | py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Operações de pagamento auditadas
  Dado que um PaymentIntent foi criado, confirmado, liquidado e reembolsado
  Quando consulto o audit log
  Então encontro registros para cada operação: payment.intent.created, payment.authorized, payment.settled, payment.refunded
  E cada registro contém o correlationId e detalhes da operação
```

---

### US-070 — Auditoria de gestão de tenants e flags

| Campo | Valor |
|---|---|
| **ID** | US-070 |
| **Título** | Auditar alterações em tenants, políticas e feature flags |
| **Como** | Administrador |
| **Quero** | que toda criação, atualização e exclusão de tenants, políticas e flags seja auditada |
| **Para** | ter rastreabilidade total de mudanças na governança |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core |

**Critérios de aceitação:**

```gherkin
Cenário: Operações de governança auditadas
  Dado que o Administrador criou um tenant, adicionou uma política e togglou uma flag
  Quando consulto o audit log
  Então encontro registros: tenant.created, policy.created, FLAG_UPDATED
  E cada registro contém resourceType, resourceId e detalhes da operação
```

---

## Epic 8: Webhooks e Integrações

### US-071 — Registrar endpoint de webhook

| Campo | Valor |
|---|---|
| **ID** | US-071 |
| **Título** | Registrar endpoint de webhook |
| **Como** | Desenvolvedor |
| **Quero** | registrar uma URL de webhook com os eventos de interesse |
| **Para** | receber notificações em tempo real sobre eventos da plataforma |
| **Prioridade** | Alta |
| **Serviço(s)** | py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Registrar endpoint
  Dado que estou autenticado com permissão admin:write
  Quando envio POST /v1/webhooks com url e events ["payment.settled", "payment.refunded"]
  Então o sistema cria o endpoint
  E gera automaticamente um secret (token hex de 32 bytes) para assinatura HMAC
  E o endpoint é criado como ativo (is_active = true)
  E um log de auditoria é gravado

Cenário: Registrar endpoint wildcard
  Dado que estou autenticado com permissão admin:write
  Quando envio POST /v1/webhooks com events ["*"]
  Então o endpoint recebe todos os tipos de evento
```

---

### US-072 — Listar endpoints de webhook

| Campo | Valor |
|---|---|
| **ID** | US-072 |
| **Título** | Listar endpoints de webhook configurados |
| **Como** | Desenvolvedor |
| **Quero** | listar todos os endpoints de webhook do meu tenant |
| **Para** | gerenciar e monitorar as integrações ativas |
| **Prioridade** | Média |
| **Serviço(s)** | py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Listar endpoints
  Dado que estou autenticado com permissão admin:write
  Quando acesso GET /v1/webhooks
  Então o sistema retorna a lista de endpoints com: id, url, events, is_active, created_at
  E apenas endpoints do meu tenant são retornados
```

---

### US-073 — Listar deliveries de webhook

| Campo | Valor |
|---|---|
| **ID** | US-073 |
| **Título** | Consultar histórico de entregas de webhook |
| **Como** | Desenvolvedor |
| **Quero** | consultar o histórico de entregas de webhook com status, tentativas e response code |
| **Para** | diagnosticar falhas de integração |
| **Prioridade** | Média |
| **Serviço(s)** | py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Consultar deliveries
  Dado que existem deliveries para os endpoints do meu tenant
  Quando consulto o histórico de entregas
  Então o sistema retorna: delivery_id, endpoint_id, event_type, status (PENDING/DELIVERED/RETRYING/FAILED), attempts, last_attempt_at, response_code
```

---

### US-074 — Retry manual de webhook

| Campo | Valor |
|---|---|
| **ID** | US-074 |
| **Título** | Reenviar webhook falhado manualmente |
| **Como** | Desenvolvedor |
| **Quero** | solicitar o reenvio de uma delivery de webhook que falhou |
| **Para** | garantir que o receptor receba o evento após resolver o problema |
| **Prioridade** | Média |
| **Serviço(s)** | py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Retry manual de delivery falhada
  Dado que existe uma delivery com status "FAILED"
  Quando solicito o retry manual
  Então o sistema reenvia o webhook para o endpoint
  E o status muda para "PENDING" ou "DELIVERED" conforme resultado
```

---

### US-075 — Configurar eventos de interesse

| Campo | Valor |
|---|---|
| **ID** | US-075 |
| **Título** | Configurar quais eventos o webhook recebe |
| **Como** | Desenvolvedor |
| **Quero** | atualizar a lista de eventos de interesse de um endpoint |
| **Para** | refinar quais notificações meu sistema recebe |
| **Prioridade** | Média |
| **Serviço(s)** | py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Atualizar eventos de interesse
  Dado que existe um endpoint com events ["payment.settled"]
  Quando atualizo para events ["payment.settled", "payment.refunded", "reconciliation.discrepancy"]
  Então o endpoint passa a receber os novos tipos de evento
```

---

### US-076 — Assinatura HMAC-SHA256 nos webhooks

| Campo | Valor |
|---|---|
| **ID** | US-076 |
| **Título** | Garantir autenticidade de webhooks com HMAC-SHA256 |
| **Como** | Desenvolvedor |
| **Quero** | que cada delivery de webhook seja assinada com o secret do endpoint via HMAC-SHA256 |
| **Para** | validar a autenticidade dos webhooks recebidos |
| **Prioridade** | Alta |
| **Serviço(s)** | py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Webhook assinado
  Dado que existe um endpoint com secret gerado
  Quando uma delivery é enviada
  Então o payload é assinado com HMAC-SHA256 usando o secret
  E a assinatura é enviada no header X-Webhook-Signature
  E o receptor pode validar recalculando o HMAC
```

---

### US-077 — Retry automático de webhooks com backoff

| Campo | Valor |
|---|---|
| **ID** | US-077 |
| **Título** | Retry automático de webhooks com backoff progressivo |
| **Como** | Desenvolvedor |
| **Quero** | que webhooks falhados sejam reenviados automaticamente com delays progressivos |
| **Para** | aumentar as chances de entrega em caso de indisponibilidade temporária |
| **Prioridade** | Alta |
| **Serviço(s)** | py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Retry com backoff
  Dado que uma delivery falhou na primeira tentativa
  Quando o sistema processa retries
  Então os delays são: 60s (1 min), 300s (5 min), 1800s (30 min)
  E após 3 tentativas falhadas, a delivery é marcada como "FAILED"
  E cada tentativa registra: attempts, last_attempt_at, response_code
```

---

### US-078 — Ativar/desativar endpoint de webhook

| Campo | Valor |
|---|---|
| **ID** | US-078 |
| **Título** | Ativar ou desativar endpoint de webhook |
| **Como** | Desenvolvedor |
| **Quero** | ativar ou desativar um endpoint sem excluí-lo |
| **Para** | pausar temporariamente o envio de webhooks durante manutenção |
| **Prioridade** | Média |
| **Serviço(s)** | py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Desativar endpoint
  Dado que existe um endpoint ativo
  Quando altero is_active para false
  Então nenhuma nova delivery é criada para esse endpoint
  E o endpoint não é excluído

Cenário: Reativar endpoint
  Dado que existe um endpoint inativo
  Quando altero is_active para true
  Então novas deliveries passam a ser criadas para eventos elegíveis
```

---

### US-079 — Excluir endpoint de webhook

| Campo | Valor |
|---|---|
| **ID** | US-079 |
| **Título** | Excluir endpoint de webhook |
| **Como** | Desenvolvedor |
| **Quero** | excluir permanentemente um endpoint de webhook |
| **Para** | remover integrações que não são mais necessárias |
| **Prioridade** | Média |
| **Serviço(s)** | py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Excluir endpoint
  Dado que existe um endpoint no meu tenant
  Quando envio DELETE /v1/webhooks/{id}
  Então o endpoint é removido
  E um log de auditoria é gravado
  E nenhuma nova delivery é criada
```

---

### US-080 — Receber webhooks inbound (Stripe)

| Campo | Valor |
|---|---|
| **ID** | US-080 |
| **Título** | Processar webhooks recebidos do Stripe |
| **Como** | Desenvolvedor |
| **Quero** | que a plataforma processe webhooks de callback do Stripe (confirmação, refund) |
| **Para** | manter o estado dos pagamentos sincronizado com o gateway |
| **Prioridade** | Alta |
| **Serviço(s)** | py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Webhook Stripe de confirmação
  Dado que o Stripe envia um webhook com evento "payment_intent.succeeded"
  Quando o sistema recebe via POST /v1/webhooks/stripe
  Então a assinatura é validada com STRIPE_WEBHOOK_SECRET
  E o PaymentIntent local é atualizado conforme mapeamento de status
  E transições inválidas são silenciosamente ignoradas (log info, sem erro)

Cenário: Mapeamento de status Stripe
  Dado que o Stripe envia status "succeeded"
  Quando o sistema processa
  Então o status local é atualizado para "SETTLED"
```

---

## Epic 9: Analytics e IA

### US-081 — Dashboard de demanda

| Campo | Valor |
|---|---|
| **ID** | US-081 |
| **Título** | Visualizar dashboard de demanda |
| **Como** | Operador |
| **Quero** | visualizar um dashboard com métricas de pedidos, receita e volume |
| **Para** | entender a demanda e tomar decisões baseadas em dados |
| **Prioridade** | Média |
| **Serviço(s)** | node-b2b-orders, py-payments-ledger, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Exibir métricas de demanda
  Dado que estou autenticado como Operador no Ops Portal
  Quando acesso o dashboard
  Então o sistema exibe: total de pedidos, pedidos por status, receita por período
  E os dados são filtrados pelo tenant ativo
```

---

### US-082 — Detecção de anomalias em pagamentos

| Campo | Valor |
|---|---|
| **ID** | US-082 |
| **Título** | Detectar anomalias em transações de pagamento |
| **Como** | Administrador |
| **Quero** | que o sistema detecte padrões anômalos em pagamentos (taxa de falhas alta, picos de volume) |
| **Para** | identificar e reagir a potenciais fraudes ou problemas técnicos |
| **Prioridade** | Média |
| **Serviço(s)** | py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Detecção de taxa de falha anômala
  Dado que a taxa de falha de pagamentos excede o threshold configurado
  Quando o sistema analisa os padrões
  Então um alerta é gerado
  E as métricas failure_rate e risk_score são disponibilizadas
```

---

### US-083 — Previsão de inventário com IA

| Campo | Valor |
|---|---|
| **ID** | US-083 |
| **Título** | Gerar previsões de inventário assistidas por IA |
| **Como** | Operador |
| **Quero** | receber previsões de consumo de estoque baseadas em IA |
| **Para** | otimizar compras e evitar rupturas de estoque |
| **Prioridade** | Baixa |
| **Serviço(s)** | node-b2b-orders, spring-saas-core (AI) |

**Critérios de aceitação:**

```gherkin
Cenário: Previsão de estoque
  Dado que existem dados históricos suficientes de pedidos e ajustes
  Quando o módulo de IA analisa os dados
  Então o sistema exibe previsões de consumo por SKU
  E sugere quantidades de reposição
```

---

### US-084 — Análise de fraude em pagamentos

| Campo | Valor |
|---|---|
| **ID** | US-084 |
| **Título** | Analisar risco de fraude em pagamentos |
| **Como** | Administrador |
| **Quero** | visualizar indicadores de risco e padrões de fraude em pagamentos |
| **Para** | proteger a plataforma contra fraudes financeiras |
| **Prioridade** | Média |
| **Serviço(s)** | py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Risk score por tenant
  Dado que existem transações de pagamento para o tenant
  Quando consulto o módulo de fraud analytics
  Então o sistema exibe: failure_rate, risk_score, padrões de falha por tipo
```

---

### US-085 — Documentação viva (IA)

| Campo | Valor |
|---|---|
| **ID** | US-085 |
| **Título** | Gerar documentação viva com IA |
| **Como** | Administrador |
| **Quero** | que a plataforma gere documentação atualizada automaticamente com base no estado atual |
| **Para** | manter a documentação sempre alinhada com a implementação |
| **Prioridade** | Baixa |
| **Serviço(s)** | spring-saas-core (AI), node-b2b-orders (AI) |

**Critérios de aceitação:**

```gherkin
Cenário: Documentação viva
  Dado que o módulo de IA está habilitado (AI_ENABLED=true)
  Quando o Administrador solicita a geração de documentação
  Então o sistema produz documentação atualizada das APIs, eventos e configurações
```

---

### US-086 — Recomendações de governança (IA)

| Campo | Valor |
|---|---|
| **ID** | US-086 |
| **Título** | Receber recomendações de governança da IA |
| **Como** | Administrador |
| **Quero** | receber sugestões de ajustes em políticas ABAC e feature flags |
| **Para** | otimizar a governança do tenant baseado em dados de uso |
| **Prioridade** | Baixa |
| **Serviço(s)** | spring-saas-core (AI) |

**Critérios de aceitação:**

```gherkin
Cenário: Sugestão de política
  Dado que existem muitas negações ACCESS_DENIED para um determinado plano/região
  Quando o módulo de IA analisa os dados
  Então o sistema sugere ajustes nas políticas ABAC
```

---

### US-087 — Relatório de receita por período

| Campo | Valor |
|---|---|
| **ID** | US-087 |
| **Título** | Visualizar relatório de receita por período |
| **Como** | Operador |
| **Quero** | consultar relatório de receita agregado por dia, semana ou mês |
| **Para** | acompanhar o desempenho financeiro do negócio |
| **Prioridade** | Média |
| **Serviço(s)** | py-payments-ledger, Ops Portal |

**Critérios de aceitação:**

```gherkin
Cenário: Receita por período
  Dado que estou autenticado como Operador com permissão ledger:read
  Quando acesso GET /v1/reports/revenue com granularity "month"
  Então o sistema retorna a receita agregada por mês
  E os valores refletem os lançamentos CREDIT em REVENUE no ledger
```

---

### US-088 — Resumo analítico do sistema

| Campo | Valor |
|---|---|
| **ID** | US-088 |
| **Título** | Consultar resumo analítico do sistema |
| **Como** | Administrador |
| **Quero** | visualizar um resumo agregado com totais de tenants, pedidos, pagamentos |
| **Para** | ter visão macro da saúde da plataforma |
| **Prioridade** | Média |
| **Serviço(s)** | spring-saas-core, Admin Console |

**Critérios de aceitação:**

```gherkin
Cenário: Resumo agregado
  Dado que estou autenticado como Administrador
  Quando acesso GET /v1/analytics/summary
  Então o sistema retorna totais: tenants ativos, pedidos por status, pagamentos por status, flags ativas
```

---

### US-089 — Métricas de negócio

| Campo | Valor |
|---|---|
| **ID** | US-089 |
| **Título** | Consultar métricas de negócio |
| **Como** | Administrador |
| **Quero** | consultar métricas de negócio em tempo real |
| **Para** | monitorar KPIs da plataforma |
| **Prioridade** | Média |
| **Serviço(s)** | spring-saas-core, node-b2b-orders, py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Métricas Prometheus disponíveis
  Dado que os serviços estão operacionais
  Quando acesso os endpoints de métricas
  Então spring-saas-core expõe: tenants_created, policies_updated, flags_toggled, access_denied, outbox_published/failed
  E node-b2b-orders expõe: orders_created, orders_confirmed, orders_cancelled, inventory_adjusted
  E py-payments-ledger expõe: payment_intents_created, refunds_total, webhook_deliveries_total, reconciliation_discrepancy_total, circuit_breaker_state
```

---

### US-090 — Dashboard Grafana

| Campo | Valor |
|---|---|
| **ID** | US-090 |
| **Título** | Visualizar dashboards no Grafana |
| **Como** | Administrador |
| **Quero** | acessar dashboards pré-configurados no Grafana |
| **Para** | monitorar visualmente a saúde e performance da plataforma |
| **Prioridade** | Média |
| **Serviço(s)** | Prometheus, Grafana |

**Critérios de aceitação:**

```gherkin
Cenário: Dashboard de outbox
  Dado que o Grafana está configurado com provisioning automático
  Quando acesso o Grafana em :3030
  Então o dashboard de outbox exibe: published/failed por hora
  E o scrape do Prometheus atualiza a cada 5–15 segundos
```

---

## Epic 10: Onboarding e Billing

### US-091 — Signup de novo tenant

| Campo | Valor |
|---|---|
| **ID** | US-091 |
| **Título** | Signup de novo tenant via wizard |
| **Como** | Administrador |
| **Quero** | realizar o onboarding de um novo tenant via wizard no Admin Console |
| **Para** | criar a estrutura completa do tenant de forma guiada |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core, Admin Console |

**Critérios de aceitação:**

```gherkin
Cenário: Onboarding completo via wizard
  Dado que estou na página /onboarding do Admin Console
  Quando preencho: nome do tenant, plano, região e dados iniciais
  Então o sistema cria o tenant com status ACTIVE
  E políticas ABAC default são configuradas
  E feature flags default são criadas
  E o evento "tenant.created" é propagado para todos os serviços
  E o Lojista pode iniciar operações imediatamente
```

---

### US-092 — Escolher plano de assinatura

| Campo | Valor |
|---|---|
| **ID** | US-092 |
| **Título** | Escolher plano de assinatura |
| **Como** | Administrador |
| **Quero** | escolher entre os planos disponíveis (free, pro, enterprise) |
| **Para** | definir os limites e funcionalidades do meu tenant |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core |

**Critérios de aceitação:**

```gherkin
Cenário: Listar planos ativos
  Dado que existem planos cadastrados
  Quando consulto a listagem de planos
  Então o sistema retorna apenas planos com active = true
  E cada plano exibe: slug, displayName, description, monthlyPriceCents, yearlyPriceCents, maxUsers, maxProjects, storageGb

Cenário: Rejeitar assinatura de plano inativo
  Dado que o plano "beta" está com active = false
  Quando tento assinar o plano "beta"
  Então o sistema retorna erro (IllegalArgumentException)
```

---

### US-093 — Período de trial

| Campo | Valor |
|---|---|
| **ID** | US-093 |
| **Título** | Iniciar período de trial |
| **Como** | Administrador |
| **Quero** | iniciar um período de teste (trial) em um plano premium |
| **Para** | avaliar funcionalidades antes de se comprometer financeiramente |
| **Prioridade** | Média |
| **Serviço(s)** | spring-saas-core |

**Critérios de aceitação:**

```gherkin
Cenário: Iniciar trial
  Dado que o tenant está no plano "free"
  Quando o Administrador inicia um trial do plano "pro"
  Então uma assinatura é criada com status "TRIALING"
  E o plano do tenant é atualizado para "pro"
  E o período é de 30 dias (currentPeriodEnd = now + 30 days)

Cenário: Trial expirado
  Dado que o período de trial expirou
  Quando o sistema verifica a assinatura
  Então o tenant volta ao plano anterior ou é suspenso
```

---

### US-094 — Upgrade de plano

| Campo | Valor |
|---|---|
| **ID** | US-094 |
| **Título** | Fazer upgrade de plano |
| **Como** | Administrador |
| **Quero** | fazer upgrade do plano do tenant (ex.: free → pro, pro → enterprise) |
| **Para** | desbloquear funcionalidades e limites superiores |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core |

**Critérios de aceitação:**

```gherkin
Cenário: Upgrade de plano
  Dado que o tenant está com assinatura ativa no plano "free"
  Quando o Administrador solicita upgrade para "pro"
  Então a assinatura anterior é cancelada automaticamente
  E uma nova assinatura é criada com planSlug "pro" e status "ACTIVE"
  E o campo plan do tenant é atualizado para "pro"
  E o período é de 30 dias
  E um log de auditoria é gravado
```

---

### US-095 — Downgrade de plano

| Campo | Valor |
|---|---|
| **ID** | US-095 |
| **Título** | Fazer downgrade de plano |
| **Como** | Administrador |
| **Quero** | fazer downgrade do plano do tenant (ex.: enterprise → pro) |
| **Para** | reduzir custos caso não precise de todas as funcionalidades |
| **Prioridade** | Média |
| **Serviço(s)** | spring-saas-core |

**Critérios de aceitação:**

```gherkin
Cenário: Downgrade de plano
  Dado que o tenant está com assinatura ativa no plano "enterprise"
  Quando o Administrador solicita downgrade para "pro"
  Então a assinatura anterior é cancelada
  E uma nova assinatura é criada com planSlug "pro"
  E o campo plan do tenant é atualizado
  E funcionalidades restritas ao plano enterprise são desabilitadas via políticas ABAC
```

---

### US-096 — Cancelar assinatura

| Campo | Valor |
|---|---|
| **ID** | US-096 |
| **Título** | Cancelar assinatura |
| **Como** | Administrador |
| **Quero** | cancelar a assinatura vigente do tenant |
| **Para** | encerrar a cobrança recorrente |
| **Prioridade** | Média |
| **Serviço(s)** | spring-saas-core |

**Critérios de aceitação:**

```gherkin
Cenário: Cancelar assinatura
  Dado que o tenant possui uma assinatura com status "ACTIVE"
  Quando o Administrador solicita o cancelamento
  Então o campo cancelledAt é registrado
  E o status da assinatura muda para "CANCELLED"
  E um log de auditoria é gravado
```

---

### US-097 — Visualizar assinatura atual

| Campo | Valor |
|---|---|
| **ID** | US-097 |
| **Título** | Visualizar detalhes da assinatura vigente |
| **Como** | Administrador |
| **Quero** | consultar os detalhes da assinatura atual (plano, status, período, preço) |
| **Para** | saber quando vence e quanto custa |
| **Prioridade** | Média |
| **Serviço(s)** | spring-saas-core, Admin Console |

**Critérios de aceitação:**

```gherkin
Cenário: Detalhes da assinatura
  Dado que o tenant possui uma assinatura ativa
  Quando o Administrador consulta
  Então o sistema exibe: planSlug, status, currentPeriodStart, currentPeriodEnd, monthlyPriceCents
```

---

### US-098 — Criar conta contábil para novo tenant

| Campo | Valor |
|---|---|
| **ID** | US-098 |
| **Título** | Provisionar contas contábeis no onboarding |
| **Como** | Administrador |
| **Quero** | que contas contábeis padrão (CASH, REVENUE, REFUND_EXPENSE) sejam criadas automaticamente |
| **Para** | que o tenant tenha a estrutura contábil pronta para operar |
| **Prioridade** | Alta |
| **Serviço(s)** | py-payments-ledger |

**Critérios de aceitação:**

```gherkin
Cenário: Provisionamento automático
  Dado que o evento "tenant.created" é consumido pelo py-payments-ledger
  Quando o serviço processa o evento
  Então três contas contábeis são criadas: CASH (ASSET), REVENUE (REVENUE), REFUND_EXPENSE (EXPENSE)
  E as contas ficam vinculadas ao novo tenant
```

---

### US-099 — Assinatura única por tenant

| Campo | Valor |
|---|---|
| **ID** | US-099 |
| **Título** | Garantir uma assinatura ativa por tenant |
| **Como** | Administrador |
| **Quero** | que o tenant tenha no máximo uma assinatura ativa por vez |
| **Para** | evitar conflitos de plano e cobrança |
| **Prioridade** | Alta |
| **Serviço(s)** | spring-saas-core |

**Critérios de aceitação:**

```gherkin
Cenário: Substituição automática de assinatura
  Dado que o tenant possui uma assinatura ativa com plano "free"
  Quando o Administrador cria uma nova assinatura com plano "pro"
  Então a assinatura "free" é cancelada automaticamente
  E a nova assinatura "pro" se torna a única ativa
```

---

### US-100 — Listar definições de plano

| Campo | Valor |
|---|---|
| **ID** | US-100 |
| **Título** | Consultar planos disponíveis para assinatura |
| **Como** | Administrador |
| **Quero** | listar todos os planos disponíveis com seus limites e preços |
| **Para** | comparar e escolher o plano mais adequado |
| **Prioridade** | Média |
| **Serviço(s)** | spring-saas-core, Admin Console |

**Critérios de aceitação:**

```gherkin
Cenário: Listar planos
  Dado que existem definições de plano cadastradas
  Quando acesso a API de listagem de planos
  Então o sistema retorna apenas planos com active = true
  E cada plano exibe: slug, displayName, description, monthlyPriceCents, yearlyPriceCents, maxUsers, maxProjects, storageGb
```

---

## Matriz de Prioridades

| Prioridade | Quantidade | Histórias |
|---|---|---|
| **Alta** | 50 | US-001, US-002, US-003, US-004, US-005, US-006, US-010, US-011, US-012, US-013, US-015, US-017, US-018, US-019, US-021, US-022, US-023, US-025, US-026, US-031, US-033, US-034, US-035, US-036, US-038, US-041, US-042, US-043, US-044, US-045, US-046, US-048, US-051, US-052, US-053, US-056, US-057, US-058, US-060, US-061, US-062, US-065, US-068, US-069, US-070, US-071, US-076, US-077, US-080, US-091, US-092, US-094, US-098, US-099 |
| **Média** | 33 | US-007, US-008, US-014, US-016, US-020, US-024, US-027, US-028, US-029, US-032, US-037, US-040, US-047, US-049, US-050, US-054, US-059, US-063, US-064, US-066, US-067, US-072, US-073, US-074, US-075, US-078, US-079, US-081, US-082, US-084, US-087, US-088, US-089, US-090, US-093, US-095, US-096, US-097, US-100 |
| **Baixa** | 7 | US-009, US-030, US-055, US-083, US-085, US-086 |

---

## Referência de Serviços

| Serviço | Responsabilidade | Stack |
|---|---|---|
| `spring-saas-core` | Tenants, políticas, flags, auditoria, billing, JWT, outbox | Java 21 / Spring Boot 3.2 |
| `node-b2b-orders` | Pedidos, produtos, inventário, saga | TypeScript / NestJS / Prisma |
| `py-payments-ledger` | Pagamentos, ledger, reconciliação, webhooks, gateway | Python 3.12 / FastAPI / SQLAlchemy |
| `fluxe-b2b-suite` | Shop, Ops Portal, Admin Console | Angular 21 / Nx |

---

## Referência de Permissões

| Permissão | Descrição | Serviço |
|---|---|---|
| `tenants:read` / `tenants:write` | Gestão de tenants | spring-saas-core |
| `policies:read` / `policies:write` | Gestão de políticas ABAC | spring-saas-core |
| `flags:read` / `flags:write` | Gestão de feature flags | spring-saas-core |
| `audit:read` | Consulta de audit log | Todos |
| `analytics:read` | Métricas e analytics | spring-saas-core |
| `admin:write` | Operações administrativas | Todos |
| `orders:read` / `orders:write` | Gestão de pedidos | node-b2b-orders |
| `products:read` / `products:write` | Gestão de produtos | node-b2b-orders |
| `inventory:read` / `inventory:write` | Gestão de inventário | node-b2b-orders |
| `payments:read` / `payments:write` | Gestão de pagamentos | py-payments-ledger |
| `ledger:read` | Consulta de ledger | py-payments-ledger |
| `profile:read` | Perfil do usuário | node-b2b-orders, py-payments-ledger |

---

> Documento gerado com base em: `docs/REGRAS-NEGOCIO.md`, `docs/DAS.md`, `docs/MANUAL-SISTEMA.md`.
