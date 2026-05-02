# Go-Live para Venda — Checklist Completo

Checklist para colocar o Fluxe B2B Suite em produção e **pronto para venda**. Use este documento ao promover `develop` → `master` e ao configurar o ambiente de produção pela primeira vez.

---

## 1. Pré-requisitos (branch e CI)

- [ ] Branch `develop` estável e validada em staging
- [ ] CI verde em todos os 4 repositórios (fluxe-b2b-suite, spring-saas-core, node-b2b-orders, py-payments-ledger)
- [ ] Testes e build passando localmente ou no GitHub Actions
- [ ] Decisão de merge `develop` → `master` (via PR) e, se adotado, tag de release (ver [PIPELINE-ESTEIRAS.md](PIPELINE-ESTEIRAS.md)#release-e-tags)

---

## 2. Railway — Produção (master)

- [ ] Projeto Railway **Production** criado (ou ambiente production no mesmo projeto)
- [ ] Para **cada** serviço: **Settings** → **Source** → **Production Branch** = `master`
- [ ] PostgreSQL e Redis (plugins ou externos) configurados para o ambiente production
- [ ] RabbitMQ (CloudAMQP ou outro) com URL de produção
- [ ] Variáveis de ambiente de produção preenchidas a partir dos `railway.prod.env.example` de cada repo (ver seção 4)

---

## 3. Variáveis obrigatórias em produção

### 3.1 Segurança

| Variável | Onde | Valor |
|----------|------|--------|
| `JWT_SECRET` / `JWT_HS256_SECRET` | **Idêntico** nos 3 backends | Gerar com `openssl rand -base64 32` |
| `APP_DEV_TOKEN_ENDPOINT_ENABLED` | spring-saas-core | `false` |
| `CORS_ALLOWED_ORIGINS` / `CORS_ORIGINS` | Todos os backends | Lista exata dos domínios dos frontends (ex.: `https://app.seudominio.com.br,https://admin.seudominio.com.br`) |

### 3.2 Billing e email (spring-saas-core)

| Variável | Descrição |
|----------|-----------|
| `STRIPE_BILLING_SECRET_KEY` | Chave secreta Stripe (Billing) para assinaturas |
| `RESEND_API_KEY` | API key Resend para emails transacionais (reset senha, convite, boas-vindas) |
| `FRONTEND_URL` | URL base do frontend (ex.: `https://app.seudominio.com.br`) para links nos emails |
| `app.billing.provider` | `stripe` em produção |
| `app.email.provider` | `resend` em produção |

### 3.3 Pagamentos (py-payments-ledger)

| Variável | Descrição |
|----------|-----------|
| `GATEWAY_PROVIDER` | `stripe` (ou `pagseguro` / `mercadopago` conforme contrato) |
| `STRIPE_API_KEY` | Chave API Stripe (pagamentos) |
| `STRIPE_WEBHOOK_SECRET` | Secret do webhook Stripe para confirmação/refund |
| `ENCRYPTION_KEY` | Gerar com `python -m src.shared.encryption` |

### 3.4 Frontends (shop, ops-portal, admin-console)

| Variável | Descrição |
|----------|-----------|
| `CORE_API_BASE_URL` | URL do spring-saas-core em produção |
| `ORDERS_API_BASE_URL` | URL do node-b2b-orders em produção |
| `PAYMENTS_API_BASE_URL` | URL do py-payments-ledger em produção |
| `AUTH_MODE` | `oidc` em produção (recomendado) ou `hs256` com JWT forte |

---

## 4. Migrations em produção (sem seed de demo)

- [ ] **spring-saas-core:** Liquibase roda no startup com `SPRING_PROFILES_ACTIVE=prod` (changesets essenciais do perfil prod — **sem** contextos `staging`/`seed`). Confirmar que não há seed Liquibase activo em prod.
- [ ] **node-b2b-orders:** na raiz desse repositório (ou via Railway CLI ligado ao serviço):

```bash
railway run npx prisma migrate deploy
```

— **não** executar `prisma db seed` em produção.

- [ ] **py-payments-ledger:**

```bash
railway run alembic upgrade head
```

— **não** rodar scripts de seed de demo em produção.

**Docker Compose próprio:** após `docker compose -f docker-compose.prod.yml up`, confirmar nas imagens que migrations já aplicaram ou executar os comandos equivalentes dentro dos containers de release, conforme runbook de cada serviço.

### Variáveis de ambiente para compose VM

Referência única de placeholders alinhados ao `docker-compose.prod.yml`: [.env.example](../.env.example) na raiz deste monorepo (`OIDC_JWK_SET_URI`, `JWT_SECRET`, `ENCRYPTION_KEY`, Resend, Stripe billing vs Stripe ledger, etc.).

---

## 5. Domínio e SSL

- [ ] Domínio customizado (ex.: `app.fluxe.com.br`, `admin.fluxe.com.br`) configurado no Railway: **Settings** → **Domains** → **Custom Domain**
- [ ] CNAME (ou A) apontando para o serviço Railway; SSL automático via Let's Encrypt
- [ ] `CORS_ORIGINS` / `CORS_ALLOWED_ORIGINS` atualizados com os domínios reais
- [ ] Frontends com variáveis de ambiente apontando para as URLs de produção (incluindo domínio customizado se aplicável)

Ver detalhes em [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md)#domínio-customizado.

---

## 6. OIDC (recomendado para produção)

- [ ] Provedor OIDC (Keycloak, Auth0, etc.) configurado
- [ ] spring-saas-core: `AUTH_MODE=oidc`, `OIDC_ISSUER_URI`, `OIDC_JWK_SET_URI`, `OIDC_CLIENT_ID`, `OIDC_AUDIENCE`
- [ ] Frontends: `AUTH_MODE=oidc`, `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_SCOPE`
- [ ] Teste de login OIDC em produção

Ver [REFERENCIA-CONFIGURACAO.md](REFERENCIA-CONFIGURACAO.md) e [MANUAL-SISTEMA.md](MANUAL-SISTEMA.md).

---

## 7. Checklist pós-deploy (validação)

- [ ] Health de cada backend: `/actuator/health` (core), `/v1/healthz` (orders), `/healthz` (payments)
- [ ] Verificação automatizada (URLs públicas HTTPS): na raiz do monorepo `pnpm verify:go-live` após definir `CORE_URL`, `ORDERS_URL` e `PAYMENTS_URL` (ver secção 13)
- [ ] Frontends carregam e exibem tela de login
- [ ] Login funciona (OIDC ou HS256 com segredo forte)
- [ ] Produtos listam no Shop
- [ ] Dashboard do Ops Portal carrega (e X-Tenant-Id está configurado)
- [ ] Tenants listam no Admin Console
- [ ] Signup / "Criar conta" funciona (se habilitado)
- [ ] Página de Faturamento (Admin) abre e portal Stripe redireciona corretamente
- [ ] JWT_SECRET é o **mesmo** nos 3 backends
- [ ] `APP_DEV_TOKEN_ENDPOINT_ENABLED=false` em produção
- [ ] CORS configurado com os domínios corretos dos frontends
- [ ] (Recomendado em **staging** antes de produção) Fluxo pedido até **PAID** validado com a stack real: ver [CHECKLIST-PEDIDO-STAGING.md](CHECKLIST-PEDIDO-STAGING.md) — `pnpm smoke:order-staging:saga` ou `pnpm smoke:order-staging:paid` conforme o ambiente
- [ ] (Produção, opcional) Após go-live, confirmar métricas e filas Rabbit sem anomalia — [MONITORING-THRESHOLDS.md](MONITORING-THRESHOLDS.md); playbook único [EXECUCAO-VENDA-MONITORIZACAO.md](EXECUCAO-VENDA-MONITORIZACAO.md)

---

## 8. Documentação legal e suporte (fora do código)

- [ ] **Termos de uso** publicados e linkados no frontend (ex.: rodapé ou página /termos)
- [ ] **Política de privacidade** publicada e linkada (ex.: /privacidade)
- [ ] Contrato de assinatura / plano (Stripe ou jurídico) alinhado aos planos do sistema
- [ ] Canal de suporte definido (e-mail, chat, etc.) e documentado para clientes

Ver referência em [docs/TERMOS-PRIVACIDADE.md](TERMOS-PRIVACIDADE.md).

---

## 9. Referências rápidas

| Documento | Conteúdo |
|-----------|----------|
| [AMBIENTES-CONFIGURACAO.md](AMBIENTES-CONFIGURACAO.md) | Local, staging, produção — dados e variáveis |
| [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md) | Passo a passo Railway, checklist, domínio customizado |
| [PIPELINE-ESTEIRAS.md](PIPELINE-ESTEIRAS.md) | Git Flow, release e tags, CI/CD |
| [REFERENCIA-CONFIGURACAO.md](REFERENCIA-CONFIGURACAO.md) | Todas as variáveis por serviço |
| [GUIA-DO-SISTEMA.md](GUIA-DO-SISTEMA.md) | Visão geral do sistema e operação |
| [EXECUCAO-VENDA-MONITORIZACAO.md](EXECUCAO-VENDA-MONITORIZACAO.md) | Playbook único: staging → monitorização → promoção → produção |
| Raiz: `.env.example` | Variáveis do `docker-compose.prod.yml` (OIDC JWKS, JWT partilhado, Resend, Stripe billing + ledger, `ENCRYPTION_KEY`) |
| Script `pnpm verify:go-live` | Health HTTP dos três backends (`scripts/go-live-production-verify.sh`) |

---

## 10. Backups (PostgreSQL e dados)

- [ ] **Railway:** no plugin PostgreSQL do projeto Production, confirmar política de backup (snapshot automático conforme plano). Documentação operacional da Railway sobre backups do Postgres.
- [ ] **Export manual:** agendar `pg_dump` encriptado para armazenamento externo (S3 compatível, bucket privado) pelo menos mensalmente para clientes enterprise.
- [ ] **Teste de restore:** pelo menos uma vez por trimestre, restaurar backup para um ambiente isolado e validar integridade (schema + amostra de dados).

Secrets (`JWT_SECRET`, `STRIPE_*`, `RESEND_*`, `ENCRYPTION_KEY`) devem estar apenas em gestão de secrets (Railway / Vault); **não** incluir em dumps públicos nem em repositório.

---

## 11. Observabilidade

- [ ] **Sentry (recomendado):** os três backends já incluem o SDK (Core Spring, Orders Nest, Payments FastAPI/worker). Em cada serviço definir `SENTRY_DSN` (no compose: `SENTRY_DSN_CORE` / `SENTRY_DSN_ORDERS` / `SENTRY_DSN_PAYMENTS` → ver [.env.example](../.env.example)); opcional `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE`.
- [ ] **Métricas:** spring-saas-core expõe métricas Micrometer/Prometheus conforme perfil — não expor `/actuator/prometheus` à Internet sem autenticação ou rede privada.
- [ ] **Alertas:** thresholds iniciais em [MONITORING-THRESHOLDS.md](MONITORING-THRESHOLDS.md); configurar pelo menos alerta de disponibilidade (health falhou) e um alerta de erros ou latência por serviço.
- [ ] **OpenTelemetry:** no compose de referência os serviços apontam OTLP para Jaeger local; em Railway pode usar exporter OTLP para o provedor gerido (Datadog, Grafana Cloud, etc.) se aplicável.

---

## 12. Stripe — billing (Core) vs pagamentos (ledger)

| Fluxo | Serviço | Variáveis típicas |
|-------|---------|-------------------|
| Assinaturas / portal cliente / planos | spring-saas-core | `APP_BILLING_PROVIDER=stripe`, `STRIPE_BILLING_SECRET_KEY` |
| Cobrança de pedidos B2B / ledger | py-payments-ledger | `GATEWAY_PROVIDER=stripe`, `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`, `ENCRYPTION_KEY` |

- [ ] No **Stripe Dashboard → Developers → Webhooks**, registar o endpoint **HTTPS público** exposto pelo **py-payments-ledger** para eventos de `payment_intent` / gateway conforme documentação desse repositório (path exacto pode variar por versão — confirmar no código ou README do serviço).
- [ ] Copiar o **Signing secret** do webhook para `STRIPE_WEBHOOK_SECRET` no serviço de pagamentos.
- [ ] Para billing SaaS no Core, configurar webhook ou billing conforme integração Stripe Customer Portal já usada pela Admin Console.

---

## 13. Script de verificação pós-deploy

Com três URLs públicas (staging ou produção):

```bash
export CORE_URL=https://...
export ORDERS_URL=https://...
export PAYMENTS_URL=https://...
pnpm verify:go-live
```

O script chama os endpoints de health documentados na secção 7 e falha com código diferente de zero se algum não responder HTTP 2xx.

---

## Fluxo resumido

1. Validar staging (develop) e CI verde.
2. Abrir PR `develop` → `master`; revisar e fazer merge (--no-ff).
3. Criar tag de release (ex.: `v1.5.0`) se adotado o processo de tags.
4. Railway faz deploy automático da branch `master`.
5. Configurar variáveis de produção (JWT, Stripe, Resend, CORS, OIDC).
6. Rodar migrations (sem seed) se necessário.
7. Configurar domínio customizado e SSL.
8. Executar checklist pós-deploy (seção 7).
9. Publicar termos e política de privacidade; definir suporte.
