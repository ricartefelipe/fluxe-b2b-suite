# Fluxe B2B Suite — Deployment Guide

Production deployment guide for the full Fluxe B2B platform: **spring-saas-core** (control plane), **node-b2b-orders** (orders API), **py-payments-ledger** (payments API), and **fluxe-b2b-suite** (frontend apps).

---

## Prerequisites

| Tool            | Version   | Notes                                 |
|-----------------|-----------|---------------------------------------|
| Docker          | 24+       | With Docker Compose v2                |
| Docker Compose  | 2.20+     | Bundled with Docker Desktop           |
| Java            | 21+       | For spring-saas-core                  |
| Node.js         | 20+       | For node-b2b-orders                   |
| Python          | 3.12+     | For py-payments-ledger                |
| pnpm            | 9+        | For fluxe-b2b-suite frontend          |
| Keycloak        | 24+       | OIDC provider for production auth     |

---

## Environment Variables

### spring-saas-core

| Variable                 | Required | Default          | Description                                      |
|--------------------------|----------|------------------|--------------------------------------------------|
| `SPRING_PROFILES_ACTIVE` | Yes      | `local`          | Set to `prod` for production                     |
| `AUTH_MODE`              | Yes      | `hs256`          | Set to `oidc` for production                     |
| `OIDC_ISSUER_URI`        | Yes*     | —                | Keycloak realm URL (required when `AUTH_MODE=oidc`) |
| `JWT_HS256_SECRET`       | No       | —                | Only if `AUTH_MODE=hs256` (NOT for production)   |
| `JWT_ISSUER`             | Yes      | `spring-saas-core` | JWT issuer claim                               |
| `DB_URL`                 | Yes      | —                | `jdbc:postgresql://host:5432/saascore`           |
| `DB_USER`                | Yes      | —                | PostgreSQL username                              |
| `DB_PASS`                | Yes      | —                | PostgreSQL password                              |
| `REDIS_HOST`             | Yes      | `localhost`      | Redis hostname                                   |
| `REDIS_PORT`             | Yes      | `6379`           | Redis port                                       |
| `RABBITMQ_HOST`          | Yes      | `localhost`      | RabbitMQ hostname                                |
| `RABBITMQ_PORT`          | Yes      | `5672`           | RabbitMQ port                                    |
| `RABBITMQ_USER`          | Yes      | `guest`          | RabbitMQ username                                |
| `RABBITMQ_PASS`          | Yes      | `guest`          | RabbitMQ password                                |
| `OUTBOX_PUBLISH_ENABLED` | Yes      | `false`          | Enable outbox event publishing via RabbitMQ      |
| `CORS_ALLOWED_ORIGINS`   | Yes      | `*`              | Comma-separated allowed CORS origins             |
| `SENTRY_DSN`             | No       | —                | Sentry DSN for error tracking                    |
| `SERVER_PORT`            | No       | `8080`           | HTTP server port                                 |

### node-b2b-orders

| Variable       | Required | Default | Description                                      |
|----------------|----------|---------|--------------------------------------------------|
| `NODE_ENV`     | Yes      | —       | Set to `production`                              |
| `JWT_SECRET`   | **Yes**  | —       | **No default** — must match spring-saas-core     |
| `JWT_ISSUER`   | Yes      | —       | Must match `JWT_ISSUER` in spring-saas-core      |
| `DATABASE_URL` | Yes      | —       | `postgresql://user:pass@host:5432/dbname`        |
| `REDIS_URL`    | **Yes**  | —       | **Required in production** — `redis://host:6379` |
| `RABBITMQ_URL` | **Yes**  | —       | **Required in production** — `amqp://user:pass@host:5672` |
| `CORS_ORIGINS` | Yes      | `*`     | Comma-separated allowed CORS origins             |
| `SENTRY_DSN`   | No       | —       | Sentry DSN for error tracking                    |
| `PORT`         | No       | `3000`  | HTTP server port                                 |

### py-payments-ledger

