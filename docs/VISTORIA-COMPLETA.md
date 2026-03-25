# Vistoria completa — Super sistema B2B

Relatório de vistoria dos quatro repositórios (spring-saas-core, node-b2b-orders, py-payments-ledger, fluxe-b2b-suite): **o que falta implementar**, **o que ficou pela metade** e **o que foi implementado de forma frágil ou inconsistente**.

Data da vistoria: 2025-03-07.
Última atualização: 2026-03-25 — reforço de docs de go-live (`GO-LIVE-VENDA`, `FLUXO-PR-FEATURE`), contrato de eventos canónico no Core espelhado nos backends; notificações in-app em mock só em dev (sem SSE no stack actual).

---

## 1. Resumo executivo

| Área | Situação (atualizado sprint 2) |
|------|----------|
| **spring-saas-core** | Backlog 100% concluído. Webhook, rate limit, retenção de audit, rotação JWT, Grafana, IA/LLM — tudo implementado. |
| **node-b2b-orders** | Backlog 100% concluído. Estável com analytics, schema registry, structured logging, busca full-text. |
| **py-payments-ledger** | Backlog 100% concluído. ROADMAP v1.1 completo. Multi-gateway, criptografia, analytics implementados. |
| **fluxe-b2b-suite** | docs/README, go-live, catálogo de eventos alinhado ao Core; CI E2E com Playwright + deps; sininho de notificações só mock em dev (sem endpoint SSE). |

---

## 2. spring-saas-core

Fonte: `docs/BACKLOG-EVOLUCAO.md`, `docs/compliance.md`, código e `scripts/smoke.sh`.

### 2.1 Backlog desatualizado (já implementado, mas marcado como [ ])

- **Script de smoke test** — **✅ Feito e marcado.**
- **Exportação de audit log** — **✅ Feito e marcado.**

### 2.2 Itens implementados (sprint 2)

| Item | Status |
|------|--------|
| Webhook de eventos para integradores externos | ✅ Feito |
| Rate limiting por tenant | ✅ Já existia |
| Rotação de JWT_SECRET sem downtime | ✅ Feito |
| Retenção configurável de audit log | ✅ Feito |
| Política de privacidade de dados | ✅ Já existia |
| Alertas Grafana pré-configurados | ✅ Feito |
| Versionamento de contratos | ✅ Já existia |
| API de dados agregados para análise (IA/LLM) | ✅ Já existia |
| Endpoint de anomalias em audit log | ✅ Já existia |
| Documentação viva gerada por IA | ✅ Feito |

### 2.3 Implementado de forma frágil ou incompleta

- **Retenção de audit:** **✅ Resolvido.** Job diário com `AUDIT_RETENTION_DAYS` (default 90), auditoria do cleanup.

---

## 3. node-b2b-orders

- README, scripts (`up`, `migrate`, `seed`, `smoke`), endpoints e integração completos.
- Nenhum TODO/FIXME em código.
- **Sprint 2:** adicionados analytics (demanda, anomalias, inventário), schema registry, structured logging, busca full-text, JWT rotation, OIDC/RS256, privacidade e Grafana alerts.

---

## 4. py-payments-ledger

### 4.1 ROADMAP

**v1.0 e v1.1 — ✅ Completos.** Roadmap avançado para v1.2.

### 4.2 Código e testes

- Placeholders `sk_test_xxx` em testes permanecem (valores de teste, não credenciais).
- **Sprint 2:** multi-gateway, criptografia AES-256-GCM, analytics (fraude, anomalias, cashflow), JWT rotation, OIDC/RS256, audit export, structured logging, circuit breaker com métricas.

### 4.3 Documentação

- **✅ Corrigido.** Referências removidas. Contracts identity.md e headers.md criados. CHANGELOG de contratos adicionado.

---

## 5. fluxe-b2b-suite

### 5.1 TODOs em código

- **✅ Resolvido.** Dashboard SVG por opção (sem lib de gráficos).

### 5.2 Documentação referenciada e ausente

- **✅ Resolvido.** `docs/README.md` ajustado: docs existentes separados de planejados.

### 5.3 Notificações in-app (bell)

- **Estado:** em **desenvolvimento local** com `authMode` dev, o feed usa **dados simulados** (intervalo). Não há `EventSource` para `/api/notifications/stream` no stack actual — o código legado de SSE foi removido para evitar confusão e erros em consola em staging/produção.
- **Futuro:** quando o Core (ou BFF) expuser SSE autenticado, reintroduzir ligação atrás de uma flag em `config.json`.

---

## 6. Contratos e integração

- Todos os 3 backends possuem `docs/contracts/` (identity, headers, events, CHANGELOG).
- **Eventos RabbitMQ:** fonte de verdade em **spring-saas-core** `docs/contracts/events.md`; orders e payments mantêm réplica com preâmbulo.
- JWT e headers alinhados entre serviços.
- Schema registry de eventos no node-b2b-orders.
- Contratos versionados com política de deprecation.

---

## 7. Checklist de ações sugeridas

### Imediatas (correção de inconsistência)

1. **spring-saas-core:** Backlog atualizado. **✅ Feito.**
2. **fluxe-b2b-suite:** docs/README.md corrigido. **✅ Feito.**
3. **py-payments-ledger:** Referências corrigidas. **✅ Feito.**

### Curto prazo (completar o que ficou pela metade)

4. **fluxe-b2b-suite:** Dashboard gráficos. **✅ Feito (SVG por opção).**
5. **py-payments-ledger:** Alterações commitadas. **✅ Feito.**

### Médio prazo (backlog)

6. **spring-saas-core:** Retenção de audit. **✅ Feito.**
7. **spring-saas-core:** Webhook + rate limiting. **✅ Feito.**
8. **py-payments-ledger:** ROADMAP v1.1. **✅ Feito.**

> **Estado:** itens do sprint 2 resolvidos (2026-03-12). Melhorias contínuas: ver `docs/GO-LIVE-VENDA.md`, `docs/O-QUE-FALTA-100-VENDAVEL.md` e pipeline em `docs/PIPELINE-ESTEIRAS.md`.

---

## 8. Referências

- spring-saas-core: `docs/PROMPT-EVOLUCAO.md`, `docs/BACKLOG-EVOLUCAO.md`, `docs/compliance.md`
- py-payments-ledger: `ROADMAP.md`, `README.md`
- fluxe-b2b-suite: `docs/README.md`, `saas-suite-ui/apps/ops-portal/.../dashboard.page.ts`
