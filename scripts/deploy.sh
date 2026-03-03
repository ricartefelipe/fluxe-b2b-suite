#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"
ENV_FILE="$PROJECT_DIR/.env"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[deploy]${NC} $*"; }
warn()  { echo -e "${YELLOW}[deploy]${NC} $*"; }
error() { echo -e "${RED}[deploy]${NC} $*" >&2; }

# ---------- 1. Validate .env ----------
log "Validating environment..."

if [[ ! -f "$ENV_FILE" ]]; then
  error ".env file not found at $ENV_FILE"
  error "Copy .env.example to .env and fill in all required values."
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

REQUIRED_VARS=(
  DB_PASSWORD
  REDIS_PASSWORD
  RABBITMQ_PASSWORD
  KEYCLOAK_ADMIN_PASSWORD
  KEYCLOAK_HOSTNAME
  OIDC_ISSUER_URI
  JWT_SECRET
  CORS_ALLOWED_ORIGINS
  GRAFANA_PASSWORD
  GHCR_ORG
  DOMAIN
)

MISSING=()
for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    MISSING+=("$var")
  fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
  error "Missing required environment variables:"
  for var in "${MISSING[@]}"; do
    error "  - $var"
  done
  exit 1
fi

log "Environment OK."

# ---------- 2. Pull latest images ----------
log "Pulling latest images from GHCR..."

IMAGES=(
  "ghcr.io/${GHCR_ORG}/spring-saas-core:${SAAS_CORE_TAG:-latest}"
  "ghcr.io/${GHCR_ORG}/node-b2b-orders:${ORDERS_TAG:-latest}"
  "ghcr.io/${GHCR_ORG}/py-payments-ledger:${PAYMENTS_TAG:-latest}"
)

for img in "${IMAGES[@]}"; do
  log "  Pulling $img"
  docker pull "$img"
done

log "Images pulled."

# ---------- 3. Start infrastructure first ----------
log "Starting infrastructure services..."

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d \
  postgres redis rabbitmq

log "Waiting for infrastructure health checks..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
  exec -T postgres sh -c 'until pg_isready -U ${POSTGRES_USER:-fluxe}; do sleep 2; done'

log "Infrastructure ready."

# ---------- 4. Run database migrations ----------
log "Running database migrations..."

# spring-saas-core: Liquibase runs on startup, no separate step needed.
log "  saas-core: migrations run on application startup (Liquibase)."

# node-b2b-orders: Prisma
log "  orders: running Prisma migrate deploy..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
  run --rm --no-deps orders-api npx prisma migrate deploy 2>&1 || {
    warn "  orders migration failed or no pending migrations."
  }

# py-payments-ledger: Alembic
log "  payments: running Alembic upgrade head..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
  run --rm --no-deps payments-api alembic upgrade head 2>&1 || {
    warn "  payments migration failed or no pending migrations."
  }

log "Migrations complete."

# ---------- 5. Start/restart all services ----------
log "Starting all services..."

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

log "Services starting..."

# ---------- 6. Wait for health checks ----------
log "Waiting for services to become healthy..."

HEALTH_ENDPOINTS=(
  "saas-core|http://localhost:8080/actuator/health/liveness|90"
  "orders-api|http://localhost:3000/v1/healthz|30"
  "payments-api|http://localhost:8000/healthz|30"
)

ALL_HEALTHY=true

for entry in "${HEALTH_ENDPOINTS[@]}"; do
  IFS='|' read -r name url timeout <<< "$entry"
  log "  Waiting for $name ($timeout s timeout)..."

  HEALTHY=false
  for i in $(seq 1 "$timeout"); do
    if curl -sf "$url" > /dev/null 2>&1; then
      HEALTHY=true
      break
    fi
    sleep 1
  done

  if $HEALTHY; then
    log "  $name: ${GREEN}healthy${NC}"
  else
    error "  $name: UNHEALTHY after ${timeout}s"
    ALL_HEALTHY=false
  fi
done

# ---------- 7. Report status ----------
echo ""
log "========================================="
if $ALL_HEALTHY; then
  log "  DEPLOY SUCCESSFUL"
else
  error "  DEPLOY COMPLETED WITH WARNINGS"
  error "  Some services failed health checks."
fi
log "========================================="
echo ""

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

if ! $ALL_HEALTHY; then
  exit 1
fi