| Variable               | Required    | Default | Description                                    |
|------------------------|-------------|---------|------------------------------------------------|
| `JWT_SECRET`           | **Yes**     | —       | **No default** — must match spring-saas-core   |
| `JWT_ISSUER`           | Yes         | —       | Must match `JWT_ISSUER` in spring-saas-core    |
| `DATABASE_URL`         | Yes         | —       | `postgresql://user:pass@host:5432/dbname`      |
| `REDIS_URL`            | Yes         | —       | `redis://host:6379`                            |
| `RABBITMQ_URL`         | Yes         | —       | `amqp://user:pass@host:5672`                   |
| `GATEWAY_PROVIDER`     | Yes         | `fake`  | `stripe` or `fake`                             |
| `STRIPE_API_KEY`       | Conditional | —       | **Required** if `GATEWAY_PROVIDER=stripe`      |
| `STRIPE_WEBHOOK_SECRET`| Conditional | —       | Required for Stripe webhook verification       |
| `CORS_ORIGINS`         | Yes         | `*`     | Comma-separated allowed CORS origins           |
| `SENTRY_DSN`           | No          | —       | Sentry DSN for error tracking                  |
| `PORT`                 | No          | `8000`  | HTTP server port                               |

### fluxe-b2b-suite (frontend apps)

| Variable          | Required | Description                              |
|-------------------|----------|------------------------------------------|
| `CORE_API_URL`    | Yes      | spring-saas-core base URL (e.g. `https://api.example.com`) |
| `ORDERS_API_URL`  | Yes      | node-b2b-orders base URL                 |
| `PAYMENTS_API_URL`| Yes      | py-payments-ledger base URL              |
| `KEYCLOAK_URL`    | Yes      | Keycloak server URL (e.g. `https://auth.example.com`) |

> **Critical:** `JWT_SECRET` and `JWT_ISSUER` MUST be identical across spring-saas-core, node-b2b-orders, and py-payments-ledger. In production with OIDC, use public key verification instead of shared secrets.

---

## Network Setup

All services communicate through a shared Docker network. Create it before starting any service:

```bash
docker network create fluxe_shared
```

### Port Mapping (default)

| Service             | Internal Port | External Port | Notes                    |
|---------------------|---------------|---------------|--------------------------|
| spring-saas-core    | 8080          | 8080          | Control plane API        |
| node-b2b-orders API | 3000          | 3000          | Orders API               |
| py-payments-ledger  | 8000          | 8000          | Payments API             |
| PostgreSQL (core)   | 5432          | 5432          | spring-saas-core DB      |
| PostgreSQL (orders) | 5432          | 5433          | node-b2b-orders DB       |
| PostgreSQL (payments)| 5432         | 5434          | py-payments-ledger DB    |
| Redis (core)        | 6379          | 6379          |                          |
| Redis (orders)      | 6379          | 6380          |                          |
| Redis (payments)    | 6379          | 6381          |                          |
| RabbitMQ (shared)   | 5672          | 5672          | Shared broker            |
| RabbitMQ Management | 15672         | 15672         | Admin UI                 |
| Keycloak            | 8080          | 8180          | OIDC provider            |
| Grafana (core)      | 3000          | 3030          |                          |
| Prometheus (core)   | 9090          | 9090          |                          |

---

## Database Migrations

### spring-saas-core (Liquibase)

Migrations run automatically on application startup. In production, the `prod` Liquibase context excludes seed data:

```bash
# Verify migration status
cd spring-saas-core
./mvnw liquibase:status -Dspring.profiles.active=prod
```

### node-b2b-orders (Prisma)

```bash
cd node-b2b-orders
npx prisma migrate deploy
```

### py-payments-ledger (Alembic)

```bash
cd py-payments-ledger
alembic upgrade head
```

---

## Service Start Order

Services have strict dependency ordering. Follow this sequence:

### Phase 1 — Infrastructure

Start PostgreSQL, Redis, and RabbitMQ. Wait for health checks to pass.

```bash
# From each project directory, or use a unified compose
docker compose up -d postgres redis rabbitmq
```

### Phase 2 — spring-saas-core (auth provider)

The control plane must be running before dependent services, as it provides JWT validation and tenant governance.

```bash
cd spring-saas-core
docker compose up -d app
# Wait for health
curl --retry 30 --retry-delay 2 --retry-all-errors \
  http://localhost:8080/actuator/health/liveness
```

### Phase 3 — node-b2b-orders + py-payments-ledger (parallel)

These services can start in parallel. Both validate JWTs against the shared secret or OIDC provider.

```bash
# In separate terminals or background
cd node-b2b-orders && docker compose up -d api worker
cd py-payments-ledger && docker compose up -d api worker
```

Run migrations after services are up:

```bash
cd node-b2b-orders && docker compose run --rm api npx prisma migrate deploy
cd py-payments-ledger && docker compose run --rm api alembic upgrade head
```

