#!/usr/bin/env bash
# Deploy Fluxe B2B na EC2 via SSH (clone + .env + docker compose prod).
#
# Uso:
#   FLUXE_HOST=1.2.3.4 FLUXE_KEY=~/.ssh/fluxe-b2b-deploy.pem ./scripts/aws-deploy-fluxe-ec2.sh
#   # ou após provision:
#   source .aws-deploy/last-ec2.env && ./scripts/aws-deploy-fluxe-ec2.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

FLUXE_HOST="${FLUXE_HOST:-}"
FLUXE_KEY="${FLUXE_KEY:-$HOME/.ssh/fluxe-b2b-deploy.pem}"
FLUXE_USER="${FLUXE_USER:-ec2-user}"
REPO_URL="${REPO_URL:-git@github.com:ricartefelipe/fluxe-b2b-suite.git}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/fluxe/fluxe-b2b-suite}"

if [[ -z "$FLUXE_HOST" && -f "$SUITE_ROOT/.aws-deploy/last-ec2.env" ]]; then
  # shellcheck disable=SC1091
  source "$SUITE_ROOT/.aws-deploy/last-ec2.env"
  FLUXE_HOST="${PUBLIC_IP:-$FLUXE_HOST}"
  FLUXE_KEY="${KEY_FILE:-$FLUXE_KEY}"
fi

if [[ -z "$FLUXE_HOST" ]]; then
  echo "Defina FLUXE_HOST (IP público da EC2)." >&2
  exit 1
fi

SSH=(ssh -i "$FLUXE_KEY" -o StrictHostKeyChecking=accept-new "${FLUXE_USER}@${FLUXE_HOST}")

echo "▸ Aguardando SSH em $FLUXE_HOST..."
for _ in $(seq 1 30); do
  if "${SSH[@]}" "command -v docker >/dev/null 2>&1 || test -f /opt/fluxe/bootstrap.ok" 2>/dev/null; then
    break
  fi
  sleep 10
done

"${SSH[@]}" "docker --version || sudo docker --version"
COMPOSE_CMD="$("${SSH[@]}" "command -v docker-compose >/dev/null 2>&1 && echo docker-compose || echo 'sudo docker compose'")"

# Gerar .env piloto se não existir localmente
ENV_FILE="${ENV_FILE:-$SUITE_ROOT/.env.aws-pilot}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "▸ Gerando $ENV_FILE (piloto — revisar antes de vender)"
  JWT_SECRET="$(openssl rand -hex 32)"
  DB_PASSWORD="$(openssl rand -hex 16)"
  REDIS_PASSWORD="$(openssl rand -hex 16)"
  RABBITMQ_PASSWORD="$(openssl rand -hex 16)"
  KEYCLOAK_ADMIN_PASSWORD="$(openssl rand -hex 12)"
  GRAFANA_PASSWORD="$(openssl rand -hex 12)"
  ENCRYPTION_KEY="$(openssl rand -hex 32)"

  cat > "$ENV_FILE" <<EOF
DOMAIN=${FLUXE_HOST}
DOCKER_PLATFORM=linux/amd64
GHCR_ORG=ricartefelipe
SAAS_CORE_TAG=latest
ORDERS_TAG=latest
PAYMENTS_TAG=latest

DB_USER=fluxe
DB_PASSWORD=${DB_PASSWORD}
REDIS_PASSWORD=${REDIS_PASSWORD}
RABBITMQ_USER=fluxe
RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD}

KEYCLOAK_HOSTNAME=${FLUXE_HOST}
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD}

OIDC_ISSUER_URI=https://${FLUXE_HOST}/auth/realms/fluxe
OIDC_JWK_SET_URI=https://${FLUXE_HOST}/auth/realms/fluxe/protocol/openid-connect/certs
OIDC_CLIENT_ID=fluxe-app
OIDC_AUDIENCE=
JWT_ISSUER=spring-saas-core
JWT_SECRET=${JWT_SECRET}
AUTH_MODE=hs256

CORS_ALLOWED_ORIGINS=http://${FLUXE_HOST}

EMAIL_PROVIDER=log
EMAIL_FROM=noreply@${FLUXE_HOST}
FRONTEND_URL=http://${FLUXE_HOST}

APP_BILLING_PROVIDER=noop
GATEWAY_PROVIDER=fake

GRAFANA_USER=admin
GRAFANA_PASSWORD=${GRAFANA_PASSWORD}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
EOF
  chmod 600 "$ENV_FILE"
fi

echo "▸ Sincronizando repositórios na EC2..."
WKS_ROOT="$(cd "$SUITE_ROOT/.." && pwd)"
"${SSH[@]}" "sudo mkdir -p /opt/fluxe && sudo chown ${FLUXE_USER}:${FLUXE_USER} /opt/fluxe"

