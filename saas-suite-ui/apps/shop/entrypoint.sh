#!/bin/sh
CONFIG_DIR=/app/dist/apps/shop/browser/assets
CONFIG_TEMPLATE=/app/config.template.json

if [ -f "$CONFIG_TEMPLATE" ]; then
  mkdir -p "$CONFIG_DIR"
  sed \
    -e "s|\${CORE_API_BASE_URL}|${CORE_API_BASE_URL:-/api/core}|g" \
    -e "s|\${ORDERS_API_BASE_URL}|${ORDERS_API_BASE_URL:-/api/orders}|g" \
    -e "s|\${PAYMENTS_API_BASE_URL}|${PAYMENTS_API_BASE_URL:-/api/payments}|g" \
    -e "s|\${AUTH_MODE}|${AUTH_MODE:-dev}|g" \
    -e "s|\${OIDC_ISSUER}|${OIDC_ISSUER:-}|g" \
    -e "s|\${OIDC_CLIENT_ID}|${OIDC_CLIENT_ID:-}|g" \
    -e "s|\${OIDC_SCOPE}|${OIDC_SCOPE:-}|g" \
    -e "s|\${LOG_LEVEL}|${LOG_LEVEL:-warn}|g" \
    -e "s|\${APP_VERSION}|${APP_VERSION:-1.0.0}|g" \
    "$CONFIG_TEMPLATE" > "$CONFIG_DIR/config.json"
fi

exec node dist/apps/shop/server/server.mjs
