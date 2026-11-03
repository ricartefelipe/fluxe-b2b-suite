# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.7] - 2026-11-03

### Security
- stack de produção: RabbitMQ 4.4.0 (a linha 3 não recebe mais correções), Keycloak 26.8.1 fixado por digest (antes 26.0 sem versão fixa, com 102 achados altos e críticos), Postgres sem `gosu`, Redis e Nginx atualizados.

### Changed
- o guia de operação explica como sair de um volume criado pela 3.13: a 4.4 arranca sobre ele mas perde as mensagens das filas; o caminho seguro passa pela 4.2.9. Também documenta o reinício dos workers depois de recriar o volume, necessário até node-b2b-orders 1.4.6 e py-payments-ledger 2.0.5.

## [1.5.6] - 2026-11-03

### Security
- painéis e shop com imagem base corrigida e sem npm na etapa final, eliminando falhas críticas e altas.

## [1.5.5] - 2026-11-03

### Security
- Console: administrador de locatário não vê mais criar, suspender, ativar, salvar ou trocar de locatário, nem criar ou apagar política. Assistente fica só para a plataforma. Acompanha o isolamento do `spring-saas-core`.

### Fixed
- Portais só abrem depois de escolher o locatário. A plataforma via dados de outro locatário sob o nome do selecionado ao recarregar a página.
- Portal de operações e console não pedem a lista de locatários sem `tenants:read`, o que mostrava erro ao entrar.
- `scripts/demo-seed.sh`: o pagamento vem da confirmação do pedido, como numa compra real. Antes criava um pagamento extra por pedido, com valor fixo. Também espera o limite de escritas da API, corrige a confirmação e falha quando a carga fica incompleta.

## [1.5.4] - 2026-11-02

### Fixed
- Loja: uma compra gera um único pagamento. A loja não cria mais pagamento próprio: ele nasce no backend ao confirmar o pedido.
- Telas de pagamento: a política deixa de exigir `region-a` ou `region-b`, igual à do serviço de pagamentos, que não restringe região.

### Changed
- Novo pedido no portal de operação: o preço vem do catálogo, sem campo de preço unitário.

## [1.5.3] - 2026-11-02

### Removed
- Configuração, documentação de operação e workflows do Railway.
- Pasta de rascunhos `docs/superpowers`.

## [1.5.2] - 2026-11-02

### Fixed
- Loja: depois de concluir a compra, o carrinho esvaziado invalidava a primeira etapa e o checkout ficava na revisão com total zero, sem mostrar a confirmação.

## [1.5.1] - 2026-10-29

Observação: a versão 1.5.0 foi registrada neste changelog sem tag publicada; a tag `v1.5.1` é a primeira após a `v1.4.0`.

### Fixed
- **deps:** declara o runtime OXC que o Angular 21.2 importa; builds não dependem mais de hoisting acidental.
- **nx:** saídas de cobertura ancoradas em `{workspaceRoot}`; cache distribuído deixa de gravar fora do workspace.
- **docker:** healthcheck do shop segue a porta configurada (`PORT`, padrão 4000).
- **e2e:** helpers de login dos Playwright encontram o campo rotulado "E-mail" (admin-console, ops-portal e shop).

### CI
- Deploys só publicam com a CI do mesmo SHA aprovada (`require-ci`).
- A sincronização destrutiva master↔develop foi substituída por verificação somente leitura (`check-master-sync.yml`, `scripts/check-branch-sync.sh`) que distingue iguais, ausente, divergentes e master com commits exclusivos.

## [1.5.0] - 2026-03-15

