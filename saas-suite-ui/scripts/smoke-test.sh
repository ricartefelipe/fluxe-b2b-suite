#!/usr/bin/env bash
set -euo pipefail

echo "=== Smoke Test — SaaS Suite UI ==="
echo ""

echo "1. Verificando build do admin-console..."
npx nx build admin-console --configuration=production || { echo "FAIL: admin-console build"; exit 1; }
echo "   OK"

echo "2. Verificando build do ops-portal..."
npx nx build ops-portal --configuration=production || { echo "FAIL: ops-portal build"; exit 1; }
echo "   OK"

echo "3. Executando lint..."
npx nx run-many -t lint --parallel=3 || { echo "FAIL: lint"; exit 1; }
echo "   OK"

echo "4. Executando testes unitários..."
npx nx run-many -t test,vite:test --parallel=3 || { echo "FAIL: testes unitários"; exit 1; }

echo ""
echo "=== Smoke Test Concluído ==="
