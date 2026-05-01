#!/usr/bin/env bash
# Smoke HTTP mínimo nos backends de staging (health / ready).
# Uso: ./scripts/staging-smoke-endpoints.sh
# Ajusta os hosts se os teus URLs de staging forem outros.

set -euo pipefail

CORE="${CORE_STAGING_URL:?Defina CORE_STAGING_URL}"
ORD="${ORDERS_STAGING_URL:?Defina ORDERS_STAGING_URL}"
PAY="${PAYMENTS_STAGING_URL:?Defina PAYMENTS_STAGING_URL}"

fail=0
check() {
  local name="$1" url="$2"
  local out code
  out="$(mktemp)"
  if ! code=$(curl -sS -o "$out" -w "%{http_code}" "$url"); then
    code="000"
  fi
  if [[ "$code" =~ ^2 ]]; then
    echo "OK  $name ($code) $url"
  else
    echo "FAIL $name ($code) $url"
    fail=1
  fi
  rm -f "$out"
}

check "Core actuator/health" "$CORE/actuator/health"
check "Orders /v1/healthz" "$ORD/v1/healthz"
check "Orders /v1/readyz" "$ORD/v1/readyz"
check "Payments /healthz" "$PAY/healthz"

exit "$fail"
