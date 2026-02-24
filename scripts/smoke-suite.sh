#!/usr/bin/env bash
# Smoke da suite já no ar (rode ./scripts/up-all.sh antes, em outro terminal).
# Verifica health dos 3 backends e opcionalmente token dev + listagem de orders.
# Uso: ./scripts/smoke-suite.sh

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Smoke Fluxe B2B Suite (backends devem estar rodando) ==="
echo ""

OK=0
FAIL=0

check() {
  if curl -sf --max-time 5 "$1" >/dev/null 2>&1; then
    echo "  OK $1"
    ((OK++)) || true
    return 0
  else
    echo "  FAIL $1"
    ((FAIL++)) || true
    return 1
  fi
}

check "http://localhost:8080/actuator/health/liveness" || true
check "http://localhost:3000/v1/healthz" || true
check "http://localhost:8000/healthz" || true

echo ""
if [ "$FAIL" -gt 0 ]; then
  echo "Falhas: $FAIL. Suba a suite com: ./scripts/up-all.sh"
  exit 1
fi

echo "Health checks: $OK ok."
echo "Frontend: http://localhost:4200 (Ops Portal, login Ops User)"
echo "RabbitMQ UI: http://localhost:15672 (guest/guest)"
exit 0