### Added
- **Staging — script de seed:** `scripts/staging-seed.sh railway` orquestra migrations + seeds de node-b2b-orders e py-payments-ledger no Railway (staging); spring-saas-core já recebe seed no deploy com profile `staging`
- **Docs:** DEPLOY-RAILWAY e AMBIENTES-CONFIGURACAO atualizados com passos para alimentar staging; README da documentação com link para scripts operacionais (staging-seed, demo-seed) e para DEPLOY-RAILWAY
- **Go-live para venda**: [docs/GO-LIVE-VENDA.md](docs/GO-LIVE-VENDA.md) — checklist completo (produção, Stripe, Resend, domínio, OIDC, migrations, termos)
- **Termos e privacidade**: [docs/TERMOS-PRIVACIDADE.md](docs/TERMOS-PRIVACIDADE.md) — referência para publicação de Termos de Uso e Política de Privacidade
- **Fluxo de PR**: [docs/FLUXO-PR-FEATURE.md](docs/FLUXO-PR-FEATURE.md) — feature branch → PR → merge → apagar branch
- **Release e tags**: processo documentado em [PIPELINE-ESTEIRAS.md](docs/PIPELINE-ESTEIRAS.md) — criar tag (ex.: v1.5.0) ao promover develop → master

### Changed
- Separação explícita produção vs staging: seed completo apenas em staging; produção só migrations e dados via aplicação
- **DEPLOY-RAILWAY**: link para GO-LIVE-VENDA, seção domínio customizado e SSL expandida, AUTH_MODE=oidc em produção
- **Frontends railway.prod.env.example**: AUTH_MODE=oidc como padrão produção, comentários para OIDC e domínios
- **docs/README.md**: índice atualizado com GO-LIVE-VENDA, FLUXO-PR-FEATURE, DEPLOY-RAILWAY, TERMOS-PRIVACIDADE
- **PIPELINE-ESTEIRAS**: checklist de setup com link para GO-LIVE-VENDA

## [1.4.0] - 2026-03-14

### Added
- **Billing/assinatura real**: Stripe Billing integrado no spring-saas-core (StripeBillingPort, StripeBillingAdapter, NoopBillingAdapter)
- **Email transacional**: EmailSender conectado em password reset, invite e welcome; ResendEmailSender adapter (api.resend.com)
- **Página de Faturamento**: Admin Console com status de assinatura, planos, portal Stripe, troca de plano
- **Landing page**: /welcome no Shop com hero, 4 features, 3 planos, tech stack (i18n completo)
- **Link signup na login**: "Criar conta" em todas as telas de login
- **Testes**: NoopBillingAdapterTest, LogEmailSenderTest (spring); billing.page.spec, landing.component.spec (frontend); test_gateway_factory (python)

### Changed
- **Gateways**: Factory corrigida (api_key_ref por provider); PagSeguro/MercadoPago webhooks com verificação; MercadoPago delete_payment_method implementado
- **Migration 010**: stripe_customer_id, stripe_price_id, stripe_subscription_id em tenants/plan_definitions/subscriptions

### Configuration (produção)
- spring-saas-core: STRIPE_BILLING_SECRET_KEY, RESEND_API_KEY, FRONTEND_URL, app.billing.provider=stripe, app.email.provider=resend
- py-payments-ledger: GATEWAY_PROVIDER, STRIPE_API_KEY, PAGSEGURO_TOKEN, MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_WEBHOOK_SECRET

## [1.3.0] - 2026-03-14

### Security
- XSS: sanitização de innerHTML com DomSanitizer em ai.page.ts (conteúdo LLM)
- XSS: escape de HTML em highlightMatch do global-search antes de aplicar <mark>
- Ledger: validação debits == credits antes de persistir (LedgerImbalanceError)
- Stripe webhook: retorno corrigido de tuple para JSONResponse, validação de tenant
- Exceções de domínio tipadas em todos os backends (PaymentNotFound, InvalidOrderState, etc.)

