#!/usr/bin/env bash
# Emite certificado Let's Encrypt na EC2 piloto e ativa HTTPS no nginx.
#
# Pré-requisito: registro A do FLUXE_DOMAIN apontando para FLUXE_HOST (DNS only na Cloudflare).
#
# Uso:
#   source .aws-deploy/last-ec2.env
#   FLUXE_DOMAIN=app.fluxe.com.br ./scripts/aws-setup-tls-ec2.sh
#   # ou com e-mail Let's Encrypt:
#   CERTBOT_EMAIL=felipericartem@gmail.com FLUXE_DOMAIN=app.fluxe.com.br ./scripts/aws-setup-tls-ec2.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

FLUXE_DOMAIN="${FLUXE_DOMAIN:-app.fluxe.com.br}"
FLUXE_HOST="${FLUXE_HOST:-}"
FLUXE_KEY="${FLUXE_KEY:-$HOME/.ssh/fluxe-b2b-deploy.pem}"
FLUXE_USER="${FLUXE_USER:-ec2-user}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/fluxe/fluxe-b2b-suite}"
ENV_FILE="${ENV_FILE:-$SUITE_ROOT/.env.aws-pilot}"

if [[ -z "$FLUXE_HOST" && -f "$SUITE_ROOT/.aws-deploy/last-ec2.env" ]]; then
  # shellcheck disable=SC1091
  source "$SUITE_ROOT/.aws-deploy/last-ec2.env"
  FLUXE_HOST="${PUBLIC_IP:-}"
  FLUXE_KEY="${KEY_FILE:-$FLUXE_KEY}"
fi

if [[ -z "$FLUXE_HOST" ]]; then
  echo "Defina FLUXE_HOST ou .aws-deploy/last-ec2.env" >&2
  exit 1
fi

SSH=(ssh -i "$FLUXE_KEY" -o StrictHostKeyChecking=accept-new "${FLUXE_USER}@${FLUXE_HOST}")

echo "▸ Verificando DNS: $FLUXE_DOMAIN → $FLUXE_HOST"
RESOLVED="$(dig +short "$FLUXE_DOMAIN" A 2>/dev/null | head -1 || true)"
if [[ "$RESOLVED" != "$FLUXE_HOST" ]]; then
  echo "DNS não aponta para a EC2 (resolvido: ${RESOLVED:-vazio})." >&2
  echo "Rode primeiro: FLUXE_DOMAIN=$FLUXE_DOMAIN FLUXE_HOST=$FLUXE_HOST ./scripts/aws-setup-dns-cloudflare.sh" >&2
  exit 1
fi
echo "✔ DNS OK"

echo "▸ Sincronizando configs TLS..."
RSYNC_SSH="ssh -i $FLUXE_KEY -o StrictHostKeyChecking=accept-new"
rsync -az -e "$RSYNC_SSH" \
  "$SUITE_ROOT/deploy/nginx/conf.d/default-pilot.conf" \
  "$SUITE_ROOT/deploy/nginx/conf.d/default-pilot-ssl.conf" \
  "$SUITE_ROOT/docker-compose.prod.tls.yml" \
  "$SUITE_ROOT/scripts/aws-setup-tls-ec2-remote.sh" \
  "${FLUXE_USER}@${FLUXE_HOST}:${DEPLOY_DIR}/"

rsync -az -e "$RSYNC_SSH" \
  "$SUITE_ROOT/deploy/nginx/conf.d/" \
  "${FLUXE_USER}@${FLUXE_HOST}:${DEPLOY_DIR}/deploy/nginx/conf.d/"

rsync -az -e "$RSYNC_SSH" \
  "$SUITE_ROOT/docker-compose.prod.tls.yml" \
  "${FLUXE_USER}@${FLUXE_HOST}:${DEPLOY_DIR}/"

# Atualizar .env local com HTTPS
BASE="https://${FLUXE_DOMAIN}"
if [[ -f "$ENV_FILE" ]]; then
  sed -i "s|^DOMAIN=.*|DOMAIN=${FLUXE_DOMAIN}|" "$ENV_FILE"
  sed -i "s|^KEYCLOAK_HOSTNAME=.*|KEYCLOAK_HOSTNAME=${FLUXE_DOMAIN}|" "$ENV_FILE"
  sed -i "s|^CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=${BASE}|" "$ENV_FILE"
  sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=${BASE}/admin/|" "$ENV_FILE"
  sed -i "s|^EMAIL_FROM=.*|EMAIL_FROM=noreply@${FLUXE_DOMAIN#*.}|" "$ENV_FILE"
  grep -q '^AUTH_MODE=' "$ENV_FILE" || echo 'AUTH_MODE=hs256' >> "$ENV_FILE"
fi

scp -i "$FLUXE_KEY" -o StrictHostKeyChecking=accept-new \
  "$ENV_FILE" "${FLUXE_USER}@${FLUXE_HOST}:${DEPLOY_DIR}/.env"

echo "▸ Certbot + nginx HTTPS na EC2..."
"${SSH[@]}" bash <<REMOTE
set -euo pipefail
cd ${DEPLOY_DIR}
export FLUXE_DOMAIN='${FLUXE_DOMAIN}'
export CERTBOT_EMAIL='${CERTBOT_EMAIL}'
bash scripts/aws-setup-tls-ec2-remote.sh
REMOTE

echo ""
echo "✔ HTTPS ativo"
echo "  Shop:   https://${FLUXE_DOMAIN}/"
echo "  Ops:    https://${FLUXE_DOMAIN}/ops/"
echo "  Admin:  https://${FLUXE_DOMAIN}/admin/"
echo "  Login:  admin@local / admin123"
