#!/usr/bin/env bash
# Daily backup of all PostgreSQL databases for Fluxe B2B Suite.
# Keeps 30 daily + 12 monthly backups. Optionally uploads to Backblaze B2 / S3.
#
# Cron example (run daily at 3 AM):
#   0 3 * * * /opt/fluxe/scripts/backup.sh >> /opt/fluxe/logs/backup.log 2>&1
set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BACKUP_DIR="${BACKUP_BASE_DIR:-${SUITE_ROOT}/backups}"
DAILY_DIR="${BACKUP_DIR}/daily"
MONTHLY_DIR="${BACKUP_DIR}/monthly"
DAILY_RETENTION=30
MONTHLY_RETENTION=12

COMPOSE_FILE="${SUITE_ROOT}/docker-compose.prod.yml"
POSTGRES_SERVICE="postgres"

DB_USER="${DB_USER:-fluxe}"
DATABASES=("saascore" "orders" "payments" "keycloak")

DATE_STAMP=$(date +%Y-%m-%d_%H%M%S)
DAY_OF_MONTH=$(date +%d)

# Optional: Backblaze B2 / S3 upload
B2_KEY_ID="${B2_KEY_ID:-}"
B2_APP_KEY="${B2_APP_KEY:-}"
B2_BUCKET="${B2_BUCKET:-}"

# ─── Functions ───────────────────────────────────────────────────────────────
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

ensure_dirs() {
  mkdir -p "${DAILY_DIR}" "${MONTHLY_DIR}"
}

dump_database() {
  local db="$1"
  local output_file="$2"

  docker compose -f "${COMPOSE_FILE}" exec -T "${POSTGRES_SERVICE}" \
    pg_dump -U "${DB_USER}" -Fc --no-owner --no-acl "${db}" \
    | gzip > "${output_file}"
}

upload_to_b2() {
  local file="$1"
  if [ -z "${B2_KEY_ID}" ] || [ -z "${B2_APP_KEY}" ] || [ -z "${B2_BUCKET}" ]; then
    return 0
  fi

  if ! command -v b2 &>/dev/null; then
    log "WARN: b2 CLI não instalado, pulando upload. Instale: pip install b2"
    return 0
  fi

  log "  Enviando $(basename "${file}") para B2..."
  b2 authorize-account "${B2_KEY_ID}" "${B2_APP_KEY}" >/dev/null 2>&1
  b2 upload-file "${B2_BUCKET}" "${file}" "backups/$(basename "${file}")" >/dev/null 2>&1
  log "  Upload concluído."
}

clean_old_backups() {
  local dir="$1"
  local retention="$2"
  local count

  count=$(find "${dir}" -name "*.sql.gz" -type f | wc -l)
  if [ "${count}" -gt "${retention}" ]; then
    local to_delete=$((count - retention))
    log "  Removendo ${to_delete} backups antigos de ${dir}..."
    find "${dir}" -name "*.sql.gz" -type f -printf '%T+ %p\n' \
      | sort \
      | head -n "${to_delete}" \
      | awk '{print $2}' \
      | xargs rm -f
  fi
}

# ─── Main ────────────────────────────────────────────────────────────────────
main() {
  log "=== Backup iniciado ==="
  ensure_dirs

  local total_size=0
  local failed=0

  for db in "${DATABASES[@]}"; do
    local daily_file="${DAILY_DIR}/${db}_${DATE_STAMP}.sql.gz"
    log "Dumping ${db}..."

    if dump_database "${db}" "${daily_file}"; then
      local size
      size=$(stat -c%s "${daily_file}" 2>/dev/null || echo 0)
      local size_mb
      size_mb=$(echo "scale=2; ${size}/1048576" | bc)
      total_size=$((total_size + size))
      log "  OK: ${db} (${size_mb} MB)"

      upload_to_b2 "${daily_file}"

      # Monthly: copy on the 1st of each month
      if [ "${DAY_OF_MONTH}" = "01" ]; then
        local monthly_file="${MONTHLY_DIR}/${db}_$(date +%Y-%m).sql.gz"
        cp "${daily_file}" "${monthly_file}"
        log "  Backup mensal copiado: ${monthly_file}"
        upload_to_b2 "${monthly_file}"
      fi
    else
      log "  ERRO ao fazer dump de ${db}"
      failed=$((failed + 1))
    fi
  done

  log "Limpando backups antigos..."
  clean_old_backups "${DAILY_DIR}" "${DAILY_RETENTION}"
  clean_old_backups "${MONTHLY_DIR}" "${MONTHLY_RETENTION}"

  local total_mb
  total_mb=$(echo "scale=2; ${total_size}/1048576" | bc)
  log "=== Backup concluído: ${#DATABASES[@]} DBs, ${total_mb} MB total, ${failed} falha(s) ==="

  if [ "${failed}" -gt 0 ]; then
    exit 1
  fi
}

main "$@"
