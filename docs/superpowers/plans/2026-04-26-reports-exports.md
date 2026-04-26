# Reports And Exports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar relatórios operacionais com export CSV para pedidos, pagamentos e ledger no Ops Portal.

**Architecture:** A página `ReportsPage` usa as facades existentes de pedidos, pagamentos e ledger, com transformação CSV isolada em `reports-export.util.ts`. O primeiro corte exporta no frontend para acelerar entrega; backend export assíncrono fica para evolução.

**Tech Stack:** Angular standalone components, Angular Material, Nx, Vitest.

---

## File Structure

- `saas-suite-ui/apps/ops-portal/src/app/reports/reports-export.util.ts`: helpers puros de CSV, filtro por data, resumo e mapeamento de linhas.
- `saas-suite-ui/apps/ops-portal/src/app/reports/reports-export.util.spec.ts`: cobertura unitária do contrato CSV.
- `saas-suite-ui/apps/ops-portal/src/app/pages/reports.page.ts`: UI e orquestração dos três relatórios.
- `saas-suite-ui/apps/ops-portal/src/app/app.routes.ts`: rota lazy `/reports`.
- `saas-suite-ui/apps/ops-portal/src/app/ops-shell.component.ts`: item de menu.
- `saas-suite-ui/apps/ops-portal/src/app/ops-shell.component.spec.ts`: regressão do menu.
- `saas-suite-ui/libs/shared/i18n/src/lib/*`: mensagens PT/EN e contrato.

## Tasks

- [x] Criar testes RED para CSV, datas, resumo e mapeamento de linhas.
- [x] Implementar utilitário CSV e validar testes GREEN.
- [x] Criar página de relatórios no Ops Portal.
- [x] Registrar rota e navegação.
- [x] Adicionar mensagens i18n.
- [x] Rodar testes do Ops Portal.
- [x] Rodar build de produção do Ops Portal.
- [x] Corrigir revisão: permissões/ABAC agregadas, totais por moeda, status completos e CSV injection.
- [ ] Abrir PR para `develop` e acompanhar CI.
- [ ] Mergear em `develop` quando o CI estiver verde.