### Added
- spring-saas-core: Value objects Email e TenantId com validação
- spring-saas-core: OpenAPI @Operation em 7 controllers (27 endpoints)
- spring-saas-core: ABAC centralizado com enforceOrThrow()
- spring-saas-core: AuditLogger movido para application/port
- node-b2b-orders: WebhooksModule registrado no AppModule
- node-b2b-orders: AuthRequest tipado (substitui req:any)
- node-b2b-orders: IOrderRepository interface (ports & adapters)
- node-b2b-orders: Idempotência no cancel via Redis
- py-payments-ledger: Global exception handler (DomainError, HTTPException, ValidationError)
- py-payments-ledger: Exceções de domínio (PaymentNotFound, InvalidPaymentState, etc.)
- Frontend: OnPush em 18 componentes de página
- Frontend: Bootstrap error handling no Shop
- Frontend: Testes para OpsShellComponent e AdminShellComponent

### Fixed
- readyz retorna 503 (era 200) quando componentes falham (node + python)
- Handlers globais para EmailAlreadyExists/UserAlreadyExists no spring-saas-core
- RuntimeException eliminado: CryptoException e AiServiceException tipados
- Removido try-catch duplicado em AuthController, UserController, OnboardingController
- Coverage thresholds elevados: node 20/22/25/25, frontend passWithNoTests removido
- Track $index corrigido para track item.sku em order-detail (shop)
- Formatação Spotless (Java) e Black (Python) aplicadas

## [1.2.0] - 2026-03-14

### Fixed
- Paginação: todos os clientes orders/inventory agora usam cursor-based (CursorResponse) alinhado ao backend
- Paginação: payments e ledger usam limit/offset alinhado ao backend Python
- Campos: InventoryItem qty/reservedQty/availableQty, InventoryAdjustment qty, CreateAdjustmentRequest qty
- Campos: AuditLog actorSub/statusCode (derivação de outcome), Policy notes (era description)
- Campos: Order.currency agora opcional com fallback 'BRL', OrderItem sem description inexistente
- Campos: FeatureFlag sem description/metadata, agora com rolloutPercent/allowedRoles
- Campos: Tenant sem slug, TenantPlan 'pro' (era 'professional'), TenantStatus inclui 'DELETED'
- Checkout: recarrega pedido após createOrder/confirmOrder para dados completos, retry para race condition RESERVED
- Sort products: 'rating'/'relevance' mapeados para 'createdAt' (backend não suporta)
- Search service: todos os campos alinhados com os novos modelos
- Dashboard store: parâmetros de paginação corrigidos para cursor/limit
- Onboarding: removido slug de todo o fluxo, flags sem description no request

### Changed
- Modelos de dados alinhados com as APIs reais: node-b2b-orders, spring-saas-core, py-payments-ledger
- i18n completo: users-list.page, shop-shell, profile, todas as chaves de admin (actor, rollout, statusDeleted, user CRUD)
- Audit list: filtro por actorSub, outcome derivado de statusCode
- Flags list: coluna rolloutPercent substituiu description
- Policies list: campo notes substituiu description

## [1.1.1] - 2026-03-14

### Fixed
- Admin Console: tenant auto-selecionado ao inicializar (JWT ou primeiro da lista)
- Feature Flags: tela sempre vazia corrigida — recarrega reativamente ao mudar de tenant
- Página de flags agora usa `effect()` + `untracked()` para reatividade segura com Angular Signals

## [1.0.0] - 2026-03-07

### Added
- Complete B2B Suite frontend with Angular (Nx monorepo)
- Functional login with authentication flow
- User profile page and user menu
- Shop application with dedicated Dockerfile
- Product catalog and checkout flow
- Full UI redesign with modern styling for production
- Infrastructure for Oracle Cloud Free Tier ARM deployment
- Step-by-step deployment guide for beginners
- Runtime environment injection via `config.template.json`
- Health check scripts for SSR applications
- i18n support and documentation

### Changed
- CI updated to use pnpm package manager
- `.nx/` cache removed from repository and added to `.gitignore`

### Fixed
- SSR `requestIdleCallback` protected with `isPlatformBrowser` guard
- Authentication route configuration corrected
- Docker builds now copy `config.template.json` for runtime env injection
- SSR browser API calls guarded against server-side execution
