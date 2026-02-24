#!/usr/bin/env bash
#
# SCRIPT LOCAL — Fluxe B2B Suite
# Sobe backends (Docker) + frontend. Só rodar este arquivo.
#
# Uso: ./scripts/rodar-local.sh
# (rode de dentro da pasta fluxe-b2b-suite)
#

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo ""
echo "=============================================="
echo "  Fluxe B2B Suite — subindo tudo localmente"
echo "=============================================="
echo ""
echo "O que este script faz:"
echo "  1. Verifica se o Docker está rodando"
echo "  2. Sobe os 3 backends (Spring, Node, Python) com um único RabbitMQ"
echo "  3. Roda migrações e seeds nos bancos"
echo "  4. Inicia o frontend (Ops Portal)"
echo ""
echo "Requisito: as pastas spring-saas-core, node-b2b-orders e py-payments-ledger"
echo "           devem estar no mesmo nível que fluxe-b2b-suite (ex.: Documentos/wks/)."
echo ""
echo "----------------------------------------------"
echo ""

cd "$SUITE_ROOT"
exec ./scripts/up-all.sh
