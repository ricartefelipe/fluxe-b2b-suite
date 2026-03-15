# Deploy no Railway — Fluxe B2B Suite

> **Ambientes:** Para configuração completa de local, staging e produção (dados, seed, variáveis), veja [AMBIENTES-CONFIGURACAO.md](AMBIENTES-CONFIGURACAO.md).

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
- `APP_DEV_TOKEN_ENDPOINT_ENABLED=false`

#### node-b2b-orders
```bash
cd node-b2b-orders
railway link
railway up
```

Variáveis (ver `railway.prod.env.example`):
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
- `AUTH_MODE=hs256`

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

- [ ] Health check de cada backend (`/actuator/health`, `/v1/healthz`, `/healthz`)
- [ ] Frontends carregam e exibem a tela de login
- [ ] Login funciona (perfis rápidos ou OIDC)
- [ ] Produtos listam no Shop
- [ ] Dashboard do Ops Portal carrega
- [ ] Tenants listam no Admin Console
- [ ] JWT_SECRET é o **mesmo** nos 3 backends
- [ ] `APP_DEV_TOKEN_ENDPOINT_ENABLED=false` em produção
- [ ] CORS: nos 3 backends, variável `CORS_ORIGINS` ou `CORS_ALLOWED_ORIGINS` com as origens dos frontends (vírgula)
- [ ] Frontends (ops-portal, admin-console): `CORE_API_BASE_URL`, `ORDERS_API_BASE_URL`, `PAYMENTS_API_BASE_URL` com URLs absolutas

## Domínio Customizado

No Railway, cada serviço recebe `*.up.railway.app`. Para domínio próprio:

1. **Settings** → **Domains** → **Custom Domain**
2. Apontar CNAME do seu domínio para o Railway
3. SSL automático via Let's Encrypt

Exemplo:
- `app.fluxe.com.br` → shop
- `admin.fluxe.com.br` → admin-console
- `ops.fluxe.com.br` → ops-portal
- `api.fluxe.com.br` → spring-saas-core

## Troubleshooting

| Problema | Solução |
|---|---|
| Build falha (Maven/npm) | Verificar se o Dockerfile está correto e as dependências estão no `package.json`/`pom.xml` |
| 401 nas APIs | Verificar se `JWT_SECRET` é o mesmo em todos os backends |
| Frontend não conecta | Verificar `CORE_API_BASE_URL` e CORS_ORIGINS |
| **Painel Ops (ou Admin) não carrega / dashboard vazio** | Nos serviços **ops-portal** e **admin-console**, definir **URLs absolutas** das APIs: `CORE_API_BASE_URL`, `ORDERS_API_BASE_URL`, `PAYMENTS_API_BASE_URL` (ex.: `https://spring-saas-core-xxx.up.railway.app`). O `entrypoint.sh` gera `/assets/config.json` a partir do template; se essas variáveis não estiverem setadas, o front chama URLs quebradas. Também garantir que o usuário logado tenha `tenantId` na sessão (Core deve estar acessível para login e lista de tenants). |
| RabbitMQ não conecta | Verificar URL do CloudAMQP e credenciais |
| Migrations falham | Verificar `DATABASE_URL` e se o PostgreSQL está acessível |
