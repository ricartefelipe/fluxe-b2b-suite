# O que falta para o produto estar 100% vendável

Checklist objetivo do que ainda falta implementar ou validar para considerar o produto **pronto para venda** (go-to-market). Complementa [VISTORIA-COMPLETA.md](VISTORIA-COMPLETA.md) e [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md).

---

## 1. Operacional (deploy e painéis)

| Item | Status | Notas |
|------|--------|--------|
| **Config dos frontends em staging/produção** | ⚠️ Verificar | **ops-portal** e **admin-console** precisam das variáveis `CORE_API_BASE_URL`, `ORDERS_API_BASE_URL`, `PAYMENTS_API_BASE_URL` com **URLs absolutas** (ex.: `https://spring-saas-core-xxx.up.railway.app`). Sem isso, o painel do Ops (e do Admin) não carrega dados. Ver [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md#troubleshooting). |
| **Tenant context quando Core falha** | ✅ Corrigido | Se a lista de tenants não carregar (Core inacessível), o Ops/Admin agora usam o `tenantId` da sessão para enviar `X-Tenant-Id` nas requisições, evitando dashboard vazio. |
| **Checklist pós-deploy** | ✅ Documentado | Health checks, login, Shop, Dashboard Ops, Admin tenants, JWT único, CORS — em [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md#checklist-pós-deploy). |
| **Seed de staging** | ✅ Existe | `scripts/staging-seed.sh`; ver [AMBIENTES-CONFIGURACAO.md](AMBIENTES-CONFIGURACAO.md). |

---

## 2. Legal e compliance

| Item | Status | Notas |
|------|--------|--------|
| **Termos de uso** | ✅ Implementado | Página `/terms` no Shop com conteúdo completo; link no rodapé da landing. |
| **Política de privacidade** | ✅ Implementado | Página `/privacy` no Shop (LGPD/GDPR, retenção, cookies); link no rodapé da landing. |
| **Cookies / consent** | ⚠️ Parcial | Texto na Política de Privacidade (cookies necessários); banner de consent opcional não implementado. |

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
| **Documentação para o cliente** | ⚠️ Parcial | GUIA-DO-SISTEMA, MANUAL-SISTEMA; falta decidir se há doc pública para clientes finais (help center). |

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
| **CORS em produção** | ⚠️ Verificar | Backends devem ter `CORS_ORIGINS` (ou equivalente) com os domínios dos 3 frontends. |

---

## Resumo de ações prioritárias

1. **Config Railway:** Garantir que **ops-portal** e **admin-console** tenham `CORE_API_BASE_URL`, `ORDERS_API_BASE_URL`, `PAYMENTS_API_BASE_URL` definidos com URLs absolutas no ambiente de staging/produção.
2. **Legal:** Publicar (ou linkar) Termos de Uso e Política de Privacidade e, se aplicável, aviso de cookies.
3. **Suporte:** Definir canal de contato (email ou “Fale conosco”) e colocá-lo na aplicação/landing.
4. **CORS:** Confirmar que os 3 backends aceitam as origens dos frontends em produção.
5. **Opcional:** Melhorar mensagem de erro no dashboard Ops quando as APIs não respondem.

Quando esses itens estiverem cobertos, o produto pode ser considerado **100% vendável** do ponto de vista operacional, legal, billing e suporte.
