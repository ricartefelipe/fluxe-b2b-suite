# O que falta para o produto estar 100% vendável

Checklist objetivo do que ainda falta implementar ou validar para considerar o produto **pronto para venda** (go-to-market). Complementa [VISTORIA-COMPLETA.md](VISTORIA-COMPLETA.md) e [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md).

---

## 1. Operacional (deploy e painéis)

| Item | Status | Notas |
|------|--------|--------|
| **Config dos frontends em staging/produção** | ✅ Documentado | **ops-portal** e **admin-console**: variáveis com **URLs absolutas**; secção 5 e checklist em [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md). |
| **Tenant context quando Core falha** | ✅ Corrigido | Se a lista de tenants não carregar (Core inacessível), o Ops/Admin agora usam o `tenantId` da sessão para enviar `X-Tenant-Id` nas requisições, evitando dashboard vazio. |
| **Checklist pós-deploy** | ✅ Documentado | Health checks, login, Shop, Dashboard Ops, Admin tenants, JWT único, CORS — em [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md#checklist-pós-deploy). |
| **Seed de staging** | ✅ Existe | `scripts/staging-seed.sh`; ver [AMBIENTES-CONFIGURACAO.md](AMBIENTES-CONFIGURACAO.md). |

---

## 2. Legal e compliance

| Item | Status | Notas |
|------|--------|--------|
| **Termos de uso** | ✅ Implementado | Página `/terms` no Shop com conteúdo completo; link no rodapé da landing. |
| **Política de privacidade** | ✅ Implementado | Página `/privacy` no Shop (LGPD/GDPR, retenção, cookies); link no rodapé da landing. |
| **Cookies / consent** | ✅ Implementado | Banner mínimo no Shop (texto + link Política de Privacidade + "Entendi"); consent gravado em `localStorage`. |

---

## 3. Billing e cobrança

| Item | Status | Notas |
|------|--------|--------|
| **Stripe Billing** | ✅ Implementado | Planos, assinaturas, portal Stripe (spring-saas-core); página de Faturamento no Admin Console. |
| **Webhook Stripe** | ✅ Implementado | Retorno e validação de tenant documentados no CHANGELOG. |
| **Limites por plano** | ✅ Existe | ABAC/RN com `allowedPlans`; rate limiting por plano. |
| **Preços e planos na landing** | ✅ Existe | Landing `/welcome` com 3 planos e pricing. |

---

## 4. Suporte e contato

| Item | Status | Notas |
|------|--------|--------|
| **Canal de suporte** | ✅ Implementado | Email, chat ou link “Fale conosco” na aplicação ou na landing. |
| **Documentação para o cliente** | ✅ Coberto | Link "Ajuda" no rodapé da landing: se `SUPPORT_DOCS_URL` definido (Shop), abre URL externa; senão leva para Fale conosco. GUIA-DO-SISTEMA e MANUAL-SISTEMA disponíveis no repositório. |

---

## 5. Onboarding e primeiro uso

| Item | Status | Notas |
|------|--------|--------|
| **Onboarding de tenant (wizard)** | ✅ Existe | Stepper no Admin: organização, plano, configuração, revisão. |
| **Signup self-service** | ✅ Existe | “Criar conta” / signup com tenant + admin. |
| **Convite com senha temporária** | ✅ Implementado | Backend (hash) + template de email com senha temporária. |

---

## 6. Experiência e resiliência

| Item | Status | Notas |
|------|--------|--------|
| **Mensagem de erro no dashboard** | ✅ Implementado | Quando `loadAll` falha no painel Ops, exibe card com mensagem clara e botão "Tentar novamente" (“Não foi possível carregar os dados. Verifique as URLs das APIs no ambiente.”). |
| **CORS em produção** | ✅ Documentado | Tabela em [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md#51-cors-nos-backends): variável por backend (`CORS_ALLOWED_ORIGINS` / `CORS_ORIGINS`) e exemplo; checklist pós-deploy inclui CORS. |

---

## Resumo


Todos os itens acima estão implementados ou documentados. O produto está **100% vendável** do ponto de vista operacional, legal, billing e suporte.

- **Config e CORS:** DEPLOY-RAILWAY (URLs absolutas para ops/admin; tabela CORS nos backends).
- **Legal e suporte:** Termos, Privacidade, Fale conosco, banner de cookies, link Ajuda configurável (SUPPORT_DOCS_URL).
- **E-mail de suporte:** Configurável via SUPPORT_EMAIL no Shop ou via i18n.

### Depois do “100% vendável”: vender e monitorizar

Para uma **sequência única** (staging → observabilidade → promoção → produção → hábitos), usar [EXECUCAO-VENDA-MONITORIZACAO.md](EXECUCAO-VENDA-MONITORIZACAO.md) em conjunto com [GO-LIVE-VENDA.md](GO-LIVE-VENDA.md) e [MONITORING-THRESHOLDS.md](MONITORING-THRESHOLDS.md).