RSYNC_SSH="ssh -i $FLUXE_KEY -o StrictHostKeyChecking=accept-new"
for dir in fluxe-b2b-suite spring-saas-core node-b2b-orders py-payments-ledger; do
  src="$WKS_ROOT/$dir/"
  dst="${FLUXE_USER}@${FLUXE_HOST}:/opt/fluxe/$dir/"
  echo "  → $dir"
  rsync -az --delete \
    -e "$RSYNC_SSH" \
    --exclude '.git' --exclude 'node_modules' --exclude 'target' \
    --exclude '.venv' --exclude '__pycache__' --exclude '.local-logs' \
    --exclude 'saas-suite-ui/node_modules' \
    --exclude '.env' --exclude '.env.aws-pilot' \
    --exclude 'deploy/nginx/conf.d/default-pilot-active.conf' \
    "$src" "$dst"
done

DEPLOY_DIR="/opt/fluxe/fluxe-b2b-suite"

if grep -q '^AUTH_MODE=' "$ENV_FILE"; then
  sed -i 's/^AUTH_MODE=.*/AUTH_MODE=hs256/' "$ENV_FILE"
else
  echo 'AUTH_MODE=hs256' >> "$ENV_FILE"
fi

PILOT_DOMAIN="${PILOT_DOMAIN:-}"
if [[ -z "$PILOT_DOMAIN" && -f "$SUITE_ROOT/.aws-deploy/last-ec2.env" ]]; then
  # shellcheck disable=SC1091
  source "$SUITE_ROOT/.aws-deploy/last-ec2.env"
fi
if [[ -n "${PILOT_DOMAIN:-}" ]]; then
  echo "▸ Ajustando .env para HTTPS ($PILOT_DOMAIN)..."
  patch_env() {
    local key="$1" val="$2"
    if grep -q "^${key}=" "$ENV_FILE"; then
      sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
    else
      echo "${key}=${val}" >> "$ENV_FILE"
    fi
  }
  patch_env DOMAIN "$PILOT_DOMAIN"
  patch_env CORS_ALLOWED_ORIGINS "https://${PILOT_DOMAIN}"
  patch_env FRONTEND_URL "https://${PILOT_DOMAIN}/admin"
  patch_env KEYCLOAK_HOSTNAME "$PILOT_DOMAIN"
fi

scp -i "$FLUXE_KEY" -o StrictHostKeyChecking=accept-new \
  "$ENV_FILE" "${FLUXE_USER}@${FLUXE_HOST}:${DEPLOY_DIR}/.env"

if [[ -n "${PILOT_DOMAIN:-}" ]]; then
  "${SSH[@]}" "echo '${PILOT_DOMAIN}' > ${DEPLOY_DIR}/.pilot-domain"
fi

echo "▸ Build + compose up (backends ~20 min; frontends +30 min na t3.small)..."
GHCR_TOKEN="$(gh auth token 2>/dev/null || true)"
BUILD_MODE="${BUILD_MODE:-local}"
"${SSH[@]}" bash <<REMOTE
set -euo pipefail
cd ${DEPLOY_DIR}
sudo usermod -aG docker ${FLUXE_USER} 2>/dev/null || true
if ! swapon --show | grep -q /swapfile; then
  sudo fallocate -l 2G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
fi
COMPOSE="\$(command -v docker-compose || echo docker-compose)"
COMPOSE_FILES="-f docker-compose.prod.yml -f docker-compose.prod.pilot.yml"
if [[ "${BUILD_MODE}" == "local" ]]; then
  COMPOSE_FILES="\$COMPOSE_FILES -f docker-compose.prod.build.yml"
  sudo \$COMPOSE \$COMPOSE_FILES build saas-core orders-api orders-worker payments-api payments-worker 2>&1 | tail -15
  sudo \$COMPOSE \$COMPOSE_FILES build shop-frontend 2>&1 | tail -15
  sudo \$COMPOSE \$COMPOSE_FILES build ops-portal admin-console 2>&1 | tail -15
else
  if [[ -n "${GHCR_TOKEN}" ]]; then
    echo "${GHCR_TOKEN}" | sudo docker login ghcr.io -u ricartefelipe --password-stdin || true
  fi
  sudo \$COMPOSE \$COMPOSE_FILES pull || true
fi
sudo \$COMPOSE \$COMPOSE_FILES up -d
sleep 60
sudo \$COMPOSE \$COMPOSE_FILES restart nginx 2>/dev/null || true
sleep 5
sudo \$COMPOSE \$COMPOSE_FILES ps
curl -sf http://127.0.0.1/health && echo " nginx OK" || echo " nginx ainda subindo..."
REMOTE

echo ""
echo "✔ Deploy iniciado em http://${FLUXE_HOST}/health"
echo "  Shop:   http://${FLUXE_HOST}/"
echo "  Ops:    http://${FLUXE_HOST}/ops/"
echo "  Admin:  http://${FLUXE_HOST}/admin/"
echo "  APIs:   http://${FLUXE_HOST}/api/core/actuator/health"
echo "          http://${FLUXE_HOST}/api/orders/v1/healthz"
echo "          http://${FLUXE_HOST}/api/payments/healthz"
echo "  Login piloto (Core): admin@local — ver seed migration 021"
echo "  .env piloto: $ENV_FILE"