### Phase 4 — fluxe-b2b-suite (frontend)

```bash
cd fluxe-b2b-suite/saas-suite-ui
pnpm nx build shop --configuration=production
pnpm nx build ops-portal --configuration=production
pnpm nx build admin-console --configuration=production
```

Serve the built assets via Nginx, CDN, or any static file server.

### Automated Start

Use the convenience script to start everything at once (development):

```bash
cd fluxe-b2b-suite
./scripts/up-all.sh
```

---

## Health Checks

### spring-saas-core

| Endpoint                                 | Purpose                        |
|------------------------------------------|--------------------------------|
| `GET /actuator/health/liveness`          | Kubernetes liveness probe      |
| `GET /actuator/health/readiness`         | Readiness (DB + dependencies)  |
| `GET /healthz`                           | Simple liveness                |
| `GET /readyz`                            | Readiness (DB; Redis/RabbitMQ optional) |
| `GET /actuator/prometheus`               | Prometheus metrics             |

### node-b2b-orders

| Endpoint            | Purpose            |
|---------------------|--------------------|
| `GET /v1/healthz`   | Liveness           |

### py-payments-ledger

| Endpoint            | Purpose            |
|---------------------|--------------------|
| `GET /healthz`      | Liveness           |

### Monitoring Script

```bash
#!/usr/bin/env bash
set -e
echo "Checking spring-saas-core..."
curl -sf http://localhost:8080/actuator/health/readiness | jq .

echo "Checking node-b2b-orders..."
curl -sf http://localhost:3000/v1/healthz | jq .

echo "Checking py-payments-ledger..."
curl -sf http://localhost:8000/healthz | jq .

echo "All services healthy."
```

---

## OIDC / Keycloak Setup

### Production Configuration

1. **Deploy Keycloak** (v24+) with a production database (PostgreSQL recommended).

2. **Create the `fluxe-b2b` realm** using the production template:

   ```bash
   cd fluxe-b2b-suite
   ./scripts/generate-keycloak-realm.sh
   ```

   This generates `realm-prod.json` from `docker/keycloak/realm-prod-template.json` with your environment-specific URLs.

3. **Import the realm** into Keycloak:

   ```bash
   # Via Keycloak Admin CLI
   /opt/keycloak/bin/kc.sh import --file realm-prod.json

   # Or via Admin REST API
   curl -X POST "https://auth.example.com/admin/realms" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d @realm-prod.json
   ```

4. **Configure spring-saas-core** for OIDC:

   ```env
   AUTH_MODE=oidc
   OIDC_ISSUER_URI=https://auth.example.com/realms/fluxe-b2b
   ```

5. **SSL/TLS**: In production, set `sslRequired` to `external` or `all` in Keycloak realm settings.

### Realm Details

| Client         | Type   | Flow                | PKCE |
|----------------|--------|---------------------|------|
| `fluxe-shop`   | Public | Authorization Code  | S256 |
| `fluxe-ops`    | Public | Authorization Code  | S256 |
| `fluxe-admin`  | Public | Authorization Code  | S256 |

### Custom JWT Claims (via `fluxe-claims` scope)

| Claim    | Source           | Description           |
|----------|------------------|-----------------------|
| `tid`    | User attribute `tenantId`    | Tenant ID    |
| `perms`  | User attribute `permissions` | Permission codes |
| `plan`   | User attribute `plan`        | Tenant plan  |
| `region` | User attribute `region`      | Tenant region |
| `roles`  | Realm roles                  | User roles   |

### Roles

| Role       | Description                      |
|------------|----------------------------------|
| `admin`    | Full administrative access       |
| `operator` | Day-to-day operational access    |
| `viewer`   | Read-only access                 |

---

## Production Checklist

- [ ] All `JWT_SECRET` / `JWT_ISSUER` values are identical across services
- [ ] `AUTH_MODE=oidc` in spring-saas-core (not `hs256`)
- [ ] `OIDC_ISSUER_URI` points to Keycloak with valid TLS
- [ ] `OUTBOX_PUBLISH_ENABLED=true` if using event-driven architecture
- [ ] `GATEWAY_PROVIDER=stripe` with valid `STRIPE_API_KEY` in py-payments-ledger
- [ ] All databases use strong passwords (not defaults)
- [ ] RabbitMQ credentials are changed from `guest/guest`
- [ ] `fluxe_shared` Docker network is created
- [ ] Database migrations have been applied for all services
- [ ] Health check endpoints respond 200 for all services
- [ ] Prometheus/Grafana are configured for monitoring
- [ ] Sentry DSN configured for all services (see [OBSERVABILITY.md](docs/OBSERVABILITY.md))
- [ ] CORS origins restricted to known frontend domains (not `*`)
- [ ] Keycloak realm has `sslRequired: "external"` or `"all"`
- [ ] Default user passwords are changed or users are removed
- [ ] Backup strategy is in place for all PostgreSQL databases

