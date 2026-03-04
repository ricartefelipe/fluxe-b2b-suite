#!/usr/bin/env bash
#
# Atalho para subir toda a Fluxe B2B Suite localmente.
#
# Uso:
#   ./scripts/rodar-local.sh              # interativo (escolhe frontend)
#   ./scripts/rodar-local.sh shop         # direto pro Shop
#   ./scripts/rodar-local.sh --no-front   # só backends
#   ./scripts/rodar-local.sh --down       # para tudo
#
# Requisito: as pastas spring-saas-core, node-b2b-orders e py-payments-ledger
#            devem estar no mesmo nível que fluxe-b2b-suite.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/up-all.sh" "$@"
