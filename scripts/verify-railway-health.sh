#!/usr/bin/env bash
# Verifica health HTTP dos três backends (defaults = produção em docs/URLS-PRODUCAO.md).
# Sobrescrever: CORE_URL ORDERS_URL PAYMENTS_URL (sem barra final).
set -euo pipefail

CORE_URL="${CORE_URL:-https://spring-saas-core-production.up.railway.app}"
ORDERS_URL="${ORDERS_URL:-https://node-b2b-orders-production.up.railway.app}"
PAYMENTS_URL="${PAYMENTS_URL:-https://py-payments-ledger-production.up.railway.app}"

check() {
  local name="$1" url="$2"
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 20 "$url" || echo "000")
  if [[ "$code" == "200" ]]; then
    echo "[OK] $name ($code) $url"
  else
    echo "[FALHA] $name ($code) $url" >&2
    return 1
  fi
}

fail=0
check "Core" "${CORE_URL}/actuator/health" || fail=1
check "Orders" "${ORDERS_URL}/v1/healthz" || fail=1
check "Payments" "${PAYMENTS_URL}/healthz" || fail=1
exit "$fail"
