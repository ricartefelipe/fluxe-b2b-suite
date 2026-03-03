# Observability — Fluxe B2B Platform

Complete observability setup for the Fluxe B2B platform: error tracking, structured logging, correlation, and backup strategy across all services.

---

## Error Tracking (Sentry)

### spring-saas-core (Java / Spring Boot)

**Add dependency** to `pom.xml`:

```xml
<dependency>
  <groupId>io.sentry</groupId>
  <artifactId>sentry-spring-boot-starter-jakarta</artifactId>
  <version>7.x</version>
</dependency>
```

**Configure** in `application-prod.yml`:

```yaml
sentry:
  dsn: ${SENTRY_DSN}
  environment: ${SPRING_PROFILES_ACTIVE:prod}
  traces-sample-rate: 0.2
  send-default-pii: false
  in-app-includes:
    - com.union.solutions.saascore
```

**Environment variables:**

| Variable                    | Required | Description                        |
|-----------------------------|----------|------------------------------------|
| `SENTRY_DSN`               | Yes      | Sentry DSN for spring-saas-core    |
| `sentry.traces-sample-rate` | No       | 0.0–1.0 (default: 0.2)            |
| `sentry.environment`        | No       | Defaults to Spring active profile  |

Sentry Spring Boot starter auto-captures:
- Unhandled exceptions in controllers
- Spring MVC transaction spans
- JDBC and RestTemplate spans (with tracing enabled)

### node-b2b-orders (Node.js / NestJS)

**Install:**

```bash
npm install @sentry/node @sentry/profiling-node
```

**Initialize** at the top of `src/main.ts` (before any imports):

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.2,
  profilesSampleRate: 0.1,
  integrations: [
    Sentry.prismaIntegration(),
  ],
});
```

**Environment variables:**

| Variable     | Required | Description                        |
|--------------|----------|------------------------------------|
| `SENTRY_DSN` | Yes      | Sentry DSN for node-b2b-orders     |

### py-payments-ledger (Python / FastAPI)

**Install:**

```bash
pip install sentry-sdk[fastapi]
```

**Initialize** in `src/api/main.py`:

```python
import sentry_sdk

sentry_sdk.init(
    dsn=os.environ.get("SENTRY_DSN"),
    environment=os.environ.get("ENVIRONMENT", "production"),
    traces_sample_rate=0.2,
    profiles_sample_rate=0.1,
    send_default_pii=False,
)
```

FastAPI integration is auto-detected. Captures:
- Unhandled exceptions in routes
- ASGI transaction spans
- SQLAlchemy query spans

**Environment variables:**

| Variable     | Required | Description                          |
|--------------|----------|--------------------------------------|
| `SENTRY_DSN` | Yes      | Sentry DSN for py-payments-ledger    |

### fluxe-b2b-suite (Angular)

**Install:**

```bash
npm install @sentry/angular
```

**Initialize** in each app's `main.ts`:

```typescript
import * as Sentry from '@sentry/angular';

Sentry.init({
  dsn: environment.sentryDsn,
  environment: environment.production ? 'production' : 'development',
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.2,
});
```

**Provide** in `app.config.ts`:

```typescript
import * as Sentry from '@sentry/angular';
import { APP_INITIALIZER, ErrorHandler } from '@angular/core';
import { Router } from '@angular/router';

