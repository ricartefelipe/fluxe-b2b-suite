#!/usr/bin/env bash
set -euo pipefail

# Called by postgres entrypoint on first init only.
# Creates all application databases using the superuser credentials.

for db in saascore orders payments keycloak; do
  echo "Creating database: $db"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-SQL
    SELECT 'CREATE DATABASE $db'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec
SQL
done

echo "All databases created."
