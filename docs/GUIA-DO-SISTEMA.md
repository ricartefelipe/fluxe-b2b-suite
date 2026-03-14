# Fluxe B2B Suite — Guia Completo do Sistema

## 1. O que é o Fluxe B2B Suite

O **Fluxe B2B Suite** é uma plataforma SaaS multi-tenant completa para operações de comércio B2B (Business-to-Business). Ele permite que múltiplas organizações (tenants) gerenciem seus pedidos, estoque, pagamentos, contabilidade e governança a partir de uma única infraestrutura compartilhada, com isolamento total de dados entre tenants.

### Arquitetura de Microsserviços

O sistema é composto por **4 repositórios** independentes que se comunicam via APIs REST e JWT padronizado:

| Serviço | Tecnologia | Responsabilidade |
|---------|-----------|-----------------|
| **spring-saas-core** | Java 21 / Spring Boot | Control plane: tenants, usuários, ABAC/RBAC, feature flags, auditoria, JWT |
| **node-b2b-orders** | Node.js / NestJS / Prisma | Domínio de negócio: pedidos, produtos, inventário, ajustes de estoque |
| **py-payments-ledger** | Python / FastAPI / SQLAlchemy | Pagamentos: intents, ledger contábil, balanços, reconciliação |
| **fluxe-b2b-suite** | Angular 19 / Nx Monorepo | Frontend: 3 aplicações web (Shop, Ops Portal, Admin Console) |

### Multi-Tenancy

Cada organização é um **tenant** com plano (starter, pro, enterprise), região e configurações independentes. O JWT emitido pelo `spring-saas-core` carrega tenant_id, roles, permissões, plano e região — todos os serviços downstream validam esses claims.

---

## 2. Aplicações Frontend

### 2.1 Shop (Loja B2B)

**URL**: `shop-frontend-staging.up.railway.app`

**Público-alvo**: Compradores e representantes comerciais do tenant.

#### Telas

| Tela | Descrição | Como operar |
|------|-----------|-------------|
| **Catálogo de Produtos** | Grid com todos os produtos do tenant, com filtros por categoria, faixa de preço, busca por nome/SKU. Suporte a visualização em grid e lista. | Use os filtros laterais para refinar. Clique no produto para ver detalhes. Use "Adicionar" para colocar no carrinho. |
| **Detalhe do Produto** | Imagem, nome, preço, SKU, descrição, disponibilidade em estoque, seletor de quantidade. | Selecione a quantidade e clique "Adicionar ao Carrinho". |
| **Checkout (4 etapas)** | **1. Carrinho**: revisão de itens e quantidades. **2. Entrega**: formulário com nome, e-mail, endereço, cidade, estado, CEP, CPF/CNPJ. **3. Revisão**: resumo completo. **4. Confirmação**: pedido criado com número de referência. | Preencha cada etapa sequencialmente. Na revisão, confirme para finalizar. |
| **Meus Pedidos** | Lista de todos os pedidos do usuário com filtros por status e data, busca por ID. Vista em tabela (desktop) e cards (mobile). | Filtre por status (Criado, Confirmado, Pago, Cancelado, Enviado, Entregue). Clique para ver detalhes. |
| **Detalhe do Pedido** | Itens, valores, timeline visual do status (Criado → Reservado → Confirmado → Pago → Cancelado), botão de cancelamento. | Acompanhe o progresso pela timeline. Cancele se necessário. |
| **Perfil** | Dados da sessão: e-mail, tenant, plano, região, roles e permissões. | Apenas visualização. |

---

### 2.2 Ops Portal (Portal de Operações)

**URL**: `ops-portal-staging.up.railway.app`

**Público-alvo**: Equipe operacional (gestores de pedidos, estoque e finanças).

#### Telas

