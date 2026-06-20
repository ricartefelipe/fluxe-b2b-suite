#!/usr/bin/env bash
# Status operacional do piloto AWS (containers, disco, backup, certificado).
#
# Uso:
#   source .aws-deploy/last-ec2.env && ./scripts/aws-pilot-status.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

FLUXE_HOST="${FLUXE_HOST:-}"
FLUXE_KEY="${FLUXE_KEY:-$HOME/.ssh/fluxe-b2b-deploy.pem}"
FLUXE_USER="${FLUXE_USER:-ec2-user}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/fluxe/fluxe-b2b-suite}"

if [[ -z "$FLUXE_HOST" && -f "$SUITE_ROOT/.aws-deploy/last-ec2.env" ]]; then
  # shellcheck disable=SC1091
  source "$SUITE_ROOT/.aws-deploy/last-ec2.env"
  FLUXE_HOST="${PUBLIC_IP:-}"
  FLUXE_KEY="${KEY_FILE:-$FLUXE_KEY}"
fi

[[ -n "$FLUXE_HOST" ]] || { echo "FLUXE_HOST obrigatório" >&2; exit 1; }

PILOT_BASE="${PILOT_BASE_URL:-}"
if [[ -z "$PILOT_BASE" && -n "${PILOT_DOMAIN:-}" ]]; then
  PILOT_BASE="https://${PILOT_DOMAIN}"
elif [[ -z "$PILOT_BASE" ]]; then
  PILOT_BASE="http://${FLUXE_HOST}"
fi
PILOT_BASE="${PILOT_BASE%/}"

SSH=(ssh -i "$FLUXE_KEY" -o StrictHostKeyChecking=accept-new "${FLUXE_USER}@${FLUXE_HOST}")

echo "=== Piloto AWS: $FLUXE_HOST ==="
echo "URL: $PILOT_BASE"
echo ""

echo "▸ Health público..."
for path in /health /api/core/actuator/health/liveness /api/orders/v1/healthz /api/payments/healthz; do
  code=$(curl -so /dev/null -w '%{http_code}' --max-time 10 "${PILOT_BASE}${path}" || echo "000")
  printf "  %-42s %s\n" "$path" "$code"
done
echo ""

echo "▸ Host (SSH)..."
"${SSH[@]}" bash <<'REMOTE'
set -euo pipefail
echo "  uptime: $(uptime -p 2>/dev/null || uptime)"
echo "  mem:    $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "  disk:   $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 " usado)"}')"
echo "  swap:   $(swapon --show 2>/dev/null | tail -n +2 | awk '{print $1 " " $3}' || echo 'nenhum')"
echo ""
echo "▸ Containers..."
cd /opt/fluxe/fluxe-b2b-suite 2>/dev/null || exit 0
COMPOSE=$(command -v docker-compose || echo docker-compose)
sudo $COMPOSE -f docker-compose.prod.yml -f docker-compose.prod.pilot.yml \
  -f docker-compose.prod.build.yml -f docker-compose.prod.tls.yml ps 2>/dev/null || \
  sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | head -20
echo ""
echo "▸ Último backup Postgres..."
ls -lht /opt/fluxe/backups/daily/fluxe-pilot-*.sql.gz 2>/dev/null | head -3 || echo "  (nenhum)"
echo ""
echo "▸ Cron piloto..."
crontab -l 2>/dev/null | grep -E 'fluxe|pilot' || echo "  (cron não instalado — ./scripts/aws-pilot-install-cron.sh)"
echo ""
echo "▸ Log smoke (últimas linhas)..."
tail -5 /opt/fluxe/logs/pilot-smoke.log 2>/dev/null || echo "  (sem log ainda)"
echo ""
CERT="/opt/fluxe/fluxe-b2b-suite/deploy/nginx/certs/live"
if [[ -d "$CERT" ]]; then
  echo "▸ Certificado TLS..."
  sudo find "$CERT" -name cert.pem 2>/dev/null | head -1 | while read -r c; do
    sudo openssl x509 -in "$c" -noout -enddate 2>/dev/null || true
  done
fi
REMOTE
