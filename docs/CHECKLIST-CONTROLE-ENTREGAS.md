# Checklist de Controle de Entregas

Checklist operativo para controlar entregas de features/fixes com rastreabilidade do inicio ao fim.

Use em conjunto com:
- [PIPELINE-ESTEIRAS.md](PIPELINE-ESTEIRAS.md)
- [CHECKLIST-PROMOCAO-DEVELOP-MASTER.md](CHECKLIST-PROMOCAO-DEVELOP-MASTER.md)
- [GO-LIVE-VENDA.md](GO-LIVE-VENDA.md)

---

## 0) Identificacao da entrega

- [ ] Nome curto da entrega definido (ex.: "banner trial admin").
- [ ] Repos impactados identificados (`fluxe-b2b-suite`, `spring-saas-core`, `node-b2b-orders`, `py-payments-ledger`).
- [ ] Tipo da entrega marcado: `feature`, `fix`, `docs`, `ops`.
- [ ] Responsavel e data alvo definidos.
- [ ] Critério de aceite escrito em 3-5 bullets.

## 1) Planeamento

- [ ] Escopo fechado (o que entra / o que nao entra).
- [ ] Dependencias mapeadas (API, evento, env var, migration, worker).
- [ ] Impacto em contratos avaliado (`events`, `headers`, `identity`, schemas).
- [ ] Impacto em ambiente avaliado (local, staging, producao).
- [ ] Plano de rollback registrado (imagem/tag anterior segura).

## 2) Desenvolvimento (Git Flow)

- [ ] Branch criada a partir de `develop` (`feature/*` ou `fix/*`).
- [ ] Commits atomicos e mensagem clara (sem rodape de ferramenta).
- [ ] Sem codigo morto/imports nao usados.
- [ ] Docs atualizadas quando houve mudanca de contrato/fluxo/variavel.
- [ ] PR aberto para `develop` com contexto e test plan.

## 3) Verificacao tecnica

- [ ] CI do PR verde no(s) repo(s) alterado(s).
- [ ] Gate local executado quando aplicavel (`pnpm verify:all`).
- [ ] Drift de contrato validado (`pnpm verify:contracts`).
- [ ] Smoke/fluxo critico validado (ex.: pedido ate `CONFIRMED`/`PAID` em staging).
- [ ] Sem P0/P1 abertos para a entrega.

## 4) Staging

- [ ] Deploy de `develop` concluido e saudavel.
- [ ] Validacao funcional feita com evidencias (prints/logs/checklist).
- [ ] Variaveis de staging conferidas (URLs, JWT, Rabbit, Redis, Stripe/Resend quando aplicavel).
- [ ] Migrations executadas; seed de staging aplicado quando necessario.
- [ ] Monitoracao sem anomalias criticas apos deploy.

## 5) Promocao para producao

- [ ] Checklist de promocao `develop` -> `master` concluido.
- [ ] PR de release aberto e revisado.
- [ ] Merge em `master` realizado com CI verde.
- [ ] Tag de release criada (quando adotado no fluxo).
- [ ] `develop` re-alinhado com `master` apos release.

## 6) Pos-release

- [ ] Deploy de producao concluido (servicos esperados no ar).
- [ ] Health checks e fluxo minimo de negocio validados.
- [ ] CHANGELOG/Release notes publicados.
- [ ] Alertas e dashboards monitorados na janela pos-release.
- [ ] Branch de trabalho removida (local/remoto) quando apropriado.

---

## Modelo rapido por entrega (copiar e preencher)

```md
### Entrega: <nome>
- Tipo: <feature|fix|docs|ops>
- Repos: <...>
- Responsavel: <...>
- Data alvo: <...>
- Status: <planeando|em dev|em review|staging|release|concluida>

#### Aceite
- [ ] ...
- [ ] ...
- [ ] ...

#### Evidencias
- PRs:
  - <url>
- CI:
  - <url>
- Staging:
  - <url/print/log>
- Producao:
  - <url/print/log>
```

