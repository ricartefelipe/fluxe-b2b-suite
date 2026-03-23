# API por casos de uso — spring-saas-core

Documentação da API do Core organizada por fluxos de uso. Para a especificação OpenAPI completa, veja `spring-saas-core/docs/api/openapi.yaml`.

---

## Autenticação e usuário

| Caso de uso | Método | Path | Descrição |
|-------------|--------|------|-----------|
| Login | POST | `/v1/auth/login` | Retorna JWT (access + refresh). Header `X-Tenant-Id` obrigatório para multi-tenant. |
| Refresh token | POST | `/v1/auth/refresh` | Renova o access token usando o refresh token. |
| Dados do usuário logado | GET | `/v1/me` | Retorna perfil (id, email, name, tenantId, roles, status). |
| Redefinir senha (solicitar) | POST | `/v1/auth/forgot-password` | Envia e-mail com link de redefinição. |
| Redefinir senha (confirmar) | POST | `/v1/auth/reset-password` | Confirma nova senha com token do e-mail. |
| Trocar senha (logado) | POST | `/v1/auth/change-password` | Altera senha do usuário autenticado. |

---

## Onboarding (primeiro tenant)

| Caso de uso | Método | Path | Descrição |
|-------------|--------|------|-----------|
| Criar empresa + admin | POST | `/v1/onboarding` | Cria tenant e primeiro usuário (admin). Sem autenticação. Dispara e-mail de boas-vindas e evento `onboarding.completed`. |

---

## Tenants

| Caso de uso | Método | Path | Descrição |
|-------------|--------|------|-----------|
| Listar tenants | GET | `/v1/tenants` | Paginação por cursor; filtros: status, plan, region, name. |
| Criar tenant | POST | `/v1/tenants` | Apenas para contexto de plataforma (ex.: Admin Console). |
| Buscar tenant | GET | `/v1/tenants/{id}` | Detalhe de um tenant. |
| Atualizar tenant | PATCH | `/v1/tenants/{id}` | Atualiza nome, plan, region, status. |

---

## Usuários do tenant

| Caso de uso | Método | Path | Descrição |
|-------------|--------|------|-----------|
| Listar usuários | GET | `/v1/tenants/{tenantId}/users` | Usuários do tenant. |
| Convidar usuário | POST | `/v1/tenants/{tenantId}/users/invite` | Envia convite por e-mail (senha temporária opcional). Dispara evento `user.invited`. |
| Atualizar usuário | PATCH | `/v1/tenants/{tenantId}/users/{userId}` | Nome, roles, status. Dispara `user.updated`. |
| Remover usuário | DELETE | `/v1/tenants/{tenantId}/users/{userId}` | Soft delete. Dispara `user.deleted`. |

---

## Faturamento e assinatura

| Caso de uso | Método | Path | Descrição |
|-------------|--------|------|-----------|
| Iniciar trial | POST | `/v1/billing/trial` | Associa trial ao tenant (sem cartão). Body: `{ "planSlug": "starter" }`. |
| Assinatura atual | GET | `/v1/billing/subscription` | Retorna plano, status, período, `trialEndsAt` (se trial). |
| Portal de cobrança | POST | `/v1/billing/portal` | Cria sessão do Stripe Customer Portal; retorna URL para redirecionar. |
| Listar planos | GET | `/v1/billing/plans` | Catálogo de planos (slug, displayName, preço, limites). |

---

## Políticas (ABAC/RBAC)

| Caso de uso | Método | Path | Descrição |
|-------------|--------|------|-----------|
| Listar políticas | GET | `/v1/policies` | Políticas aplicáveis ao tenant (plan/region). |
| Criar política | POST | `/v1/policies` | permission_code, effect, allowed_plans, allowed_regions. |
| Atualizar/remover | PATCH/DELETE | `/v1/policies/{id}` | Edição e soft delete. |

---

## Feature flags

| Caso de uso | Método | Path | Descrição |
|-------------|--------|------|-----------|
| Listar flags | GET | `/v1/feature-flags` | Flags do tenant. |
| Criar/atualizar | PUT | `/v1/feature-flags` | Cria ou atualiza por nome. |
| Avaliar flag | GET | `/v1/feature-flags/{name}` | Retorna enabled, rollout, etc. |

---

## Auditoria

| Caso de uso | Método | Path | Descrição |
|-------------|--------|------|-----------|
| Consultar audit log | GET | `/v1/audit` | Filtros por tenant, usuário, ação, período. |
| Exportar audit | GET | `/v1/audit/export` | Exportação (ex.: CSV) conforme permissão. |

---

## Webhooks

| Caso de uso | Método | Path | Descrição |
|-------------|--------|------|-----------|
| Registrar endpoint | POST | `/v1/webhooks` | url, secret, events (lista de tipos). Permissão `webhooks:manage`. |
| Listar endpoints | GET | `/v1/webhooks` | Endpoints do tenant. |
| Remover endpoint | DELETE | `/v1/webhooks/{id}` | Remove o endpoint. |

Tipos de evento disponíveis para inscrição: ver [Catálogo de Webhooks (Core)](./WEBHOOKS-CATALOGO.md).

---

## Snapshot e métricas

| Caso de uso | Método | Path | Descrição |
|-------------|--------|------|-----------|
| Uso do tenant | GET | `/v1/snapshot/usage` | Resumo de uso (ex.: usuários X/Y) para billing. |
| Health | GET | `/healthz`, `/readyz` | Liveness e readiness. |
