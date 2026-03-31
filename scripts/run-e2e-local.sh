#!/usr/bin/env bash
# E2E Playwright contra frontends já no ar (alinhado a ./scripts/up-all.sh all).
# Pré-requisitos: backends (Docker) + os três apps em 4200 / 4300 / 4400.
#
# Uso:
#   ./scripts/run-e2e-local.sh              # smoke nos backends + instala chromium + e2e
#   ./scripts/run-e2e-local.sh --skip-smoke
#
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
UI="$SUITE_ROOT/saas-suite-ui"

SKIP_SMOKE=0
for arg in "$@"; do
  if [[ "$arg" == "--skip-smoke" ]]; then
    SKIP_SMOKE=1
  fi
done

if [[ "$SKIP_SMOKE" -eq 0 ]]; then
  "$SCRIPT_DIR/smoke-suite.sh"
else
  echo "=== E2E local (smoke dos backends ignorado) ==="
fi

if [[ ! -d "$UI/node_modules" ]]; then
  echo "Instalando dependências em saas-suite-ui..."
  (cd "$UI" && pnpm install)
fi

cd "$UI"
echo ""
echo "=== Playwright: browser chromium ==="
pnpm exec playwright install chromium

export E2E_SKIP_WEBSERVER=1

run_one() {
  local project="$1"
  local port="$2"
  echo ""
  echo "=== nx e2e $project (BASE_URL=http://localhost:$port) ==="
  BASE_URL="http://localhost:$port" pnpm nx e2e "$project" --parallel=1
}

run_one shop-e2e 4200
run_one ops-portal-e2e 4300
run_one admin-console-e2e 4400

echo ""
echo "E2E local concluído."