---

## Observability

### Prometheus Targets

| Service             | Metrics Endpoint                | Default Scrape Port |
|---------------------|---------------------------------|---------------------|
| spring-saas-core    | `/actuator/prometheus`          | 9090                |
| node-b2b-orders     | Prometheus middleware            | 9091                |
| py-payments-ledger  | Prometheus middleware            | 9092                |

### Grafana

Default login: `admin / admin` (change immediately in production).

Pre-provisioned dashboards are available in each project's `observability/grafana/dashboards/` directory.

### Key Metrics (spring-saas-core)

- `saas_tenants_created_total` — tenant creation rate
- `saas_policies_updated_total` — policy change frequency
- `saas_flags_toggled_total` — feature flag toggles
- `saas_access_denied_total` — ABAC denials (security monitoring)

---

## CORS Configuration

In production, restrict CORS to known frontend origins. Never use `*` in production.

### spring-saas-core

Set `CORS_ALLOWED_ORIGINS` to the comma-separated list of allowed origins:

```env
CORS_ALLOWED_ORIGINS=https://shop.example.com,https://ops.example.com,https://admin.example.com
```

Exposed headers: `X-Correlation-Id`, `X-Request-Id`.

### node-b2b-orders

```env
CORS_ORIGINS=https://ops.example.com,https://shop.example.com
```

### py-payments-ledger

```env
CORS_ORIGINS=https://ops.example.com,https://shop.example.com
```

> **Note:** All backend CORS configurations must include the `Authorization` header in `Access-Control-Allow-Headers` and support the `OPTIONS` preflight method.

---

## Error Tracking (Sentry)

Add `SENTRY_DSN` to each service's environment variables (see tables above). For full setup instructions, integration details, and recommended Sentry project structure, see [`docs/OBSERVABILITY.md`](docs/OBSERVABILITY.md).

**Quick checklist:**

- [ ] Create Sentry projects: `fluxe-core`, `fluxe-orders`, `fluxe-payments`, `fluxe-shop`, `fluxe-ops`, `fluxe-admin`
- [ ] Set `SENTRY_DSN` in each service
- [ ] Configure `tracesSampleRate` (recommended: 0.2 in production)
- [ ] Upload Angular source maps for readable stack traces
- [ ] Verify error capture with a test error after deploy

---

## Backup Strategy

For complete backup procedures, scripts, and restore instructions, see [`docs/OBSERVABILITY.md`](docs/OBSERVABILITY.md#backup-strategy).

**Summary:**

| Resource     | Method                          | Schedule | Retention     |
|--------------|---------------------------------|----------|---------------|
| PostgreSQL   | `pg_dump` + WAL archiving       | Daily    | 30d + monthly |
| RabbitMQ     | Definitions export via API      | Daily    | 30 days       |
| Redis        | AOF + RDB snapshots             | Continuous + 15min | Daily copy |
| Frontend     | S3 versioning                   | On deploy | 90 days     |

---

## Troubleshooting

| Symptom                          | Probable Cause                               | Fix                                                      |
|----------------------------------|----------------------------------------------|-----------------------------------------------------------|
| `401 Unauthorized`               | Invalid or expired JWT                       | Check `JWT_SECRET` consistency; verify Keycloak token     |
| `403 Forbidden`                  | Missing permissions or ABAC policy deny      | Check user `perms`/`plan` claims and ABAC policies        |
| `403 tenant mismatch`            | `X-Tenant-Id` header != JWT `tid` claim      | Ensure header and token tenant match                      |
| Service won't start              | Missing required env vars                    | Check env vars table above; review `docker compose logs`  |
| RabbitMQ connection refused       | Shared network not created                   | Run `docker network create fluxe_shared`                  |
| Migration failures               | Database not reachable                       | Verify `DATABASE_URL` / `DB_URL` and network connectivity |
| Keycloak token not accepted       | Issuer mismatch                              | `OIDC_ISSUER_URI` must match token `iss` claim exactly    |
