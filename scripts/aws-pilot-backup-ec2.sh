#!/usr/bin/env bash
# Backup PostgreSQL na EC2 piloto (cron semanal recomendado).
#
# Uso local:
#   source .aws-deploy/last-ec2.env && ./scripts/aws-pilot-backup-ec2.sh
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

SSH=(ssh -i "$FLUXE_KEY" -o StrictHostKeyChecking=accept-new "${FLUXE_USER}@${FLUXE_HOST}")

echo "▸ Backup Postgres na EC2 $FLUXE_HOST..."
"${SSH[@]}" bash <<'REMOTE'
set -euo pipefail
BACKUP_DIR=/opt/fluxe/backups/daily
mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
FILE="$BACKUP_DIR/fluxe-pilot-$STAMP.sql.gz"

sudo docker exec fluxe-b2b-suite-postgres-1 pg_dumpall -U fluxe | gzip > "$FILE"
chmod 600 "$FILE"
ls -lh "$FILE"
# Retém últimos 7 dias
find "$BACKUP_DIR" -name 'fluxe-pilot-*.sql.gz' -mtime +7 -delete 2>/dev/null || true
echo "✔ Backup: $FILE"
REMOTE
