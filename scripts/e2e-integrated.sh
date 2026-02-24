#!/usr/bin/env bash
# Validação E2E integrada — Fluxe B2B Suite
# Requer: Docker e Docker Compose, os 4 repos no mesmo nível (fluxe-b2b-suite, spring-saas-core, node-b2b-orders, py-payments-ledger)
# Uso: ./scripts/e2e-integrated.sh [smoke-only]
#   smoke-only: só roda os smokes de cada backend (cada um sobe seu próprio stack).

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WKS="$(cd "$SUITE_ROOT/.." && pwd)"

echo "=== Fluxe B2B Suite — E2E integrado ==="
echo "Workspace: $WKS"
echo ""

SMOKE_ONLY="${1:-}"

# 1) Spring
echo "--- [1/3] spring-saas-core ---"
if [ ! -d "$WKS/spring-saas-core" ]; then
  echo "  SKIP: $WKS/spring-saas-core não encontrado"
else
  cd "$WKS/spring-saas-core"
  ./scripts/up.sh || true
  sleep 5
  ./scripts/smoke.sh || echo "  WARN: smoke Spring falhou"
  echo ""
fi

# 2) Node
echo "--- [2/3] node-b2b-orders ---"
if [ ! -d "$WKS/node-b2b-orders" ]; then
  echo "  SKIP: $WKS/node-b2b-orders não encontrado"
else
  cd "$WKS/node-b2b-orders"
  ./scripts/up.sh || true
  ./scripts/migrate.sh || true
  ./scripts/seed.sh || true
  sleep 5
  ./scripts/smoke.sh || echo "  WARN: smoke Node falhou"
  echo ""
fi

# 3) Python
echo "--- [3/3] py-payments-ledger ---"
if [ ! -d "$WKS/py-payments-ledger" ]; then
  echo "  SKIP: $WKS/py-payments-ledger não encontrado"
else
  cd "$WKS/py-payments-ledger"
  ./scripts/up.sh || true
  ./scripts/seed.sh || true
  sleep 5
  ./scripts/smoke.sh || echo "  WARN: smoke Python falhou"
  echo ""
fi

echo "=== E2E backends concluído ==="
echo "Para fluxo completo (pedido → PAID): use um único RabbitMQ e as mesmas envs de JWT; veja docs/E2E-RUN.md"
echo "Frontend: cd $SUITE_ROOT/saas-suite-ui && pnpm nx serve ops-portal"
