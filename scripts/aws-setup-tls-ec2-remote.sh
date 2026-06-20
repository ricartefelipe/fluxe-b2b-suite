#!/usr/bin/env bash
# Executado na EC2 por aws-setup-tls-ec2.sh (não rodar só localmente).
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/opt/fluxe/fluxe-b2b-suite}"
cd "$DEPLOY_DIR"

FLUXE_DOMAIN="${FLUXE_DOMAIN:?FLUXE_DOMAIN obrigatório}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

COMPOSE="sudo docker-compose"
CF="-f docker-compose.prod.yml -f docker-compose.prod.pilot.yml -f docker-compose.prod.build.yml -f docker-compose.prod.tls.yml"

# HTTP bootstrap (acme + rotas) até existir certificado
cp -f deploy/nginx/conf.d/default-pilot.conf deploy/nginx/conf.d/default-pilot-active.conf

$COMPOSE $CF up -d nginx
sleep 3

EMAIL_ARG=""
if [[ -n "$CERTBOT_EMAIL" ]]; then
  EMAIL_ARG="--email $CERTBOT_EMAIL"
else
  EMAIL_ARG="--register-unsafely-without-email"
fi

if [[ ! -d "/var/lib/docker/volumes" ]]; then
  true
fi

$COMPOSE $CF run --rm --entrypoint certbot certbot certonly --webroot -w /var/www/certbot \
  $EMAIL_ARG --agree-tos --no-eff-email \
  -d "$FLUXE_DOMAIN"

# nginx worker (uid nginx) precisa ler a chave privada
$COMPOSE $CF run --rm --entrypoint sh certbot -c "chmod 644 /etc/letsencrypt/archive/${FLUXE_DOMAIN}/privkey1.pem"

sed "s/__FLUXE_DOMAIN__/${FLUXE_DOMAIN}/g" \
  deploy/nginx/conf.d/default-pilot-ssl.conf > deploy/nginx/conf.d/default-pilot-active.conf

$COMPOSE $CF up -d nginx certbot-renew
sleep 3

curl -sf "https://${FLUXE_DOMAIN}/health" && echo " TLS OK"

# Recriar backends com CORS/FRONTEND_URL HTTPS do .env
$COMPOSE $CF up -d saas-core orders-api shop-frontend ops-portal admin-console
