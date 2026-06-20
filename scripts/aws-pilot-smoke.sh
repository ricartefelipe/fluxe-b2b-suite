#!/usr/bin/env bash
# Smoke completo do piloto AWS (HTTPS sslip.io ou domínio próprio).
#
# Uso:
#   source .aws-deploy/last-ec2.env
#   ./scripts/aws-pilot-smoke.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BASE="${PILOT_BASE_URL:-}"
if [[ -z "$BASE" && -f "$SUITE_ROOT/.aws-deploy/last-ec2.env" ]]; then
  # shellcheck disable=SC1091
  source "$SUITE_ROOT/.aws-deploy/last-ec2.env"
  if [[ -n "${PILOT_DOMAIN:-}" ]]; then
    BASE="https://${PILOT_DOMAIN}"
  elif [[ -n "${PUBLIC_IP:-}" ]]; then
    BASE="http://${PUBLIC_IP}"
  fi
fi

if [[ -z "$BASE" ]]; then
  echo "Defina PILOT_BASE_URL ou .aws-deploy/last-ec2.env" >&2
  exit 1
fi

BASE="${BASE%/}"
echo "=== Smoke piloto AWS: $BASE ==="

fail=0
check() {
  local name="$1" url="$2"
  if curl -sf --max-time 20 "$url" >/dev/null; then
    echo "  OK  $name"
  else
    echo "  FAIL $name ($url)" >&2
    fail=1
  fi
}

check "health"        "$BASE/health"
check "core"        "$BASE/api/core/actuator/health/liveness"
check "orders"      "$BASE/api/orders/v1/healthz"
check "payments"    "$BASE/api/payments/healthz"
check "shop"        "$BASE/"
check "ops"         "$BASE/ops/"
check "admin"       "$BASE/admin/"

echo "▸ Login Core (admin@local)..."
if curl -sf --max-time 20 -X POST "$BASE/api/core/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@local","password":"admin123"}' | grep -q access_token; then
  echo "  OK  login Core"
else
  echo "  FAIL login Core" >&2
  fail=1
fi

echo "▸ Saga pedido → PAID..."
export ORDERS_SMOKE_URL="$BASE/api/orders"
export PAYMENTS_SMOKE_URL="$BASE/api/payments"
export OPS_EMAIL="ops@demo.example.com"
export OPS_PASSWORD="ops123"
export OPS_TENANT="00000000-0000-0000-0000-000000000002"
export SMOKE_SAGA_PAID_LEDGER=1
if "$SCRIPT_DIR/smoke-order-staging.sh" >/dev/null 2>&1; then
  echo "  OK  saga PAID"
else
  echo "  FAIL saga PAID (ver smoke-order-staging.sh)" >&2
  fail=1
fi

if [[ "$fail" -ne 0 ]]; then
  echo "=== Smoke piloto: FALHOU ===" >&2
  exit 1
fi

echo "=== Smoke piloto: OK ==="
echo ""
echo "Demo rápido:"
echo "  Admin:  $BASE/admin/  (admin@local / admin123)"
echo "  Ops:    $BASE/ops/     (admin@local / admin123)"
echo "  Shop:   $BASE/"
echo "  Pedido demo: ops@demo.example.com / ops123 (tenant seed orders)"
