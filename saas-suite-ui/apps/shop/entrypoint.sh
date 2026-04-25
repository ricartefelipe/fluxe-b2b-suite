#!/bin/sh
set -f
CONFIG_DIR=/app/dist/apps/shop/browser/assets
CONFIG_TEMPLATE=/app/config.template.json

# Se CORE/ORDERS/PAYMENTS forem https://, o config público fica com /api/... (mesmo origem) e
# exportamos *PROXY_TARGET para o server.ts reencaminhar. Evita CORS e evita a SPA a devolver
# HTML no lugar do JSON.
core_in="${CORE_API_BASE_URL:-/api/core}"
orders_in="${ORDERS_API_BASE_URL:-/api/orders}"
pay_in="${PAYMENTS_API_BASE_URL:-/api/payments}"
core_out="$core_in"
orders_out="$orders_in"
pay_out="$pay_in"

is_abs() {
  printf '%s' "$1" | grep -qE '^https?://'
}

if is_abs "$core_in"; then
  core_out="/api/core"
  export CORE_API_PROXY_TARGET="$core_in"
fi
if is_abs "$orders_in"; then
  orders_out="/api/orders"
  export ORDERS_API_PROXY_TARGET="$orders_in"
fi
if is_abs "$pay_in"; then
  pay_out="/api/payments"
  export PAYMENTS_API_PROXY_TARGET="$pay_in"
fi

if [ -f "$CONFIG_TEMPLATE" ]; then
  mkdir -p "$CONFIG_DIR"
  sed \
    -e "s|\${CORE_API_BASE_URL}|$core_out|g" \
    -e "s|\${ORDERS_API_BASE_URL}|$orders_out|g" \
    -e "s|\${PAYMENTS_API_BASE_URL}|$pay_out|g" \
    -e "s|\${AUTH_MODE}|${AUTH_MODE:-dev}|g" \
    -e "s|\${OIDC_ISSUER}|${OIDC_ISSUER:-}|g" \
    -e "s|\${OIDC_CLIENT_ID}|${OIDC_CLIENT_ID:-}|g" \
    -e "s|\${OIDC_SCOPE}|${OIDC_SCOPE:-}|g" \
    -e "s|\${LOG_LEVEL}|${LOG_LEVEL:-warn}|g" \
    -e "s|\${APP_VERSION}|${APP_VERSION:-1.0.0}|g" \
    -e "s|\${SUPPORT_EMAIL}|${SUPPORT_EMAIL:-}|g" \
    -e "s|\${SUPPORT_DOCS_URL}|${SUPPORT_DOCS_URL:-}|g" \
    "$CONFIG_TEMPLATE" > "$CONFIG_DIR/config.json"
fi

exec node dist/apps/shop/server/server.mjs
