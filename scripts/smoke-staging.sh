#!/usr/bin/env bash
set -euo pipefail

# Executa os smokes HTTP dos tres backends se as variaveis estiverem definidas.
# Espera repos irmaos no mesmo diretorio pai que fluxe-b2b-suite (workspace local).
#
# CORE_SMOKE_URL, ORDERS_SMOKE_URL, PAYMENTS_SMOKE_URL (ou SMOKE_BASE_URL por servico via scripts individuais)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WKS="$(cd "$SCRIPT_DIR/../.." && pwd)"

run_if_exists() {
  local path="$1"
  [[ -x "$path" ]] || [[ -f "$path" ]] || return 0
  chmod +x "$path" 2>/dev/null || true
  bash "$path"
}

echo "=== smoke-staging (workspace em ${WKS}) ==="
run_if_exists "${WKS}/spring-saas-core/scripts/smoke-post-merge.sh"
run_if_exists "${WKS}/node-b2b-orders/scripts/smoke-post-merge.sh"
run_if_exists "${WKS}/py-payments-ledger/scripts/smoke-post-merge.sh"
echo "=== fim smoke-staging ==="
