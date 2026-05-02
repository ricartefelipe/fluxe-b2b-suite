#!/usr/bin/env bash
# Backup lógico PostgreSQL (compatível com URL do Railway).
#
# Requisitos: cliente psql/pg_dump instalado (postgresql-client).
# Uso:
#   DATABASE_URL='postgresql://user:pass@host:5432/db' ./scripts/backup-postgres.sh
#   ./scripts/backup-postgres.sh 'postgresql://...'
#
# Formato custom (-Fc) permite restore com pg_restore. Guarde o ficheiro fora do repo,
# encriptado se possível (ex.: age, gpg, bucket privado S3-compatible).
set -euo pipefail

url="${1:-${DATABASE_URL:-}}"
if [[ -z "$url" ]]; then
  echo "Defina DATABASE_URL ou passe como primeiro argumento." >&2
  exit 1
fi

ts="$(date -u +%Y%m%dT%H%M%SZ)"
out_dir="${BACKUP_DIR:-.}"
mkdir -p "$out_dir"
file="${out_dir}/pg-backup-${ts}.dump"

pg_dump --no-owner --format=custom --dbname="$url" -f "$file"
echo "Backup criado: $file ($(du -h "$file" | cut -f1))"
