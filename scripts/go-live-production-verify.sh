#!/usr/bin/env bash
# Verifica health público dos três backends após deploy (Railway ou TLS próprio).
# Uso:
#   CORE_URL=https://core.example.com ORDERS_URL=https://orders.example.com PAYMENTS_URL=https://pay.example.com ./scripts/go-live-production-verify.sh
# Ou na raiz do repo:
#   pnpm verify:go-live
set -euo pipefail

die() {
  echo "Erro: $*" >&2
  exit 1
}

CORE_URL="${CORE_URL:-}"
ORDERS_URL="${ORDERS_URL:-}"
PAYMENTS_URL="${PAYMENTS_URL:-}"

[[ -n "$CORE_URL" ]] || die "Defina CORE_URL (base HTTPS do spring-saas-core, sem barra final opcional)."
[[ -n "$ORDERS_URL" ]] || die "Defina ORDERS_URL (base HTTPS do node-b2b-orders)."
[[ -n "$PAYMENTS_URL" ]] || die "Defina PAYMENTS_URL (base HTTPS do py-payments-ledger)."

trim_slash() {
  echo "${1%/}"
}

core=$(trim_slash "$CORE_URL")
ord=$(trim_slash "$ORDERS_URL")
pay=$(trim_slash "$PAYMENTS_URL")

echo "== Health checks (Spring → ${core}/actuator/health)"
curl -sfS "$core/actuator/health" >/dev/null || die "Core não respondeu OK em /actuator/health"

echo "== Health checks (Orders → ${ord}/v1/healthz)"
curl -sfS "$ord/v1/healthz" >/dev/null || die "Orders não respondeu OK em /v1/healthz"

echo "== Health checks (Payments → ${pay}/healthz)"
curl -sfS "$pay/healthz" >/dev/null || die "Payments não respondeu OK em /healthz"

echo ""
echo "Todos os endpoints de readiness responderam HTTP 2xx."
