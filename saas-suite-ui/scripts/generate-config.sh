#!/usr/bin/env bash
set -euo pipefail

# Generates config.json from config.template.json for each app.
# Environment variables override defaults; unset vars keep template placeholders.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

CORE_API_BASE_URL="${CORE_API_BASE_URL:-http://localhost:8080}"
ORDERS_API_BASE_URL="${ORDERS_API_BASE_URL:-http://localhost:3000}"
PAYMENTS_API_BASE_URL="${PAYMENTS_API_BASE_URL:-http://localhost:8000}"
AUTH_MODE="${AUTH_MODE:-dev}"
OIDC_ISSUER="${OIDC_ISSUER:-http://localhost:8180/realms/saas}"
OIDC_CLIENT_ID="${OIDC_CLIENT_ID:-saas-suite-ui}"
OIDC_SCOPE="${OIDC_SCOPE:-openid profile email}"
LOG_LEVEL="${LOG_LEVEL:-debug}"
APP_VERSION="${APP_VERSION:-0.0.0}"

APPS=("ops-portal" "admin-console" "shop")

for app in "${APPS[@]}"; do
  TEMPLATE="$ROOT_DIR/apps/$app/config.template.json"
  OUTPUT="$ROOT_DIR/apps/$app/public/assets/config.json"

  if [ ! -f "$TEMPLATE" ]; then
    echo "[skip] No template found for $app"
    continue
  fi

  mkdir -p "$(dirname "$OUTPUT")"

  sed \
    -e "s|\${CORE_API_BASE_URL}|${CORE_API_BASE_URL}|g" \
    -e "s|\${ORDERS_API_BASE_URL}|${ORDERS_API_BASE_URL}|g" \
    -e "s|\${PAYMENTS_API_BASE_URL}|${PAYMENTS_API_BASE_URL}|g" \
    -e "s|\${AUTH_MODE}|${AUTH_MODE}|g" \
    -e "s|\${OIDC_ISSUER}|${OIDC_ISSUER}|g" \
    -e "s|\${OIDC_CLIENT_ID}|${OIDC_CLIENT_ID}|g" \
    -e "s|\${OIDC_SCOPE}|${OIDC_SCOPE}|g" \
    -e "s|\${LOG_LEVEL}|${LOG_LEVEL}|g" \
    -e "s|\${APP_VERSION}|${APP_VERSION}|g" \
    "$TEMPLATE" > "$OUTPUT"

  echo "[ok] Generated $OUTPUT"
done
