# Deploy na AWS (EC2 + Docker Compose)

Alternativa ao Railway usando a **conta Amazon** que você já tem. Caminho mais simples: **uma EC2** (ou **Lightsail**) com `docker-compose.prod.yml` — mesma stack documentada para VM genérica.

---

## Opção recomendada para começar

| Recurso AWS | Uso | Custo típico |
|-------------|-----|--------------|
| **EC2** `t3.medium` (2 vCPU, 4 GB) ou **Lightsail** $10–20/mês | Host único: Postgres, Redis, RabbitMQ, 3 APIs, 3 workers, Nginx | ~US$ 15–40/mês |
| **Route 53** (opcional) | DNS `shop.`, `ops.`, `admin.`, `auth.`, `api.` | ~US$ 0,50/zona + consultas |
| **Amazon SES** | E-mail transacional (convites, reset) — substituto do Resend | Pay-as-you-go, tier gratuito inicial |
| **ACM + ALB** (opcional) | TLS gerenciado na frente da EC2 | ALB ~US$ 16/mês; ou **Caddy/Certbot na EC2** (grátis) |

**Não precisa de ECS/EKS** na primeira publicação — Compose na EC2 reduz complexidade e custo.

---

## Passo a passo

### 1. Criar a instância

1. **EC2** → Ubuntu 24.04 LTS, `t3.medium`, disco 40–80 GB gp3.
2. **Security group** — liberar:
   - `22` (SSH, só seu IP)
   - `80`, `443` (HTTP/HTTPS público)
   - **Não** expor Postgres/Redis/RabbitMQ (5432, 6379, 5672) à internet — o compose já binda em `127.0.0.1`.
3. Elastic IP (opcional, recomendado) para IP fixo.

Lightsail: pacote 4 GB RAM, mesmo fluxo (SSH + Docker).

### 2. Preparar o host

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER
# relogar SSH
```

### 3. Clonar e configurar secrets

```bash
git clone git@github.com:ricartefelipe/fluxe-b2b-suite.git
cd fluxe-b2b-suite
cp .env.example .env
# Editar .env — ver secção abaixo (JWT, DB, SES, Stripe test)
openssl rand -base64 32   # JWT_SECRET, DB_PASSWORD, etc.
./scripts/producao-preflight.sh .env
```

### 4. Imagens

**A)** Pull do GHCR (se CI publica `ricartefelipe/*:latest`):

```bash
docker compose -f docker-compose.prod.yml pull
```

**B)** Build na própria EC2 (primeira vez ou sem GHCR):

```bash
# Clonar também spring-saas-core, node-b2b-orders, py-payments-ledger no mesmo host
# ou ajustar docker-compose.prod.yml para build.context apontando para ../
docker compose -f docker-compose.prod.yml build
```

### 5. Subir stack

```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

Migrations rodam nos entrypoints (`SPRING_PROFILES_ACTIVE=prod`, `NODE_ENV=production`, `APP_ENV=production`) — **sem seed de demo**.

### 6. TLS e domínio

**Opção barata:** Caddy ou Nginx na EC2 + **Let's Encrypt** (ver `deploy/nginx/` e [GUIA-DEPLOY-PASSO-A-PASSO.md](GUIA-DEPLOY-PASSO-A-PASSO.md)).

**Opção AWS:** Route 53 → ALB → target group EC2:443; certificado **ACM** no ALB.

Atualizar `.env`:

- `DOMAIN`, `KEYCLOAK_HOSTNAME`, `CORS_ALLOWED_ORIGINS` com URLs HTTPS reais.
- `FRONTEND_URL` para o Admin Console público.

### 7. E-mail com Amazon SES

No Core (variáveis do serviço `saas-core` no compose ou `.env`):

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=<SMTP credentials SES>
SMTP_PASSWORD=<SMTP password SES>
EMAIL_FROM=noreply@seudominio.com
```

Verificar domínio/remetente no console SES (sandbox → produção quando for vender).

### 8. Validar go-live

```bash
export CORE_URL=https://api.seudominio.com
export ORDERS_URL=https://orders.seudominio.com
export PAYMENTS_URL=https://payments.seudominio.com
pnpm verify:go-live
```

Smoke pedido (staging/piloto com Stripe **test**):

```bash
export ORDERS_SMOKE_URL=$ORDERS_URL
export PAYMENTS_SMOKE_URL=$PAYMENTS_URL
pnpm smoke:order-staging:saga
```

---

## Variáveis críticas (`.env`)

| Variável | Notas |
|----------|--------|
| `JWT_SECRET` | **Idêntico** nos 3 backends |
| `CORS_ALLOWED_ORIGINS` | Lista CSV HTTPS dos 3 fronts |
| `GATEWAY_PROVIDER` | `stripe` + chaves test; `fake` só para demo interna |
| `APP_BILLING_PROVIDER` | `stripe` quando for cobrar assinaturas |
| `EMAIL_PROVIDER` | `smtp` + SES em produção |
| Workers | Confirmar serviços `orders-worker` e `payments-worker` no compose |

---

## Workers obrigatórios

Sem os workers, pedidos ficam em `CREATED`/`CONFIRMED` e a saga não chega a `PAID`. No `docker-compose.prod.yml` devem existir serviços equivalentes a:

- `node-b2b-orders-worker`
- `py-payments-ledger-worker`

Se faltar, adicionar antes do primeiro cliente pagante.

---

## Escalar depois (opcional)

| Fase | AWS |
|------|-----|
| Piloto (1–5 clientes) | EC2 única + Compose |
| Crescimento | RDS PostgreSQL, ElastiCache Redis, Amazon MQ |
| Alta disponibilidade | ECS Fargate + ALB, secrets no **Secrets Manager** |

---

## Documentos relacionados

| Objetivo | Arquivo |
|----------|---------|
| Compose produção | [../docker-compose.prod.yml](../docker-compose.prod.yml) |
| Secrets | [../.env.example](../.env.example) |
| Go-live completo | [GO-LIVE-VENDA.md](GO-LIVE-VENDA.md) |
| Sem Railway | [RETOMADA-SEM-RAILWAY.md](RETOMADA-SEM-RAILWAY.md) |
| Operação | [PRODUCAO-OPERACAO.md](PRODUCAO-OPERACAO.md) |
