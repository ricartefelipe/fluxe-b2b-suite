# Vistoria completa — Super sistema B2B

Relatório de vistoria dos quatro repositórios (spring-saas-core, node-b2b-orders, py-payments-ledger, fluxe-b2b-suite): **o que falta implementar**, **o que ficou pela metade** e **o que foi implementado de forma frágil ou inconsistente**.

Data da vistoria: 2025-03-07.

---

## 1. Resumo executivo

| Área | Situação |
|------|----------|
| **spring-saas-core** | Backlog claro; smoke e export de audit já existem (backlog desatualizado). Faltam: webhook, rate limit por tenant, retenção de audit, rotação JWT, smoke marcado no backlog, Grafana, compliance fino, IA/LLM. |
| **node-b2b-orders** | Estável; README e scripts completos. Sem TODOs em código. |
| **py-payments-ledger** | Vários arquivos modificados (branch feature); ROADMAP v1.1 pendente; testes com placeholders (sk_test_xxx); doc PROMPT-CONCLUSAO referenciada mas ausente. |
| **fluxe-b2b-suite** | Dashboard com TODOs de gráficos (placeholder); **documentação:** índice referencia muitos arquivos que não existem. |

---

## 2. spring-saas-core

Fonte: `docs/BACKLOG-EVOLUCAO.md`, `docs/compliance.md`, código e `scripts/smoke.sh`.

### 2.1 Backlog desatualizado (já implementado, mas marcado como [ ])

- **Script de smoke test** — `scripts/smoke.sh` existe e cobre health, OpenAPI, Prometheus, dev token, tenants/policies/flags CRUD, audit, audit/export (JSON e CSV), snapshot, ABAC deny. **Ação:** marcar como [x] no BACKLOG-EVOLUCAO.
- **Exportação de audit log** — `GET /v1/audit/export` com `from`, `to`, `format=json|csv` e limite 10k está implementado em `AuditLogController.java` e coberto pelo smoke. **Ação:** marcar como [x] no BACKLOG-EVOLUCAO (Compliance).

### 2.2 Ainda não implementado

| Item | Prioridade sugerida |
|------|---------------------|
| Webhook de eventos para integradores externos | Funcional |
| Rate limiting por tenant | Segurança |
| Rotação de JWT_SECRET sem downtime | Segurança |
| Retenção configurável de audit log (`AUDIT_RETENTION_DAYS`) | Compliance |
| Script/job que apague ou arquive registros de audit além do período | Compliance |
| Política de privacidade de dados (doc) | Compliance |
| Alertas Grafana pré-configurados | Operacional |
| Versionamento de contratos | Contratos |
| API de dados agregados para análise (IA/LLM) | IA/LLM |
| Endpoint de anomalias em audit log | IA/LLM |
| Documentação viva gerada por IA | IA/LLM |

### 2.3 Implementado de forma frágil ou incompleta

- **Retenção de audit:** `compliance.md` descreve `AUDIT_RETENTION_DAYS` (ex.: 90 dias), mas não há variável de configuração nem job de limpeza/arquivamento no código. Ou implementar retenção + job ou remover/ajustar a doc para deixar claro que é “planejado”.

---

## 3. node-b2b-orders

- README, scripts (`up`, `migrate`, `seed`, `smoke`), endpoints e integração com core/payments bem documentados.
- Nenhum TODO/FIXME encontrado em código.
- **Pendência:** nenhuma crítica; alinhar sempre com contratos do core (identity, headers, eventos).

---

## 4. py-payments-ledger

### 4.1 ROADMAP (ROADMAP.md)

**v1.1 (Next)** — não implementado:

- Webhook outbound delivery (HTTP)
- Reconciliation automation
- Payment retry com exponential backoff
- Multi-currency ledger accounts

**v2.0 (Future):** gateways adicionais, assinaturas, payout, analytics.

### 4.2 Código e testes

- **Placeholders em testes:** `tests/unit/test_stripe_adapter.py` e `tests/unit/test_payments.py` usam `sk_test_xxx` e `"XXX"` — são valores de teste, não credenciais reais; aceitável, mas ideal usar variável de ambiente ou mock explícito para não parecer credencial.
- **Arquivos modificados (git):** `accounts.py`, `outbox.py`, `payments.py`, `reconciliation.py`, `refunds.py`, `webhooks.py`, `seed.py`, `session.py`, handlers de payments e tenants — indicam trabalho em progresso na branch atual; convém revisar e commitar ou documentar o que ficou pela metade.

### 4.3 Documentação

- README cita `docs/PROMPT-CONCLUSAO-VISTORIA.md` e `docs/PROMPT-EVOLUCAO.md`; em `docs/` do py-payments-ledger não há esses arquivos (existem apenas contracts, architecture, api). **✅ Feito (pente fino):** Referências a `docs/PROMPT-EVOLUCAO.md` e `docs/PROMPT-CONCLUSAO-VISTORIA.md` removidas; passou a indicar fluxe-b2b-suite (VISTORIA-COMPLETA.md) e spring-saas-core (PROMPT-EVOLUCAO, BACKLOG-EVOLUCAO). Link quebrado para `docs/DEMO.md` substituído por referência à seção Quick Start e à documentação da suite.

