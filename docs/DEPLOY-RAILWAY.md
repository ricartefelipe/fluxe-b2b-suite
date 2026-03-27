# Deploy no Railway — Fluxe B2B Suite

> **Ambientes:** Para configuração completa de local, staging e produção (dados, seed, variáveis), veja [AMBIENTES-CONFIGURACAO.md](AMBIENTES-CONFIGURACAO.md).  
> **Go-live para venda:** Use o checklist completo em [GO-LIVE-VENDA.md](GO-LIVE-VENDA.md).

## Visão Geral

A stack completa requer **7 serviços** no Railway:

| Serviço | Repositório | Tipo | Porta |
|---|---|---|---|
| spring-saas-core | spring-saas-core | Docker | 8080 |
| node-b2b-orders | node-b2b-orders | Docker | 3000 |
| py-payments-ledger | py-payments-ledger | Docker | 8000 |
| shop (frontend SSR) | fluxe-b2b-suite | Docker | 4000 |
| admin-console | fluxe-b2b-suite | Docker | 80 |
| ops-portal | fluxe-b2b-suite | Docker | 80 |
| PostgreSQL | — | Plugin | 5432 |
| Redis | — | Plugin | 6379 |

> **RabbitMQ**: use [CloudAMQP](https://www.cloudamqp.com/) (free tier: 1M msgs/mês).

### Branch e ambiente (não alterar)

| Branch | Ambiente |
|--------|----------|
| `master` | Produção |
| `develop` | Staging |

Configure cada projeto Railway com **Production Branch** = `develop` (staging) ou `master` (produção) conforme o ambiente.

## Custo Estimado

| Cenário | Custo/mês |
|---|---|
| MVP (sem Keycloak) | ~$29-34 |
| Com Keycloak | ~$36-41 |
| Pico de uso | até ~$50 |

## Passo a Passo

### 1. Criar projeto no Railway

```bash
# Instalar CLI
npm install -g @railway/cli
railway login
railway init
```

### 2. Adicionar plugins managed

No dashboard do Railway:
- **+ New** → PostgreSQL
- **+ New** → Redis

### 3. Configurar RabbitMQ externo

1. Criar conta em [cloudamqp.com](https://www.cloudamqp.com/)
2. Criar instância (Little Lemur — gratuita)
3. Copiar a URL AMQP

### 4. Deploy dos backends

Para cada backend, criar um serviço conectado ao repositório GitHub:

#### spring-saas-core
```bash
cd spring-saas-core
railway link
railway up
```

Variáveis (ver `railway.prod.env.example`):
- **Produção:** `SPRING_PROFILES_ACTIVE=prod` (Liquibase só essencial, sem seed)
- **Staging:** `SPRING_PROFILES_ACTIVE=staging` (Liquibase com seed completo)
- `DB_URL`, `DB_USER`, `DB_PASS` → referências ao plugin PostgreSQL
- `REDIS_HOST`, `REDIS_PORT` → referências ao plugin Redis
- `RABBITMQ_HOST/PORT/USER/PASS` → CloudAMQP
- `JWT_HS256_SECRET` → gerar com `openssl rand -base64 32`
- **Email (convites):** `EMAIL_PROVIDER=resend`, `RESEND_API_KEY=re_xxx`, `FRONTEND_URL=https://admin-console-xxx.up.railway.app`, `EMAIL_FROM=noreply@seudominio.com.br` (domínio verificado no Resend)
- `APP_DEV_TOKEN_ENDPOINT_ENABLED=false`

#### node-b2b-orders
```bash
cd node-b2b-orders
railway link
railway up
```

Variáveis (ver `railway.prod.env.example`):
- **Staging:** `NODE_ENV=staging` (roda migrate + seed no startup)
- **Produção:** `NODE_ENV=production` (apenas migrate)
- `DATABASE_URL` → referência ao plugin PostgreSQL
- `REDIS_URL` → referência ao plugin Redis
- `RABBITMQ_URL` → CloudAMQP
- `JWT_SECRET` → **mesmo** valor do spring-saas-core
- `JWT_ISSUER=spring-saas-core`

#### py-payments-ledger
```bash
cd py-payments-ledger
railway link
railway up
```

Variáveis (ver `railway.prod.env.example`):
- **Staging:** `APP_ENV=staging` (roda migrate + seed no startup)
- **Produção:** `APP_ENV=production` (apenas migrate)
- Mesma lógica dos outros backends
- `ENCRYPTION_KEY` → gerar com `python -m src.shared.encryption`
- `JWT_SECRET` → **mesmo** valor dos outros

### 5. Deploy dos frontends

Os 3 frontends estão no monorepo `fluxe-b2b-suite`. Criar um serviço para cada:

- **shop**: Dockerfile em `saas-suite-ui/apps/shop/Dockerfile`, root path = `saas-suite-ui`
- **admin-console**: Dockerfile em `saas-suite-ui/apps/admin-console/Dockerfile`, root path = `saas-suite-ui`
- **ops-portal**: Dockerfile em `saas-suite-ui/apps/ops-portal/Dockerfile`, root path = `saas-suite-ui`

Variáveis para **todos** os frontends (ver `saas-suite-ui/railway.prod.env.example`):
- `CORE_API_BASE_URL` → URL do spring-saas-core no Railway
- `ORDERS_API_BASE_URL` → URL do node-b2b-orders no Railway
- `PAYMENTS_API_BASE_URL` → URL do py-payments-ledger no Railway
- `AUTH_MODE=oidc` em produção (recomendado); `hs256` apenas para staging/demo
- Em produção, configurar `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_SCOPE` conforme [REFERENCIA-CONFIGURACAO.md](REFERENCIA-CONFIGURACAO.md)

Para **ops-portal** e **admin-console** use sempre **URLs absolutas** (ex.: `https://spring-saas-core-xxx.up.railway.app`). URLs relativas (`/api/core`) só funcionam com proxy reverso; no Railway cada app é um serviço separado.

**Shop (opcional):** `SUPPORT_EMAIL` (e-mail da página Fale conosco) e `SUPPORT_DOCS_URL` (URL do help center; se definida, o link "Ajuda" no rodapé abre essa URL).

### 5.1 CORS nos backends

Cada backend precisa aceitar as origens dos 3 frontends. Defina a variável no **projeto** ou **serviço** de cada backend:

| Backend | Variável | Exemplo (Railway) |
|---------|----------|-------------------|
| spring-saas-core | `CORS_ALLOWED_ORIGINS` | `https://shop.xxx.up.railway.app,https://admin-console.xxx.up.railway.app,https://ops-portal.xxx.up.railway.app` |
| node-b2b-orders | `CORS_ORIGINS` | Idem (lista separada por vírgula) |
| py-payments-ledger | `CORS_ORIGINS` | Idem |

Use os URLs reais dos seus serviços. Com domínio customizado: `https://app.fluxe.com.br,https://admin.fluxe.com.br,https://ops.fluxe.com.br`.

### 6. Migrations

Após o primeiro deploy, rodar migrations:

```bash
# spring-saas-core: Liquibase roda automaticamente no startup

# node-b2b-orders:
railway run npx prisma migrate deploy

# py-payments-ledger:
railway run alembic upgrade head
```

### 7. Seed (apenas Staging)

- **Staging:** migration + seed completo para testes. Use o script orquestrador a partir do repo `fluxe-b2b-suite` (repos irmãos linkados ao projeto Railway Staging):

```bash
cd fluxe-b2b-suite
./scripts/staging-seed.sh railway
```

  Detalhes do que cada serviço executa: [AMBIENTES-CONFIGURACAO.md](AMBIENTES-CONFIGURACAO.md#alimentar-staging-com-dados-após-primeiro-deploy).

- **Produção:** não rodar seed; apenas migrations. Dados reais via aplicação.

## Checklist Pós-Deploy

Ver checklist completo em [GO-LIVE-VENDA.md](GO-LIVE-VENDA.md). Resumo:

- [ ] Health check de cada backend (`/actuator/health`, `/v1/healthz`, `/healthz`)
- [ ] Frontends carregam e exibem a tela de login
- [ ] Login funciona (OIDC ou HS256 com segredo forte)
- [ ] Produtos listam no Shop
- [ ] Dashboard do Ops Portal carrega
- [ ] Tenants listam no Admin Console
- [ ] JWT_SECRET é o **mesmo** nos 3 backends
- [ ] `APP_DEV_TOKEN_ENDPOINT_ENABLED=false` em produção
- [ ] CORS: nos 3 backends, variável `CORS_ORIGINS` ou `CORS_ALLOWED_ORIGINS` com as origens dos frontends (vírgula), incluindo domínio customizado se usado
- [ ] Frontends (ops-portal, admin-console): `CORE_API_BASE_URL`, `ORDERS_API_BASE_URL`, `PAYMENTS_API_BASE_URL` com URLs absolutas
- [ ] (Opcional) Métricas: Prometheus/Grafana configurados (ver seção abaixo)

## Métricas e Grafana no deploy

Os backends já expõem métricas (Prometheus):

| Serviço              | Endpoint                  |
|----------------------|---------------------------|
| spring-saas-core     | `GET /actuator/prometheus` |
| node-b2b-orders      | `GET /metrics`            |
| py-payments-ledger   | `GET /metrics`            |

Para **ver** métricas em produção você pode usar uma destas opções.

### Opção A — Grafana Cloud (recomendado para Railway)

1. Crie conta em [grafana.com/products/cloud](https://grafana.com/products/cloud) (free tier).
2. Crie um **Prometheus** stack (ou use o Prometheus da Grafana Cloud).
3. Em **Connections** → **Add new connection** → **Prometheus**, configure um **Remote Write** ou use **Scrape** apontando para as URLs públicas dos backends. Exemplo de `scrape_configs` com URLs Railway: [monitoring/prometheus/prometheus.railway.example.yml](../monitoring/prometheus/prometheus.railway.example.yml) (substitua `XXXX` pelos IDs reais dos seus serviços).
   - `https://<spring-saas-core>.up.railway.app/actuator/prometheus`
   - `https://<node-b2b-orders>.up.railway.app/metrics`
   - `https://<py-payments-ledger>.up.railway.app/metrics`
4. Importe os dashboards que estão em `fluxe-b2b-suite/monitoring/grafana/dashboards/` (overview, saas-core, orders, payments) ou recrie os painéis a partir deles.

Se os endpoints `/actuator/prometheus` e `/metrics` forem restritos (ex.: só rede interna), use um **Grafana Agent** ou um job de scrape em um servidor que tenha acesso (ou exponha com autenticação e configure no Grafana Cloud).

### Opção B — Prometheus + Grafana como serviços no Railway

1. No mesmo projeto Railway, adicione dois serviços (ou use um compose):
   - **Prometheus**: imagem `prom/prometheus`, com um `prometheus.yml` que faça scrape das URLs **internas** dos backends (no Railway, use o hostname do serviço, ex.: `spring-saas-core.railway.internal:8080` se disponível, ou as URLs públicas).
2. **Grafana**: imagem `grafana/grafana`, variável `GF_SECURITY_ADMIN_PASSWORD`, datasource Prometheus apontando para `http://prometheus:9090`.
3. Use os arquivos em `monitoring/prometheus/` e `monitoring/grafana/` como base; ajuste `scrape_configs` com os endereços reais dos backends no Railway.

### Checklist rápido de métricas

- [ ] Prometheus (ou Grafana Cloud) fazendo scrape de pelo menos um backend.
- [ ] Dashboards de overview/saas-core/orders/payments visíveis.
- [ ] Alertas (opcional): usar `monitoring/prometheus/alerts/` se tiver Alertmanager.

## Domínio customizado e SSL

No Railway, cada serviço recebe `*.up.railway.app`. Para **produção com domínio próprio**:

1. No serviço: **Settings** → **Domains** → **Custom Domain**
2. Informar o domínio (ex.: `app.seudominio.com.br`)
3. No provedor DNS: criar **CNAME** apontando para o host indicado pelo Railway (ex.: `xxx.up.railway.app`)
4. SSL: Railway provisiona certificado **Let's Encrypt** automaticamente após o DNS propagar
5. Atualizar **CORS** em todos os backends com a lista exata de origens (ex.: `https://app.seudominio.com.br,https://admin.seudominio.com.br,https://ops.seudominio.com.br`)
6. Atualizar variáveis dos frontends (`CORE_API_BASE_URL`, etc.) se usar domínio customizado também para as APIs

Exemplo de mapeamento:
- `app.fluxe.com.br` → shop
- `admin.fluxe.com.br` → admin-console
- `ops.fluxe.com.br` → ops-portal
- `api.fluxe.com.br` → spring-saas-core

## Troubleshooting

| Problema | Solução |
|---|---|
| Build falha (Maven/npm) | Verificar se o Dockerfile está correto e as dependências estão no `package.json`/`pom.xml` |
| 401 nas APIs | Verificar se `JWT_SECRET` é o mesmo em todos os backends |
| **EventSource MIME type / 401 em `/api/notifications/stream`** | O endpoint de notificações SSE não existe no Spring Core. O front não conecta em staging/prod (só mock em dev local). Se aparecer 401 ou "MIME type not text/event-stream", ignore — o recurso de notificações em tempo real será implementado depois. |
| **500 em `GET /v1/tenants`** | Erro no backend. Verifique logs do spring-saas-core no Railway. Causas comuns: tabela `policies` vazia (ABAC precisa de ao menos uma política ALLOW para `tenants:read`), falha de Redis/DB, ou JWT inválido. Staging: rodar seed (`./scripts/staging-seed.sh railway`) para popular policies e dados iniciais. |
| **Tenants não listam no Admin Console** | Ver seção [Tenants não listam](#tenants-não-listam-no-admin-console) abaixo. |
| Frontend não conecta | Verificar `CORE_API_BASE_URL` e CORS_ORIGINS |
| **Painel Ops (ou Admin) não carrega / dashboard vazio** | Nos serviços **ops-portal** e **admin-console**, definir **URLs absolutas** das APIs: `CORE_API_BASE_URL`, `ORDERS_API_BASE_URL`, `PAYMENTS_API_BASE_URL` (ex.: `https://spring-saas-core-xxx.up.railway.app`). O `entrypoint.sh` gera `/assets/config.json` a partir do template; se essas variáveis não estiverem setadas, o front chama URLs quebradas. Também garantir que o usuário logado tenha `tenantId` na sessão (Core deve estar acessível para login e lista de tenants). |
| RabbitMQ não conecta | Verificar URL do CloudAMQP e credenciais |
| Migrations falham | Verificar `DATABASE_URL` e se o PostgreSQL está acessível |

### Tenants não listam no Admin Console

1. **Verificar `CORE_API_BASE_URL` no admin-console:** Deve apontar para o **Spring Core** (ex.: `https://spring-saas-core-xxx.up.railway.app`). Confirme em `/assets/config.json` do build que `coreApiBaseUrl` está correto.
2. **Se `CORE_API_BASE_URL` apontar para o Node (BFF):** No **node-b2b-orders**, defina `CORE_API_URL` com a URL do Spring Core. O proxy em `/v1/tenants` encaminha para o Core.
3. **Testar `GET /v1/tenants` diretamente:** Com um JWT válido, faça `curl -H "Authorization: Bearer <token>" https://<core-url>/v1/tenants`. Deve retornar 200 com `{ items: [...] }`.
4. **Policies no Spring:** O Liquibase changeset `008-essential-seed-all-envs.yaml` insere `tenants:read` e `tenants:write`. Se a tabela `policies` estiver vazia, o ABAC bloqueia. Em staging: `SPRING_PROFILES_ACTIVE=staging` e seed (`./scripts/staging-seed.sh railway`). Em prod: o 008 roda no startup e popula as políticas essenciais.
5. **CORS:** O Spring deve ter `CORS_ALLOWED_ORIGINS` com a origem do admin-console (ex.: `https://admin-console-xxx.up.railway.app`).
6. **Erro de deserialização no Redis:** Se o 500 mostrar `SerializationException` ou similar no campo `detail`, o cache Redis está com dados incompatíveis. No Railway, defina `CACHE_FRONT_TENANTS_ENABLED=false` no spring-saas-core para desativar o cache de tenants (usa memória). Ou reinicie o Redis para limpar.
7. **URL da API no Admin:** No Railway, o serviço **admin-console** precisa de `CORE_API_BASE_URL` apontando para o Spring (ex.: `https://spring-saas-core-xxx.up.railway.app`). Se vazio, o front chama URLs quebradas.
