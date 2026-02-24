#!/usr/bin/env bash
# Sobe só o frontend (sem Docker). Use quando os backends já estiverem rodando
# ou para ver a UI em modo dev (login dev funciona se Core estiver em localhost:8080).
# Uso: ./scripts/serve-frontend.sh

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Frontend — Ops Portal ==="
echo "  URL: http://localhost:4200"
echo "  Config: coreApiBaseUrl=localhost:8080, orders=3000, payments=8000"
echo "  Se os backends não estiverem no ar, o login pode falhar."
echo ""

cd "$SUITE_ROOT/saas-suite-ui"
exec pnpm nx serve ops-portal
