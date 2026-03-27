# Runbook de rollback (enxuto)

Objetivo: reverter deploy com impacto mínimo quando staging ou produção ficam degradados após uma promoção.

## Quando acionar

- Smoke pós-merge ou health checks falham após deploy.
- Taxa de erro 5xx acima do aceitável (ver [MONITORING-THRESHOLDS.md](MONITORING-THRESHOLDS.md)).
- Regressão funcional confirmada em staging **antes** de repetir o mesmo em produção.

## Ordem recomendada (dependências)

1. **Frontends** (Shop, Ops, Admin) — podem apontar para APIs estáveis; revertem primeiro se a UI for o problema.
2. **APIs** — ordem inversa de dependência típica: **payments** e **orders** (domínio) antes ou em paralelo, conforme causa; **spring-saas-core** se o problema for auth/tenant/outbox.
3. **Workers** — após API correspondente, para evitar consumo de mensagens com código incompatível.

Em dúvida: reverter o serviço que mudou na última release primeiro.

## Railway

1. Abrir o serviço → **Deployments**.
2. Selecionar o deployment **anterior estável** → **Redeploy** (ou rollback nativo se disponível).
3. Confirmar health (URLs em [PIPELINE-ESTEIRAS.md](PIPELINE-ESTEIRAS.md#urls-esperadas-após-configurar-railway)).

## Imagem Docker (GHCR)

- Tags `:develop` (staging) e `:master` / `:latest` (produção) — ver [PIPELINE-ESTEIRAS.md](PIPELINE-ESTEIRAS.md).
- Rollback: fixar no Railway a imagem digest ou tag anterior conhecida (anotar na release).

## Base de dados

- **Não** reverter apenas código se migrações já alteraram o schema sem plano. Coordenar com:
  - Core: Liquibase — rever changeset só com script de compensação ou restore de backup (fora do âmbito deste runbook).
  - Orders: Prisma migrate — idem.
  - Payments: Alembic — idem.
- Se o rollback for **só de aplicação** e a migração for retrocompatível, redeploy da imagem anterior costuma bastar.

## Git

- **Tag** na versão anterior (ver secção Release em [PIPELINE-ESTEIRAS.md](PIPELINE-ESTEIRAS.md)): `git checkout <tag-anterior>` para build local de emergência; produção deve preferir redeploy da imagem já construída.

## Após rollback

1. Registrar causa e hora (incidente / post-mortem leve).
2. Abrir fix em `develop` antes de nova promoção a `master`.