providers: [
  { provide: ErrorHandler, useValue: Sentry.createErrorHandler({ showDialog: false }) },
  { provide: Sentry.TraceService, deps: [Router] },
  { provide: APP_INITIALIZER, useFactory: () => () => {}, deps: [Sentry.TraceService], multi: true },
]
```

### Sentry Project Structure

Recommended Sentry organization:

| Sentry Project          | Service            | Platform   |
|-------------------------|--------------------|------------|
| `fluxe-core`            | spring-saas-core   | Java       |
| `fluxe-orders`          | node-b2b-orders    | Node.js    |
| `fluxe-payments`        | py-payments-ledger | Python     |
| `fluxe-shop`            | shop app           | Angular    |
| `fluxe-ops`             | ops-portal app     | Angular    |
| `fluxe-admin`           | admin-console app  | Angular    |

Use Sentry **release tracking** and **source maps** for Angular apps to get readable stack traces.

---

## Logging Strategy

### Structured JSON Logs

All backend services MUST emit structured JSON logs in production. This ensures compatibility with log aggregation systems (ELK, Loki, CloudWatch Logs).

**spring-saas-core** — Logback with JSON encoder:

```xml
<!-- logback-spring.xml -->
<configuration>
  <springProfile name="prod">
    <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
      <encoder class="net.logstash.logback.encoder.LogstashEncoder">
        <includeMdcKeyName>correlationId</includeMdcKeyName>
        <includeMdcKeyName>tenantId</includeMdcKeyName>
      </encoder>
    </appender>
    <root level="INFO">
      <appender-ref ref="JSON" />
    </root>
  </springProfile>
</configuration>
```

**node-b2b-orders** — Pino (built-in NestJS support):

```typescript
import { Logger } from 'nestjs-pino';

const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger));
```

**py-payments-ledger** — structlog:

```python
import structlog

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
)
```

### Log Levels

| Level   | Usage                                                              |
|---------|--------------------------------------------------------------------|
| `ERROR` | Failures requiring attention: unhandled exceptions, integration failures |
| `WARN`  | Degraded state: retries, fallbacks, near-threshold values          |
| `INFO`  | Business events: order created, payment processed, tenant onboarded |
| `DEBUG` | Development only: request/response bodies, query details           |

> In production, set root log level to `INFO`. Never log at `DEBUG` level in production without explicit enablement (e.g., per-tenant debug flag).

### Correlation ID Propagation

All services propagate a correlation ID via the `X-Correlation-Id` HTTP header. This links logs across the request chain.

```
Client → spring-saas-core → node-b2b-orders → py-payments-ledger
              │                    │                    │
         X-Correlation-Id    X-Correlation-Id    X-Correlation-Id
              │                    │                    │
          MDC context         AsyncLocalStorage     contextvars
```

**Flow:**
1. The first service to receive a request generates a UUID if `X-Correlation-Id` is absent.
2. The ID is stored in the thread/async context (MDC for Java, AsyncLocalStorage for Node, contextvars for Python).
3. All outgoing HTTP calls include the header.
4. All log entries include the correlation ID field.

**spring-saas-core** — MDC filter:

```java
String corrId = request.getHeader("X-Correlation-Id");
if (corrId == null) corrId = UUID.randomUUID().toString();
MDC.put("correlationId", corrId);
response.setHeader("X-Correlation-Id", corrId);
```

**node-b2b-orders** — NestJS interceptor:

```typescript
const corrId = request.headers['x-correlation-id'] ?? randomUUID();
store.set('correlationId', corrId);
response.setHeader('X-Correlation-Id', corrId);
```

**py-payments-ledger** — ASGI middleware:

```python
corr_id = request.headers.get("x-correlation-id") or str(uuid4())
correlation_id_ctx.set(corr_id)
response.headers["x-correlation-id"] = corr_id
```

### Centralized Log Aggregation

Recommended stacks (pick one based on your infrastructure):

| Stack              | Components                    | Best For                    |
|--------------------|-------------------------------|-----------------------------|
| **ELK**            | Elasticsearch + Logstash + Kibana | Self-hosted, full-text search |
| **Loki + Grafana** | Grafana Loki + Grafana        | Kubernetes, cost-effective  |
| **CloudWatch**     | AWS CloudWatch Logs + Insights | AWS-native deployments      |

All stacks consume the JSON-structured logs output. Use Docker log drivers or sidecar collectors (Fluentd, Filebeat, Promtail) to forward logs.

---

## Backup Strategy

### PostgreSQL Databases

Each service has its own PostgreSQL database. All databases follow the same backup strategy:

| Item                | Policy                                         |
|---------------------|-------------------------------------------------|
| **Method**          | `pg_dump` (logical) for portability             |
| **Schedule**        | Daily at 02:00 UTC                              |
| **Retention**       | 30 days (daily) + 12 months (monthly snapshots) |
| **Storage**         | S3 bucket with versioning enabled               |
| **Encryption**      | AES-256 (S3 SSE) + in-transit TLS              |
| **Point-in-time**   | WAL archiving for PITR (RPO < 1 hour)          |

**Backup script example:**

```bash
#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATABASES=("saascore" "orders" "payments")