| Tela | Descrição | Como operar |
|------|-----------|-------------|
| **Dashboard** | Painel com 4 KPIs (Total de Pedidos, Receita Total, Estoque Ativo, Pagamentos Pendentes), gráfico de receita dos últimos 7 dias, donut de pedidos por status, tabela de pedidos recentes, alertas de estoque baixo. | Visão geral rápida. Clique nos pedidos recentes para navegar ao detalhe. |
| **Pedidos** | Tabela com todos os pedidos (ID, cliente, total, status, data). | Visualize e navegue para detalhes de cada pedido. |
| **Criar Pedido** | Formulário: Cliente ID, moeda, itens (SKU, quantidade, preço unitário). Cálculo automático do total. | Preencha o cliente, adicione itens e clique "Criar". |
| **Detalhe do Pedido** | Informações completas: cliente, moeda, total, status, itens com preço unitário e subtotal. Ações: confirmar ou cancelar. | Use os botões "Confirmar" ou "Cancelar" conforme necessário. |
| **Ajustes de Estoque** | Tabela com todos os ajustes (data, SKU, tipo, quantidade, motivo). | Visualize o histórico. Use "Novo Ajuste" para criar. |
| **Criar Ajuste** | Formulário: SKU, tipo (Entrada/Saída/Ajuste), quantidade, motivo. | Preencha e confirme. Ideal para recebimentos de NF, correções de inventário ou baixas. |
| **Pagamentos** | Tabela de payment intents (ID, cliente, valor com moeda, status). Botão para confirmar pagamentos pendentes. | Confirme pagamentos autorizados. |
| **Ledger — Lançamentos** | Tabela de lançamentos contábeis (data, tipo CRÉDITO/DÉBITO, valor, moeda, descrição, referência). | Consulte o histórico contábil. Filtre por data. |
| **Ledger — Balanços** | Cards por conta contábil (CASH, REVENUE, REFUND_EXPENSE) com créditos, débitos e saldo por moeda. | Visão consolidada dos saldos. Use "Atualizar" para recarregar. |

---

### 2.3 Admin Console (Console Administrativo)

**URL**: `admin-console-staging.up.railway.app`

**Público-alvo**: Administradores da plataforma e gestores de governança.

#### Telas

| Tela | Descrição | Como operar |
|------|-----------|-------------|
| **Tenants** | Lista de todas as organizações com nome, plano, status e data de criação. | Clique para editar. Use "Impersonar" para assumir o contexto de outro tenant. |
| **Detalhe/Edição de Tenant** | Formulário com nome, plano (starter/pro/enterprise), região. Ações: ativar, suspender. | Edite os campos e salve. Suspenda tenants inadimplentes. |
| **Onboarding de Tenant** | Stepper de 5 etapas: **1. Organização** (nome, região), **2. Plano** (com preços e features de cada plano), **3. Configuração** (feature flags e e-mail do admin), **4. Revisão**, **5. Pronto**. | Siga o fluxo passo a passo para criar um novo tenant completo. |
| **Políticas (ABAC/RBAC)** | Tabela de políticas de acesso: permission code, efeito (Permitir/Negar), habilitada, notas. Criar, editar, remover. | Gerencie quem pode fazer o quê. Ex: `orders:write` permitido apenas para planos pro/enterprise. |
| **Feature Flags** | Flags por tenant: nome, habilitada, rollout %. Criar, toggle, remover. | O tenant do usuário é auto-selecionado ao entrar. Troque o tenant no header se necessário. Ative/desative funcionalidades por tenant. |
| **Usuários** | Lista de usuários: nome, e-mail, roles, status. Convidar, editar, remover. Totalmente internacionalizado. | Gerencie o acesso dos usuários ao sistema. |
| **Log de Auditoria** | Tabela de eventos: data, ação, status HTTP (derivado em SUCCESS/DENIED/ERROR), ator, recurso, correlation ID. | Investigue ações sensíveis. Filtre por ação ou ator. |
| **Assistente IA** | **Chat**: perguntas sobre governança e segurança. **Análise de Auditoria**: análise de segurança dos logs. **Recomendações**: sugestões de governança. **Insights**: indicadores de saúde do sistema. | Use o chat para perguntas. Clique nos cards para análises automáticas. |

