#!/usr/bin/env bash
set -euo pipefail

echo "=== Dev Up — SaaS Suite UI ==="
echo ""
echo "Iniciando Admin Console (porta 4200) e Ops Portal (porta 4300)..."
echo ""

npx nx serve admin-console &
ADMIN_PID=$!

npx nx serve ops-portal --port=4300 &
OPS_PID=$!

echo "Admin Console: http://localhost:4200"
echo "Ops Portal:    http://localhost:4300"
echo ""
echo "Pressione Ctrl+C para parar ambos..."

trap "kill $ADMIN_PID $OPS_PID 2>/dev/null; exit" INT TERM
wait
