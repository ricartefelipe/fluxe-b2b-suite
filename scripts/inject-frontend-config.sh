#!/usr/bin/env bash
# Generate runtime config.json and config.keycloak.json for each Angular app.
# Reads API URLs from environment variables and writes to the build output directories.
#
# Usage:
#   export CORE_API_URL=https://api.fluxe.com.br
#   export ORDERS_API_URL=https://orders.fluxe.com.br
#   export PAYMENTS_API_URL=https://payments.fluxe.com.br
#   export KEYCLOAK_URL=https://auth.fluxe.com.br
#   export KEYCLOAK_REALM=fluxe
#   ./scripts/inject-frontend-config.sh
#
# Or pass a specific app: ./scripts/inject-frontend-config.sh shop
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
UI_ROOT="${SUITE_ROOT}/saas-suite-ui"

CORE_API_URL="${CORE_API_URL:-https://api.fluxe.com.br}"
ORDERS_API_URL="${ORDERS_API_URL:-https://orders.fluxe.com.br}"
PAYMENTS_API_URL="${PAYMENTS_API_URL:-https://payments.fluxe.com.br}"
KEYCLOAK_URL="${KEYCLOAK_URL:-https://auth.fluxe.com.br}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-fluxe}"

declare -A APPS=(
  ["shop"]="dist/apps/shop/browser"
  ["ops-portal"]="dist/apps/ops-portal/browser"
  ["admin-console"]="dist/apps/admin-console/browser"
)

declare -A CLIENT_IDS=(
  ["shop"]="${KEYCLOAK_CLIENT_SHOP:-fluxe-shop}"
  ["ops-portal"]="${KEYCLOAK_CLIENT_OPS:-fluxe-ops-portal}"
  ["admin-console"]="${KEYCLOAK_CLIENT_ADMIN:-fluxe-admin-console}"
)

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

inject_config() {
  local app="$1"
  local output_dir="${UI_ROOT}/${APPS[${app}]}"
  local client_id="${CLIENT_IDS[${app}]}"

  if [ ! -d "${output_dir}" ]; then
    log "WARN: Build output não encontrado para '${app}': ${output_dir}"
    log "  Execute primeiro: cd ${UI_ROOT} && pnpm nx build ${app} --configuration=production"
    return 1
  fi

  local auth_mode="${AUTH_MODE:-oidc}"

  cat > "${output_dir}/assets/config.json" << EOF
{
  "coreApiBaseUrl": "${CORE_API_URL}",
  "ordersApiBaseUrl": "${ORDERS_API_URL}",
  "paymentsApiBaseUrl": "${PAYMENTS_API_URL}",
  "authMode": "${auth_mode}",
  "oidc": {
    "issuer": "${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}",
    "clientId": "${client_id}",
    "scope": "openid profile email"
  },
  "logLevel": "info",
  "version": "${APP_VERSION:-1.0.0}"
}
EOF

  log "OK: ${app} → ${output_dir}/{config.json,config.keycloak.json}"
}

main() {
  log "=== Injetando configuração de runtime ==="
  log "  CORE_API_URL=${CORE_API_URL}"
  log "  ORDERS_API_URL=${ORDERS_API_URL}"
  log "  PAYMENTS_API_URL=${PAYMENTS_API_URL}"
  log "  KEYCLOAK_URL=${KEYCLOAK_URL}"
  log "  KEYCLOAK_REALM=${KEYCLOAK_REALM}"
  echo ""

  local target_apps=("$@")
  if [ ${#target_apps[@]} -eq 0 ]; then
    target_apps=("shop" "ops-portal" "admin-console")
  fi

  local failed=0
  for app in "${target_apps[@]}"; do
    if [ -z "${APPS[${app}]+_}" ]; then
      log "ERRO: App desconhecido: ${app}"
      log "  Apps válidos: ${!APPS[*]}"
      failed=$((failed + 1))
      continue
    fi
    inject_config "${app}" || failed=$((failed + 1))
  done

  echo ""
  if [ "${failed}" -gt 0 ]; then
    log "=== Concluído com ${failed} erro(s) ==="
    exit 1
  fi
  log "=== Configuração injetada com sucesso ==="
}

main "$@"