---

## 3. Modelo de Segurança

### Autenticação
- Login via e-mail/senha com JWT (HS256)
- Token contém: sub (email), tid (tenant_id), roles, perms (permissões), plan, region
- Expiração configurável, refresh automático no frontend

### Autorização (ABAC + RBAC)
- **RBAC**: Roles (admin, ops, viewer, member) definem conjuntos de permissões
- **ABAC**: Políticas granulares por permissão, filtráveis por plano e região
- **Default-deny**: sem política = acesso negado
- **DENY precedente**: uma política DENY sobrepõe qualquer ALLOW
- Todos os serviços (Spring, NestJS, FastAPI) aplicam ABAC consistentemente

### Roles padrão

| Role | Permissões |
|------|-----------|
| **admin** | Tudo: tenants, políticas, flags, auditoria, users, orders, inventory, payments, ledger, products, analytics, profile |
| **ops** | Operações: orders, inventory, products, payments, ledger, profile |
| **viewer** | Leitura: orders, inventory, payments, ledger, products, profile |
| **member** | Básico: products (leitura), orders (leitura), profile |

---

## 4. Módulos e Funcionalidades

### 4.1 Gestão de Pedidos
- Criação de pedidos com múltiplos itens (SKU, quantidade, preço)
- Ciclo de vida: CREATED → RESERVED → CONFIRMED → SHIPPED → DELIVERED → PAID / CANCELLED
- Rastreamento com código e URL de tracking
- Vínculo automático com inventário e pagamentos

### 4.2 Catálogo de Produtos
- Produtos por tenant com SKU, nome, preço, categoria, descrição, imagem, rating
- Filtros por categoria, preço, disponibilidade
- Busca por nome, SKU ou categoria
- Paginação e ordenação (relevância, preço, nome, avaliação)

### 4.3 Gestão de Estoque
- Itens de inventário por tenant/SKU com quantidade disponível e reservada
- Ajustes de estoque: Entrada (recebimento), Saída (venda), Ajuste (inventário)
- Alertas de estoque baixo no dashboard
- Rastreabilidade com motivo, ator e correlation ID

### 4.4 Pagamentos e Ledger
- Payment intents com status: CREATED → AUTHORIZED → SETTLED / REFUNDED / VOIDED / PARTIALLY_REFUNDED
- Suporte a múltiplas moedas (BRL, USD)
- Ledger contábil de dupla entrada (DEBIT/CREDIT)
- Balanços por conta contábil (CASH, REVENUE, REFUND_EXPENSE) e moeda
- Suporte a gateways: Stripe, PagSeguro, MercadoPago

### 4.5 Governança e Compliance
- Políticas ABAC editáveis em tempo real
- Feature flags por tenant com rollout percentual
- Log de auditoria completo com 50+ tipos de ação
- Exportação de audit log (CSV)
- Correlation ID para rastreamento end-to-end

### 4.6 Assistente IA
- Chat conversacional sobre governança e segurança
- Análise automática de logs de auditoria
- Recomendações de governança baseadas no estado atual
- Insights de saúde do sistema e detecção de anomalias

---

## 5. Internacionalização

O sistema suporta **Português (pt-BR)** e **Inglês (en-US)** em todas as interfaces:
- Textos de navegação, botões, labels, mensagens de erro
- Nomes de status traduzidos (Confirmado, Enviado, Entregue, Liquidado, etc.)
- Formatação de moeda respeitando o código da moeda do pedido/pagamento (R$ para BRL, $ para USD)
- Formatação de datas no padrão brasileiro (dd/MM/yyyy)

---

## 6. Vantagens da Plataforma

