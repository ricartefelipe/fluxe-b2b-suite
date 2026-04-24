# Checklist — problemas conhecidos (staging) e como fechar

Documento operacional para fechar **um item de cada vez**. Referência canónica de ambientes: [AMBIENTES-CONFIGURACAO.md](AMBIENTES-CONFIGURACAO.md).

**Como usar:** marca `[x]` em cada linha quando confirmado no teu ambiente.

---

## 1. Deploy sem imagem nova (migrações “não aparecem”)

**Problema:** `railway redeploy` só reutiliza a última imagem; código novo em `develop` pode não estar no container.

**No repositório (automatizável):**

- [ ] No monorepo **fluxe-b2b-suite**, corre `./scripts/staging-compare-develop-sha.sh` e anota o SHA de `origin/develop`.
- [ ] No Railway → serviço (ex. py-payments-ledger) → **Deployments** → último deploy com sucesso → **commit** deve ser o mesmo SHA (ou pipeline a partir desse commit).

**Se o SHA não bater:** faz deploy que **faça build** a partir do Git (push vazio em `develop`, ou botão que dispare **Build**), não só “Redeploy” da imagem antiga.

---

## 2. `audit_log` sem coluna `target` (ou `detail`)

**Problema:** Logs: `column "target" of relation "audit_log" does not exist`.

**Verificação:**

- [ ] Nos logs de arranque do **py-payments-ledger** aparece `[entrypoint] Alembic revision aplicada na BD:` seguido de `0016_audit_log_target_detail` (ou `head` nessa revisão).
- [ ] Opcional no Postgres da BD **do payments**: `SELECT version_num FROM alembic_version;` e `\d audit_log` (colunas `target`, `detail`).

**Ação:** Imagem com migração **0016** + mesma BD que o serviço usa; se necessário `alembic upgrade head` com `DATABASE_PUBLIC_URL` (ver [config/env/README.md](../config/env/README.md)).

---

## 3. ABAC 403 “Plan … not allowed” com `allowed_plans` estranhos

**Problema:** Políticas desalinhadas ou serviço antigo.

**Verificação:**

- [ ] Código em `develop` com `_normalize_abac_slug_list` em `security.py` e migrações **0014/0015** aplicadas (ver item 2).
- [ ] Após arranque, seed staging correu sem erro (item 7).

**Ação:** [staging-seed.sh](../scripts/staging-seed.sh) `railway` ou migrate+seed manual nos dois repos.

---

## 4. Redis — `AuthenticationError` no rate limit

**Problema:** `invalid username-password pair` ao falar com Redis.

**Verificação:**

- [ ] No serviço **py-payments-ledger**, `REDIS_URL` referencia o plugin **Redis** do mesmo projeto Railway (`${{Redis.REDIS_URL}}` ou equivalente).

**Ação:** Copiar credenciais do plugin Redis para a variável do serviço; redeploy.

---

## 5. JWT desalinhado entre Core, Orders e Payments

**Problema:** Token válido no Core e 401/403 nos outros.

**Verificação:**

- [ ] Mesmo segredo: `JWT_HS256_SECRET` / `JWT_SECRET` e `JWT_ISSUER=spring-saas-core` nos três serviços de backend em staging.

**Ação:** Alinhar variáveis e redeploy.

---

## 6. Três bases no mesmo Postgres

**Problema:** Core / Orders / Payments precisam de **bases distintas** (nomes no fim do URL).

**Verificação:**

- [ ] Cada `DATABASE_URL` / `DB_URL` no Railway termina com **nome de base diferente**, coerente com [config/env/README.md](../config/env/README.md).

---

## 7. Seed de staging a falhar sem falhar o deploy

**Problema:** Seed falhava e o processo subia na mesma (`|| true` antigo).

**Estado no código:** Corrigido — staging **aborta** se `python -m src.infrastructure.db.seed` falhar.

**Verificação:**

- [ ] Deploy com imagem que inclua esse `docker/entrypoint.sh` (repo **py-payments-ledger**).

---

## 8. `ENCRYPTION_KEY` ausente (staging)

**Problema:** Log avisa armazenamento sensível em texto claro.

**Verificação:**

- [ ] Variável `ENCRYPTION_KEY` definida no serviço payments (gerar: `python -m src.shared.encryption` no repo payments).

---

## 9. OpenTelemetry para `localhost:4317` indisponível

**Problema:** Ruído `StatusCode.UNAVAILABLE` nos logs.

**Estado no código:** Com `APP_ENV=staging`, o tracing fica **desligado por defeito** (podes forçar `OTEL_ENABLED=true` se tiveres collector).

**Verificação:**

- [ ] Logs de arranque mostram `OpenTelemetry disabled (staging default or OTEL_ENABLED=false)` em staging.

---

## Ordem recomendada após “zerar” BD

1. Subir **spring-saas-core** (`SPRING_PROFILES_ACTIVE=staging`) — Liquibase.
2. `./scripts/staging-seed.sh railway` (orders + payments), ou equivalente com `DATABASE_PUBLIC_URL` se a CLI não resolver o host interno.
3. Smoke: login no admin, chamada autenticada a payments/orders.

---

*Última atualização: checklist com passos por item e scripts em `scripts/staging-compare-develop-sha.sh`.*
