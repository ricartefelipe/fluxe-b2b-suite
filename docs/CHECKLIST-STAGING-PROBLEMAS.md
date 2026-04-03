# Checklist — problemas conhecidos (staging) e como fechar

Documento operacional para fechar **um item de cada vez**. Referência canónica de ambientes: [AMBIENTES-CONFIGURACAO.md](AMBIENTES-CONFIGURACAO.md).

---

## 1. Deploy sem imagem nova (migrações “não aparecem”)

| Estado | Problema | Verificação | Ação |
|--------|-----------|-------------|------|
| [ ] | `railway redeploy` só reutiliza a última imagem; código novo em `develop` pode não estar no container | Deployments → commit / build time vs último merge em `develop` | Trigger de **build** a partir do `develop` atual (push ou deploy que compile o Dockerfile), não só redeploy |

---

## 2. `audit_log` sem coluna `target` (ou `detail`)

| Estado | Problema | Verificação | Ação |
|--------|-----------|-------------|------|
| [ ] | Logs: `column "target" of relation "audit_log" does not exist` | `alembic_version` = `0016_audit_log_target_detail` e `\d audit_log` no Postgres da app payments | Garantir imagem com migração **0016**; se BD ficou inconsistente, correr `alembic upgrade head` na mesma BD que o serviço usa |

---

## 3. ABAC 403 “Plan … not allowed” com `allowed_plans` estranhos nos logs

| Estado | Problema | Verificação | Ação |
|--------|-----------|-------------|------|
| [ ] | Políticas com `allowed_plans` desalinhados ou versão antiga do serviço | Logs já devem mostrar `allowed_plans` como lista de slugs (não caractere a caractere) | Deploy **py-payments-ledger** com `develop` que inclui `_normalize_abac_slug_list` + migrações **0014/0015**; depois `seed` ou só migrações conforme [staging-seed.sh](../scripts/staging-seed.sh) |

---

## 4. Redis — `AuthenticationError` no rate limit

| Estado | Problema | Verificação | Ação |
|--------|-----------|-------------|------|
| [ ] | `invalid username-password pair` ao falar com Redis | Variável `REDIS_URL` / credenciais no serviço **py-payments-ledger** vs plugin Redis no mesmo projeto | Alinhar com o **Redis** do projeto staging (referência `${{Redis.REDIS_URL}}` ou equivalente documentado no repo) |

---

## 5. JWT desalinhado entre Core, Orders e Payments

| Estado | Problema | Verificação | Ação |
|--------|-----------|-------------|------|
| [ ] | Token válido no Core rejeitado nos outros serviços | Mesmo `JWT_SECRET` / `JWT_HS256_SECRET` e `JWT_ISSUER` nos três | Copiar valores no Railway staging e redeploy |

---

## 6. Três bases no mesmo Postgres (local documentado)

| Estado | Problema | Verificação | Ação |
|--------|-----------|-------------|------|
| [ ] | Core / Orders / Payments precisam de **bases distintas** (nomes no fim do URL) | Cada `DATABASE_URL` / `DB_URL` no Railway | Confirmar três nomes de BD coerentes com [config/env/README.md](../config/env/README.md); nunca misturar schemas à mão sem runbook |

---

## 7. Seed de staging a falhar sem falhar o deploy

| Estado | Problema | Verificação | Ação |
|--------|-----------|-------------|------|
| [ ] | `docker/entrypoint.sh` em payments podia mascarar falha do seed (`\|\| true`) | Logs de arranque: “Staging: running seed…” sem erro visível mas políticas vazias | Corrigido para staging falhar o processo se o seed falhar (ver repo **py-payments-ledger**) |

---

## 8. `ENCRYPTION_KEY` ausente (staging)

| Estado | Problema | Verificação | Ação |
|--------|-----------|-------------|------|
| [ ] | Log: `ENCRYPTION_KEY not set - sensitive payment data will be stored in plaintext` | Variáveis do serviço payments | Gerar com `python -m src.shared.encryption` (ver `railway.prod.env.example` no repo payments) e definir no Railway |

---

## 9. OpenTelemetry para `localhost:4317` indisponível

| Estado | Problema | Verificação | Ação |
|--------|-----------|-------------|------|
| [ ] | Ruído nos logs `StatusCode.UNAVAILABLE` ao exportar traces | Opcional em staging | Desligar tracing em staging ou apontar OTLP para collector real (baixa prioridade se só for ruído) |

---

## Ordem recomendada após “zerar” BD

1. Subir **spring-saas-core** (`SPRING_PROFILES_ACTIVE=staging`) — Liquibase.
2. `./scripts/staging-seed.sh railway` (orders + payments), ou equivalente com `DATABASE_PUBLIC_URL` se a CLI não resolver o host interno.
3. Smoke: login no admin, chamada autenticada a payments/orders.

---

*Última atualização: checklist operacional alinhado aos repos Fluxe B2B Suite.*