### Para o Negócio
- **Multi-tenant nativo**: uma única infraestrutura serve múltiplas organizações com isolamento total
- **Planos escalonáveis**: starter, professional, enterprise com controle granular de features
- **Time-to-market rápido**: onboarding de novos tenants em minutos via stepper guiado
- **Compliance integrado**: auditoria completa, ABAC, feature flags, sem configuração adicional

### Para Operações
- **Dashboard unificado**: visão 360° de pedidos, receita, estoque e pagamentos
- **Fluxo completo**: do catálogo ao pagamento, passando por estoque e contabilidade
- **Ledger contábil**: dupla entrada automática para reconciliação financeira
- **Alertas proativos**: estoque baixo identificado automaticamente

### Para TI
- **Microsserviços independentes**: cada serviço pode escalar, deployar e falhar independentemente
- **JWT padronizado**: contrato único de autenticação entre todos os serviços
- **ABAC consistente**: mesmas regras de acesso em Java, Node.js e Python
- **Observabilidade**: health checks, Prometheus-ready, correlation ID em todos os logs
- **CI/CD automatizado**: GitHub Actions para lint, test, build e deploy contínuo
- **Gitflow rigoroso**: branches develop/master com merge --no-ff para rastreabilidade

### Para Segurança
- **Default-deny**: sem política explícita, acesso negado
- **DENY precedente**: impossível "furar" uma negação com outra regra
- **Auditoria completa**: todas as ações sensíveis e negações são registradas
- **Sem credenciais em código**: variáveis de ambiente em produção
- **BCrypt para senhas**: hashing seguro com salt

---

## 7. Como Operar

### Login
1. Acesse qualquer frontend (Shop, Ops Portal ou Admin Console)
2. Insira e-mail e senha
3. O sistema emite um JWT e redireciona para a tela inicial

### Fluxo típico de Venda (Shop)
1. **Catálogo** → Navegue e adicione produtos ao carrinho
2. **Checkout** → Preencha dados de entrega, revise e confirme
3. **Pedido Criado** → Acompanhe em "Meus Pedidos"

### Fluxo típico de Operação (Ops Portal)
1. **Dashboard** → Verifique KPIs e alertas
2. **Pedidos** → Confirme pedidos pendentes
3. **Pagamentos** → Confirme pagamentos autorizados
4. **Estoque** → Registre entradas/saídas/ajustes
5. **Ledger** → Consulte lançamentos e balanços contábeis

### Fluxo típico de Administração (Admin Console)
1. **Tenants** → Crie/gerencie organizações
2. **Políticas** → Configure regras de acesso ABAC
3. **Feature Flags** → Ative/desative funcionalidades por tenant
4. **Usuários** → Convide e gerencie acesso
5. **Auditoria** → Investigue ações e anomalias
6. **IA** → Obtenha recomendações e análises automáticas

---

## 8. Infraestrutura

| Componente | Tecnologia |
|-----------|-----------|
| Cloud | Railway |
| Banco de Dados | PostgreSQL (compartilhado, isolamento por tenant_id) |
| Mensageria | RabbitMQ (outbox pattern) |
| CI/CD | GitHub Actions |
| Monorepo Frontend | Nx 22 + Angular 19 |
| Migrações DB | Liquibase (spring-saas-core) + Prisma (node-b2b-orders) |
| Containerização | Docker |

---

## 9. Ambientes

| Ambiente | Descrição |
|----------|-----------|
| **Staging** | Ambiente de testes com dados de demonstração. Todos os serviços deployados no Railway. |
| **Produção** | Ambiente de produção (configuração via variáveis de ambiente). |

### URLs de Staging

| Serviço | URL |
|---------|-----|
| Shop | `https://shop-frontend-staging.up.railway.app` |
| Ops Portal | `https://ops-portal-staging.up.railway.app` |
| Admin Console | `https://admin-console-staging-b1ab.up.railway.app` |
| Core API | `https://spring-saas-core-staging.up.railway.app` |
| Orders API | `https://node-b2b-orders-staging.up.railway.app` |
| Payments API | `https://py-payments-ledger-staging.up.railway.app` |