for DB in "${DATABASES[@]}"; do
  DUMP_FILE="/backups/${DB}_${TIMESTAMP}.sql.gz"
  pg_dump "$DB" | gzip > "$DUMP_FILE"
  aws s3 cp "$DUMP_FILE" "s3://fluxe-backups/postgres/${DB}/" \
    --storage-class STANDARD_IA
done

# Cleanup local dumps older than 7 days
find /backups -name "*.sql.gz" -mtime +7 -delete
```

### RabbitMQ

| Item                | Policy                                  |
|---------------------|-----------------------------------------|
| **Queue durability** | All queues declared as `durable: true` |
| **Message persistence** | `deliveryMode: 2` (persistent)     |
| **Disk alarm**      | Default threshold (free disk < 50MB triggers alarm) |
| **Definitions export** | Daily export via Management API     |

```bash
# Export RabbitMQ definitions (queues, exchanges, bindings)
curl -u "$RABBITMQ_USER:$RABBITMQ_PASS" \
  "http://localhost:15672/api/definitions" \
  -o "/backups/rabbitmq_definitions_$(date +%Y%m%d).json"
```

### Redis

| Item                | Policy                                          |
|---------------------|-------------------------------------------------|
| **Persistence**     | AOF (`appendonly yes`) + periodic RDB snapshots  |
| **AOF fsync**       | `everysec` (1-second data loss max)              |
| **RDB schedule**    | Every 15 min if ≥1 key changed                   |
| **Backup**          | Copy `dump.rdb` and `appendonly.aof` to S3 daily |

Redis configuration additions for production:

```
appendonly yes
appendfsync everysec
save 900 1
save 300 10
save 60 10000
```

### Frontend Assets (S3/CDN)

| Item                | Policy                                   |
|---------------------|------------------------------------------|
| **S3 versioning**   | Enabled on all frontend asset buckets    |
| **Lifecycle rules** | Delete non-current versions after 90 days |
| **Replication**     | Cross-region replication for DR          |
| **CloudFront**      | Invalidate on deploy; TTL via cache headers |

### Restore Procedures

**PostgreSQL restore:**

```bash
gunzip -c /backups/saascore_20260303_020000.sql.gz | psql saascore
```

**RabbitMQ restore:**

```bash
curl -u "$RABBITMQ_USER:$RABBITMQ_PASS" -X POST \
  "http://localhost:15672/api/definitions" \
  -H "Content-Type: application/json" \
  -d @rabbitmq_definitions_20260303.json
```

**Redis restore:** Stop Redis, replace `dump.rdb`, restart.

---

## Monitoring Integration Summary

| Service            | Error Tracking | Metrics        | Logs           | Backup         |
|--------------------|----------------|----------------|----------------|----------------|
| spring-saas-core   | Sentry (Java)  | Prometheus     | Logback JSON   | pg_dump daily  |
| node-b2b-orders    | Sentry (Node)  | Prometheus     | Pino JSON      | pg_dump daily  |
| py-payments-ledger | Sentry (Python) | Prometheus    | structlog JSON | pg_dump daily  |
| fluxe-shop         | Sentry (Angular)| —             | Console → Sentry | S3 versioning |
| fluxe-ops          | Sentry (Angular)| —             | Console → Sentry | S3 versioning |
| fluxe-admin        | Sentry (Angular)| —             | Console → Sentry | S3 versioning |
| RabbitMQ           | —              | Built-in       | —              | Definitions export |
| Redis              | —              | redis_exporter | —              | AOF + RDB      |
| PostgreSQL         | —              | pg_exporter    | —              | pg_dump + WAL  |
