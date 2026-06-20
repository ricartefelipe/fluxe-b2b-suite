#!/usr/bin/env bash
# Instala cron na EC2: backup diário + smoke diário (log local).
#
# Uso:
#   source .aws-deploy/last-ec2.env && ./scripts/aws-pilot-install-cron.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

FLUXE_HOST="${FLUXE_HOST:-}"
FLUXE_KEY="${FLUXE_KEY:-$HOME/.ssh/fluxe-b2b-deploy.pem}"
FLUXE_USER="${FLUXE_USER:-ec2-user}"
PILOT_DOMAIN="${PILOT_DOMAIN:-}"

if [[ -z "$FLUXE_HOST" && -f "$SUITE_ROOT/.aws-deploy/last-ec2.env" ]]; then
  # shellcheck disable=SC1091
  source "$SUITE_ROOT/.aws-deploy/last-ec2.env"
  FLUXE_HOST="${PUBLIC_IP:-}"
  FLUXE_KEY="${KEY_FILE:-$FLUXE_KEY}"
fi

[[ -n "$FLUXE_HOST" ]] || { echo "FLUXE_HOST obrigatório" >&2; exit 1; }

SSH=(ssh -i "$FLUXE_KEY" -o StrictHostKeyChecking=accept-new "${FLUXE_USER}@${FLUXE_HOST}")

echo "▸ Instalando cron piloto em $FLUXE_HOST..."
"${SSH[@]}" bash -s -- "$PILOT_DOMAIN" <<'REMOTE'
set -euo pipefail
PILOT_DOMAIN="${1:-}"
if ! command -v crontab >/dev/null 2>&1; then
  sudo dnf install -y cronie >/dev/null 2>&1 || sudo yum install -y cronie >/dev/null 2>&1 || true
  sudo systemctl enable --now crond 2>/dev/null || sudo systemctl enable --now cron 2>/dev/null || true
fi
command -v crontab >/dev/null || { echo "crontab indisponível — instale cronie na EC2" >&2; exit 1; }
mkdir -p /opt/fluxe/logs /opt/fluxe/backups/daily /opt/fluxe/bin
DEPLOY=/opt/fluxe/fluxe-b2b-suite
MARKER="# fluxe-pilot-cron"

if [[ -n "$PILOT_DOMAIN" ]]; then
  echo "$PILOT_DOMAIN" > "$DEPLOY/.pilot-domain"
  BASE="https://${PILOT_DOMAIN}"
else
  IP=$(curl -sf http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "127.0.0.1")
  BASE="http://${IP}"
fi

cat > /opt/fluxe/bin/pilot-smoke-cron.sh <<SCRIPT
#!/usr/bin/env bash
set -euo pipefail
LOG=/opt/fluxe/logs/pilot-smoke.log
BASE="${BASE}"
{
  echo "[\$(date -Iseconds)] smoke \$BASE"
  curl -sf "\$BASE/health"
  curl -sf "\$BASE/api/core/actuator/health/liveness"
  curl -sf -X POST "\$BASE/api/core/v1/auth/login" \\
    -H 'Content-Type: application/json' \\
    -d '{"email":"admin@local","password":"admin123"}' | grep -q access_token
  echo OK
} >> "\$LOG" 2>&1 || echo "[\$(date -Iseconds)] FAIL" >> "\$LOG" 2>&1
SCRIPT
chmod +x /opt/fluxe/bin/pilot-smoke-cron.sh

( crontab -l 2>/dev/null | grep -v "$MARKER" ) | crontab - 2>/dev/null || true

( crontab -l 2>/dev/null
  echo "15 3 * * * BACKUP_DIR=/opt/fluxe/backups/daily STAMP=\$(date +\\%Y\\%m\\%d-\\%H\\%M\\%S) && mkdir -p \$BACKUP_DIR && sudo docker exec fluxe-b2b-suite-postgres-1 pg_dumpall -U fluxe | gzip > \$BACKUP_DIR/fluxe-pilot-\$STAMP.sql.gz && chmod 600 \$BACKUP_DIR/fluxe-pilot-\$STAMP.sql.gz && find \$BACKUP_DIR -name 'fluxe-pilot-*.sql.gz' -mtime +7 -delete $MARKER"
  echo "0 6 * * * /opt/fluxe/bin/pilot-smoke-cron.sh $MARKER"
) | crontab -

echo "✔ Cron instalado:"
crontab -l | grep "$MARKER"
REMOTE

echo "✔ Cron piloto ativo. Logs: /opt/fluxe/logs/pilot-smoke.log"
