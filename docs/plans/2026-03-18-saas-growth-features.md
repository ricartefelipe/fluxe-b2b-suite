# Plano de Implementação — Funcionalidades SaaS para Aquisição e Retenção

> **For Claude:** Executar tarefa a tarefa; TDD obrigatório; branch feature/* por entrega; PR para develop após CI verde.

**Objetivo:** Implementar as funcionalidades inspiradas em SaaS de referência (Stripe, Notion, Intercom, etc.) para aumentar aquisição e retenção de clientes, com código de alta qualidade, testes e Git Flow impecáveis.

**Arquitetura:** Frontend (Angular/Nx) no fluxe-b2b-suite; backend (Spring Boot) no spring-saas-core quando necessário. Cada entrega em branch própria, testes antes de implementação (TDD), documentação atualizada.

**Stack:** Angular 19, Nx, Jest/Testing Library, Spring Boot 3.2, Liquibase, PostgreSQL.

---

## Fase 1 — Fundação (alta prioridade)

### Task 1.1: Checklist de onboarding no admin

**Objetivo:** Barra/card "Conclua sua configuração" no admin com passos: (1) Criar tenant, (2) Convidar usuário, (3) Configurar billing. Exibir quando houver passo pendente; permitir dispensar (localStorage) e reabrir.

**Arquivos:**
- Criar: `saas-suite-ui/libs/domains/onboarding/src/lib/onboarding-checklist.store.ts`
- Criar: `saas-suite-ui/libs/domains/onboarding/src/lib/onboarding-checklist.store.spec.ts`
- Criar: `saas-suite-ui/libs/shared/ui/src/lib/onboarding-checklist/onboarding-checklist.component.ts`
- Criar: `saas-suite-ui/libs/shared/ui/src/lib/onboarding-checklist/onboarding-checklist.component.spec.ts`
- Modificar: `saas-suite-ui/apps/admin-console/src/app/admin-shell.component.ts` (incluir checklist no template)
- Modificar: `saas-suite-ui/libs/shared/i18n/src/lib/pt-br.messages.ts` e `en-us.messages.ts` (chaves onboarding)
- Testar: specs acima; e2e opcional.

**TDD:**
1. Escrever teste do store: dado tenant count 0, users 0, subscription null → steps criar tenant e convidar usuário e configurar billing não concluídos.
2. Escrever teste: dado tenant count ≥ 1, users ≥ 1, subscription presente → todos concluídos (ou lógica definida).
3. Implementar store (sinais, computed steps, dismissed).
4. Escrever teste do componente: exibe título e lista de passos; emite evento ao dispensar.
5. Implementar componente; integrar no shell.

**Git:** branch `feature/onboarding-checklist`, commits atômicos, PR para develop.

---

### Task 1.2: Painel "Seu uso este mês" no admin

**Objetivo:** Card ou seção na dashboard/admin com uso atual vs limite do plano (ex.: usuários 3/10, pedidos 50/500). Dados do Core (tenants, users) e do billing (subscription, plan limits).

**Arquivos:**
- Backend: `spring-saas-core` — endpoint GET `/v1/usage` ou estender tenant/billing (se já existir).
- Criar: `saas-suite-ui/libs/data-access/core/src/lib/models/usage.model.ts`
- Criar: `saas-suite-ui/apps/admin-console/src/app/pages/usage-widget.component.ts` (ou dentro de billing/dashboard)
- Modificar: Core API client para `getUsage()` ou equivalente.
- Testes: unit para widget; integração para API se novo endpoint.

**TDD:** Teste que dado usage { users: 3, usersLimit: 10 } exibe "3/10 usuários"; depois implementar.

---

### Task 1.3: Status page e changelog público

**Objetivo:** Página estática ou mínima (pode ser em repo ou site separado) com status dos serviços (Core, Admin, Ops, Shop) e changelog com releases. Opção: rota `/status` e `/changelog` no admin ou landing.

**Arquivos:**
- Criar: `saas-suite-ui/apps/admin-console/src/app/pages/status.page.ts` (ou shared) — lê de config/JSON.
- Criar: `saas-suite-ui/apps/admin-console/src/app/pages/changelog.page.ts` — lê CHANGELOG.md ou JSON.
- Rotas em `app.routes.ts`.
- Testes: componente renderiza lista de serviços e entradas de changelog.

---

## Fase 2 — Trials e primeiros 30 dias

### Task 2.1: Trial gratuito (14/30 dias) sem cartão

- Backend: regras de trial no billing (já existe `trialEndsAt`); garantir que signup sem cartão inicia trial.
- Frontend: mensagem "Seu trial termina em X dias" e CTA para adicionar cartão.
- Testes: unidade e e2e signup → tenant em trial.

### Task 2.2: E-mails pós-signup (dia 1, 3, 7)

- Backend: jobs ou handoff para Resend (já configurado); templates welcome, dica dia 3, reengajamento dia 7.
- Testes: envio mockado; integração opcional.

---

## Fase 3 — Suporte e adoção

### Task 3.1: Base de conhecimento / FAQ in-app

- Conteúdo em markdown ou JSON; rota `/help` ou `/docs` no admin/ops; componente de leitura.
- Task 3.2: Widget "Fale conosco" (link para e-mail ou tipo de ticket com contexto tenant/tela).

---

## Fase 4 — Integrações e API

### Task 4.1: Documentação de API por casos de uso

- OpenAPI já existe; adicionar seção "Casos de uso" na doc (ex.: "Criar tenant", "Listar pedidos") com exemplos de request/response.
- Task 4.2: Catálogo de webhooks (eventos, payload, retry) em doc e opcionalmente em UI.

---

## Fase 5 — Retenção

### Task 5.1: Métricas de saúde do tenant (admin interno)

- Indicador "último login", "usuários ativos no mês"; alerta para tenants inativos.
- Task 5.2: E-mail de reativação para tenant inativo (Resend).
- Task 5.3: Exportar dados e "agendar cancelamento" (offboarding).

---

## Ordem de execução recomendada

1. **Task 1.1** — Onboarding checklist (esta sessão).
2. **Task 1.2** — Painel de uso.
3. **Task 1.3** — Status + changelog.
4. Seguir Fases 2–5 conforme prioridade do produto.

---

## Padrões obrigatórios

- **TDD:** teste falhando → implementação mínima → teste passando → refactor.
- **Git Flow:** branch `feature/<nome>`, PR para `develop`, CI verde antes do merge.
- **Commits:** atômicos, mensagem sem menção a ferramentas.
- **Código:** sem código morto; funções pequenas; nomes descritivos; formatação ESLint/Prettier (front), Spotless (back).
