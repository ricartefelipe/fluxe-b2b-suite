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
fi

if [[ -z "$FLUXE_HOST" ]]; then
  echo "Defina FLUXE_HOST (IP público da EC2)." >&2
  exit 1
fi

SSH=(ssh -i "$FLUXE_KEY" -o StrictHostKeyChecking=accept-new "${FLUXE_USER}@${FLUXE_HOST}")

echo "▸ Aguardando SSH em $FLUXE_HOST..."
for _ in $(seq 1 30); do
  if "${SSH[@]}" "test -f /opt/fluxe/bootstrap.ok" 2>/dev/null; then
    break
  fi
  sleep 10
done

"${SSH[@]}" "docker --version"

# Gerar .env piloto se não existir localmente
ENV_FILE="${ENV_FILE:-$SUITE_ROOT/.env.aws-pilot}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "▸ Gerando $ENV_FILE (piloto — revisar antes de vender)"
  JWT_SECRET="$(openssl rand -base64 32)"
  DB_PASSWORD="$(openssl rand -base64 24)"
  REDIS_PASSWORD="$(openssl rand -base64 24)"
  RABBITMQ_PASSWORD="$(openssl rand -base64 24)"
  KEYCLOAK_ADMIN_PASSWORD="$(openssl rand -base64 16)"
  GRAFANA_PASSWORD="$(openssl rand -base64 16)"
  ENCRYPTION_KEY="$(openssl rand -base64 32)"

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

OIDC_ISSUER_URI=http://${FLUXE_HOST}/auth/realms/fluxe
OIDC_JWK_SET_URI=http://${FLUXE_HOST}/auth/realms/fluxe/protocol/openid-connect/certs
OIDC_CLIENT_ID=fluxe-app
OIDC_AUDIENCE=
JWT_ISSUER=spring-saas-core
JWT_SECRET=${JWT_SECRET}

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

echo "▸ Sincronizando repositório na EC2..."
"${SSH[@]}" "sudo mkdir -p /opt/fluxe && sudo chown ${FLUXE_USER}:${FLUXE_USER} /opt/fluxe"

# Rsync local (inclui commits ainda não no remoto) ou clone git
if [[ "${DEPLOY_FROM_LOCAL:-1}" == "1" ]]; then
  rsync -az --delete \
    -e "ssh -i $FLUXE_KEY -o StrictHostKeyChecking=accept-new" \
    --exclude '.git' --exclude 'node_modules' --exclude '.aws-deploy' \
    --exclude 'saas-suite-ui/node_modules' \
    "$SUITE_ROOT/" "${FLUXE_USER}@${FLUXE_HOST}:${DEPLOY_DIR}/"
else
  "${SSH[@]}" "test -d ${DEPLOY_DIR}/.git || git clone ${REPO_URL} ${DEPLOY_DIR}"
  "${SSH[@]}" "cd ${DEPLOY_DIR} && git pull origin master"
fi

scp -i "$FLUXE_KEY" -o StrictHostKeyChecking=accept-new \
  "$ENV_FILE" "${FLUXE_USER}@${FLUXE_HOST}:${DEPLOY_DIR}/.env"

echo "▸ Pull imagens GHCR + compose up..."
"${SSH[@]}" bash <<REMOTE
set -euo pipefail
cd ${DEPLOY_DIR}
sudo usermod -aG docker ${FLUXE_USER} 2>/dev/null || true
docker compose -f docker-compose.prod.yml pull || true
docker compose -f docker-compose.prod.yml up -d
sleep 15
docker compose -f docker-compose.prod.yml ps
curl -sf http://127.0.0.1/health && echo " nginx OK" || echo " nginx ainda subindo..."
REMOTE

echo ""
echo "✔ Deploy iniciado em http://${FLUXE_HOST}/health"
echo "  APIs: http://${FLUXE_HOST}/api/core/actuator/health"
echo "        http://${FLUXE_HOST}/api/orders/v1/healthz"
echo "        http://${FLUXE_HOST}/api/payments/healthz"
echo "  .env piloto: $ENV_FILE"
