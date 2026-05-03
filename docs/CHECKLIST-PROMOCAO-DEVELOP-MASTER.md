# Checklist — promoção `develop` → `master` (produção)

Usar antes de mergear o PR `develop` → `master` e deploy de produção. Complementa [PIPELINE-ESTEIRAS.md](PIPELINE-ESTEIRAS.md) e [GO-LIVE-VENDA.md](GO-LIVE-VENDA.md).

### Abrir PRs `develop` → `master` nos quatro repos

Com [GitHub CLI](https://cli.github.com/) autenticado e os quatro clones no mesmo diretório pai do monorepo:

```bash
./scripts/promote-develop-to-master-pr.sh
```

O script ignora repositórios já alinhados e não duplica PR aberto.

**Ao mergear** esse tipo de PR no GitHub: **não** marques “delete branch” — o ramo de origem é `develop`; só deve continuar a existir apontando ao mesmo commit que `master` (ou à frente na próxima feature).

## Qualidade e CI

- [ ] Todos os PRs integrados em `develop` passaram CI (lint, test, build) nos repositórios tocados.
- [ ] Opcional local: `pnpm verify:all` na raiz do `fluxe-b2b-suite` (workspace com os quatro repos).
- [ ] `pnpm verify:contracts` sem drift (com PAT se usar checkout multi-repo no CI).

## Staging

- [ ] Deploy de `develop` em Railway staging concluído e saudável.
- [ ] Smoke HTTP pós-merge (secrets `*_SMOKE_URL`) ou verificação manual: health + fluxo crítico de negócio.
- [ ] (Recomendado) Pedido staging até **CONFIRMED** (`pnpm smoke:order-staging`) e, se vendes fluxo com pagamento, até **PAID** (`pnpm smoke:order-staging:saga` ou `:paid` — [CHECKLIST-PEDIDO-STAGING.md](CHECKLIST-PEDIDO-STAGING.md)).
- [ ] Sem itens **P0/P1** abertos para esta release ([POLITICA-FREEZE-RELEASE.md](POLITICA-FREEZE-RELEASE.md)).

## Contratos e dados

- [ ] Contratos espelhados alinhados ao Core (drift zero).
- [ ] Migrações aplicadas em staging; plano para produção (backup se operação arriscada).

## Observabilidade

- [ ] Thresholds conhecidos ([MONITORING-THRESHOLDS.md](MONITORING-THRESHOLDS.md)); alertas críticos não silenciados sem motivo.

## Release notes e versão

- [ ] `CHANGELOG.md` atualizado nos repos alterados ([TEMPLATE-RELEASE-NOTES.md](TEMPLATE-RELEASE-NOTES.md)).
- [ ] Versão SemVer acordada para tag ([PIPELINE-ESTEIRAS.md](PIPELINE-ESTEIRAS.md) — Release e tags).

## Rollback

- [ ] Equipa sabe qual imagem/tag anterior é segura ([RUNBOOK-ROLLBACK.md](RUNBOOK-ROLLBACK.md)).

## Após merge em `master`

- [ ] Tags criadas e push (`vX.Y.Z`) nos repos relevantes.
- [ ] Verificar deploy produção e smoke mínimo em URLs de produção.
