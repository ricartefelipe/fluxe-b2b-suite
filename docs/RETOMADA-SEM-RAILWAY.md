# Retomada da Fluxe B2B — sem Railway / sem Resend

Guia para **voltar a operar** a suíte Fluxe B2B quando contas cloud (Railway, Resend) não estão disponíveis. O produto continua **100% funcional em local** e em **VM com Docker Compose**; só muda o caminho de hospedagem e o provedor de e-mail.

---

## Situação típica

| Serviço perdido | Impacto | Alternativa imediata |
|-----------------|---------|----------------------|
| **Railway** | Staging/produção no ar caem | Local (`up-local.sh`) ou VM + `docker-compose.prod.yml` |
| **Resend** | E-mails transacionais não saem | `EMAIL_PROVIDER=log` (dev) ou `smtp` (Gmail/SendGrid/etc.) |
| **Stripe** (se pausado) | Cobrança real pausa | `APP_BILLING_PROVIDER=noop` no Core + `GATEWAY_PROVIDER=fake` no ledger para demos |

---

## Fase 0 — Validar código (antes de subir qualquer ambiente)

Na raiz de `fluxe-b2b-suite`:

```bash
./scripts/pre-merge-checks.sh
pnpm verify:contracts
```

Resultado esperado (baseline jun/2026):

| Repo | Testes |
|------|--------|
| spring-saas-core | 274 testes, spotless OK |
| node-b2b-orders | 210 testes |
| py-payments-ledger | 224 testes |
| fluxe-b2b-suite (UI) | lint + build + test OK |

**Python sem `python3-venv`:** use o bootstrap automático:

```bash
cd ../py-payments-ledger
bash scripts/bootstrap-venv.sh
.venv/bin/python3 -m pip install -e ".[dev]"
```

---

## Fase 1 — Ambiente local completo (custo zero)

### Pré-requisitos

1. **Docker Desktop** ou Docker Engine **a correr** (`docker ps` sem erro).
2. Java 21, Maven, Node 20+, pnpm, Python 3.12+.
3. Opcional: `sudo apt install python3.12-venv` (evita fallback get-pip).

### Subir tudo

```bash
cd fluxe-b2b-suite
./scripts/up-local.sh
```

URLs locais:

| App | URL |
|-----|-----|
| Shop | http://localhost:4200 |
| Ops Portal | http://localhost:4300 |
| Admin Console | http://localhost:4400 |
| Core API | http://localhost:8080 |
| Orders API | http://localhost:3000 |
| Payments API | http://localhost:8000 |

Parar: `./scripts/up-local.sh --down`

### E-mail sem Resend

No Core (`spring-saas-core`), perfil local já usa **`EMAIL_PROVIDER=log`**: convites e reset aparecem nos logs (`.local-logs/spring.log`), não no inbox.

Para SMTP barato/grátis depois:

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
EMAIL_FROM=noreply@seudominio.com
```

---

## Fase 2 — Provar saga pedido → PAID (local)

Com a stack local no ar:

```bash
# Pedido mínimo (CONFIRMED)
export ORDERS_SMOKE_URL=http://localhost:3000
export CORE_SMOKE_URL=http://localhost:8080
pnpm smoke:order-staging

# Saga até PAID (Rabbit + workers locais + gateway fake)
export PAYMENTS_SMOKE_URL=http://localhost:8000
export RABBITMQ_URL=amqp://guest:guest@localhost:5672/
pnpm smoke:order-staging:saga
```

Se falhar, ver `.local-logs/` e [CHECKLIST-PEDIDO-STAGING.md](CHECKLIST-PEDIDO-STAGING.md).

---

## Fase 3 — Produção barata (substituto do Railway)

**Recomendado:** uma VM (Hetzner, Contabo, Oracle Free Tier, etc.) com **Docker Compose** — já documentado em [.env.example](../.env.example) e [docker-compose.prod.yml](../docker-compose.prod.yml).

Passos resumidos:

1. Copiar `.env.example` → `.env` e preencher secrets (`openssl rand -base64 32` para JWT, DB, Redis, Rabbit).
2. Build/push imagens GHCR **ou** build local na VM.
3. `docker compose -f docker-compose.prod.yml up -d`
4. Migrations sem seed (ver [GO-LIVE-VENDA.md](GO-LIVE-VENDA.md) secção 4).
5. Nginx/Caddy na frente com TLS (Let's Encrypt).
6. `pnpm verify:go-live` com URLs públicas.

**Custo alvo:** ~€5–15/mês (VM + domínio), vs. Railway multi-serviço.

Quando voltar a ter budget para Railway, reutilizar [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md) — o código não muda.

---

## Fase 4 — Monetização (SaaS multicliente)

Ordem sugerida **com pouco capital**:

1. **Local/demo estável** → gravar vídeo ou demo ao vivo para prospects.
2. **VM staging** com domínio barato → primeiro tenant piloto (plano Pro manual).
3. **Stripe Billing** (Core) quando tiver conta — chaves live em `.env`.
4. **Resend** ou SMTP quando precisar de e-mail profissional em volume.
5. Landing `/welcome` no Shop + domínio público; depois site comercial externo.

Modelo de receita nativo: **assinatura mensal** (free/pro/enterprise) já implementada no Admin Console + Stripe portal.

---

## Fase 5 — Checklist “100% operacional” (pós-retomada)

Marcar quando concluído:

- [ ] `pre-merge-checks` verde nos 4 repos
- [ ] Docker local OK + `up-local.sh` sobe sem erro
- [ ] Smoke `CONFIRMED` local
- [ ] Smoke saga `PAID` local
- [ ] VM staging ou novo Railway com branch `master` em produção
- [ ] Worker `node-b2b-orders-worker` no ambiente de produção
- [ ] JWT_SECRET idêntico nos 3 backends
- [ ] `APP_DEV_TOKEN_ENDPOINT_ENABLED=false` em prod
- [ ] E-mail (log/SMTP/Resend) testado (convite + reset)
- [ ] Stripe test → live (billing + pagamentos)
- [ ] Primeiro cliente pagante ou piloto assinado

---

## Documentos relacionados

| Objetivo | Arquivo |
|----------|---------|
| Go-live completo | [GO-LIVE-VENDA.md](GO-LIVE-VENDA.md) |
| Playbook operação | [EXECUCAO-VENDA-MONITORIZACAO.md](EXECUCAO-VENDA-MONITORIZACAO.md) |
| Produto “vendável” (features) | [O-QUE-FALTA-100-VENDAVEL.md](O-QUE-FALTA-100-VENDAVEL.md) |
| Começar local | [../COMECE-AQUI.md](../COMECE-AQUI.md) |
| Operação produção VM | [PRODUCAO-OPERACAO.md](PRODUCAO-OPERACAO.md) |

---

## Nota sobre contas perdidas

Perder Railway/Resend **não apaga o código nem a arquitetura**. Os repositórios MIT em `ricartefelipe/*` são a fonte de verdade. Recriar contas cloud é configuração + secrets + deploy — a parte difícil (multitenancy, saga, billing, frontends) já está feita.
