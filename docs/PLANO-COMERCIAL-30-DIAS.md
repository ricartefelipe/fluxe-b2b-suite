# Plano comercial — 30 dias (conversão e retenção)

Documento operacional: prioridades, responsáveis e métricas de sucesso. Revisar quinzenalmente.

---

## Prioridades (3 entregas de maior impacto)

| # | Entrega | Impacto | Owner | ETA sugerido | Métrica de sucesso |
|---|---------|---------|-------|----------------|---------------------|
| 1 | **Trial → paid** — fluxo claro de upgrade (banner billing já na Admin Console), **e-mail 3 e 1 dia antes do fim do trial** (Core, `TrialReminderEmailScheduler`) | Reduz abandono no fim do período gratuito | Felipe (+ revisão copy) | Contínuo | ≥ 1 conversão trial→paid documentada; lembretes activos em produção com Resend/SMTP |
| 2 | **Confiança no demo** — staging estável (deploys verdes, smoke automatizado ou checklist semanal) | Vendas não perdem demos por indisponibilidade | Time técnico | Contínuo | 0 dias com shop/API indisponíveis em horário comercial (objetivo) |
| 3 | **Time-to-value** — onboarding até primeiro pedido `CONFIRMED`/`PAID` com guia curto (docs + checklist) | Cliente vê valor rápido | Felipe | 3 semanas | Tempo médio “login → primeiro pedido de teste” ≤ 30 min (medido em 3 runs) |

---

## Detalhe por item

### 1) Trial → paid

- Usar sinais já expostos na consola (trial/past-due) e alinhar mensagem comercial (e-mail ou in-app).
- Métrica: registar no CRM ou planilha interna: data de início trial, data fim, outcome (paid/churn).

### 2) Confiança no demo

- Manter [CHECKLIST-AMBIENTES-EVIDENCIAS.md](CHECKLIST-AMBIENTES-EVIDENCIAS.md) atualizado por rodada.
- Se `shop-frontend` ou API falhar deploy no Railway, tratar como incidente de demo e abrir ação corretiva.

### 3) Time-to-value

- Doc canónico: [PRIMEIROS-PASSOS.md](PRIMEIROS-PASSOS.md) (também resumido na página **Ajuda** do Admin Console).
- Opcional em deploy: definir `platformDocsUrl` no `config.json` do Admin para apontar para o repositório ou site de docs com este guia.
- Métrica: cronometrar 3 execuções do fluxo e média.

---

## Próxima revisão

- Data sugerida: +15 dias a partir da última atualização deste ficheiro.
