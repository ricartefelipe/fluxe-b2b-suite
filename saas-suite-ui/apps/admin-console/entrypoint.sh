#!/bin/sh
# Gera /assets/config.json e fragmento nginx: quando CORE/ORDERS/PAYMENTS forem https://,
# o config público usa /api/... (same-origin) e o nginx reencaminha (sem CORS; sem HTML da SPA em /api).

set -f
CONFIG_FILE=/usr/share/nginx/html/assets/config.json
CONFIG_TEMPLATE=/usr/share/nginx/html/assets/config.template.json
SNIP=/etc/nginx/snippets/api-proxy.conf

printf '# api-proxy (gerado; locations opcionais)\n' > "$SNIP"

is_abs() {
  printf '%s' "$1" | grep -qE '^https?://'
}

normalise_no_trail() {
  printf '%s' "$1" | sed 's|/*$||'
}

append_proxy_location() {
  _loc="$1"
  _up="$2"
  _upn=$(normalise_no_trail "$_up")
  {
    echo "location ${_loc} {"
    echo "  proxy_ssl_server_name on;"
    echo "  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
    echo "  proxy_set_header X-Forwarded-Proto \$scheme;"
    echo "  # LLM (OpenAI) e cold start: default 60s derrubava 502/timeout no Nginx"
    echo "  proxy_connect_timeout 75s;"
    echo "  proxy_read_timeout 300s;"
    echo "  proxy_send_timeout 300s;"
    echo "  proxy_pass ${_upn}/;"
    echo "}"
  } >> "$SNIP"
}

core_in="${CORE_API_BASE_URL:-/api/core}"
orders_in="${ORDERS_API_BASE_URL:-/api/orders}"
pay_in="${PAYMENTS_API_BASE_URL:-/api/payments}"
core_out="$core_in"
orders_out="$orders_in"
pay_out="$pay_in"

if is_abs "$core_in"; then
  core_out="/api/core"
  append_proxy_location "/api/core" "$core_in"
fi
if is_abs "$orders_in"; then
  orders_out="/api/orders"
  append_proxy_location "/api/orders" "$orders_in"
fi
if is_abs "$pay_in"; then
  pay_out="/api/payments"
  append_proxy_location "/api/payments" "$pay_in"
fi

export CORE_API_BASE_URL="$core_out"
export ORDERS_API_BASE_URL="$orders_out"
export PAYMENTS_API_BASE_URL="$pay_out"

if [ ! -f "$CONFIG_TEMPLATE" ]; then
  echo "[entrypoint] config template not found" >&2
  exit 1
fi
envsubst '${CORE_API_BASE_URL} ${ORDERS_API_BASE_URL} ${PAYMENTS_API_BASE_URL} ${AUTH_MODE} ${OIDC_ISSUER} ${OIDC_CLIENT_ID} ${OIDC_SCOPE} ${LOG_LEVEL} ${APP_VERSION}' \
  < "$CONFIG_TEMPLATE" > "$CONFIG_FILE"
