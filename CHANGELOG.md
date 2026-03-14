# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