---

## 5. fluxe-b2b-suite

### 5.1 TODOs em código

- **Dashboard (Ops Portal):** `saas-suite-ui/apps/ops-portal/src/app/pages/dashboard.page.ts`:
  - Linhas 80 e 127: comentários `<!-- TODO: Replace with ngx-charts or chart.js when dependency is added -->`.
  - Gráficos hoje são SVG manual (receita 7 dias, pedidos por status). Funcional, mas o TODO indica desejo de lib de gráficos (ngx-charts ou Chart.js). **Pela metade:** feature de dashboard existe; migração para lib de charts não feita.

### 5.2 Documentação referenciada e ausente

O arquivo `docs/README.md` lista como “documentos disponíveis” vários que **não existem** em `docs/`:

| Referenciado no README | Existe? |
|------------------------|--------|
| PROMPT-EVOLUCAO.md | Não |
| PROMPT-CONCLUSAO-VISTORIA.md | Não |
| GUIA-EXECUCAO-PROMPTS-EVOLUCAO.md | Não |
| ETAPAS-EXECUTADAS.md | Não |
| PUBLICAR-PASSO-A-PASSO.md | Não |
| E2E-RUN.md | Não |
| ESTADO-ENTREGA.md | Não |
| regras-de-negocio.md | Não |
| DAS.md | Não |
| C4-suite.md | Não |
| historias-de-usuario.md | Não |
| documento-implantacao.md | Não |
| ci-cd-e-deploy.md | Não |

**Existem hoje em docs/:** `README.md`, `OBSERVABILITY.md`, `GUIA-DEPLOY-PASSO-A-PASSO.md`, `VISTORIA-COMPLETA.md`. **Feito (pente fino):** `docs/README.md` ajustado; README raiz e infra apontam para o índice e para GUIA-DEPLOY.

**Ação:** ou criar os documentos listados ou ajustar o `docs/README.md` para listar apenas o que existe (e marcar “planejado” o resto).

---

## 6. Contratos e integração

- **spring-saas-core** tem `docs/contracts/` (identity, headers, events) e API v1 estável.
- **node-b2b-orders** e **py-payments-ledger** referenciam esses contratos; JWT e headers alinhados.
- Nada indica implementação “ruim” dos contratos; manter alinhamento na evolução.

---

## 7. Checklist de ações sugeridas

### Imediatas (correção de inconsistência)

1. **spring-saas-core:** Atualizar `BACKLOG-EVOLUCAO.md`: marcar [x] em “Script de smoke test” (Operacional) e “Exportação de audit log” (Compliance).
2. **fluxe-b2b-suite:** Ajustar `docs/README.md` para não listar como disponíveis documentos inexistentes; opcional: criar placeholders ou um “Índice planejado”.
3. **py-payments-ledger:** Corrigir ou remover referências a `docs/PROMPT-CONCLUSAO-VISTORIA.md` e `docs/PROMPT-EVOLUCAO.md` no README (ou criar os arquivos em `docs/`). **✅ Feito:** referências removidas; indicação para fluxe-b2b-suite (VISTORIA-COMPLETA) e spring-saas-core (PROMPT-EVOLUCAO, BACKLOG-EVOLUCAO). Link para `docs/DEMO.md` substituído por Quick Start e doc da suite.

### Curto prazo (completar o que ficou pela metade)

4. **fluxe-b2b-suite:** Decidir: adicionar ngx-charts ou Chart.js ao dashboard e remover os TODOs, ou remover os TODOs e deixar explícito que os gráficos são SVG por opção. **✅ Feito:** TODOs removidos; comentário explícito de que os gráficos são SVG por opção (sem dependência de lib).
5. **py-payments-ledger:** Revisar alterações não commitadas (accounts, outbox, payments, reconciliation, refunds, webhooks, seed, session, handlers); commitar o que estiver pronto ou documentar o que ficou WIP.

### Médio prazo (backlog)

6. **spring-saas-core:** Implementar retenção configurável de audit (`AUDIT_RETENTION_DAYS`) + job de limpeza/arquivamento, ou documentar como “planejado”.
7. **spring-saas-core:** Implementar webhook de eventos e rate limiting por tenant (conforme BACKLOG).
8. **py-payments-ledger:** Avançar itens do ROADMAP v1.1 (webhook outbound, reconciliação, retry, multi-moeda) conforme prioridade.

---

## 8. Referências

- spring-saas-core: `docs/PROMPT-EVOLUCAO.md`, `docs/BACKLOG-EVOLUCAO.md`, `docs/compliance.md`
- py-payments-ledger: `ROADMAP.md`, `README.md`
- fluxe-b2b-suite: `docs/README.md`, `saas-suite-ui/apps/ops-portal/.../dashboard.page.ts`
