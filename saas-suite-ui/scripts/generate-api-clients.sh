#!/usr/bin/env bash
set -euo pipefail

echo "=== Geração de API Clients ==="
echo ""
echo "Pré-requisitos:"
echo "  - OpenAPI specs disponíveis para cada backend"
echo "  - @openapitools/openapi-generator-cli instalado (já no package.json)"
echo ""

CORE_SPEC=${CORE_API_SPEC:-"http://localhost:8080/v3/api-docs"}
ORDERS_SPEC=${ORDERS_API_SPEC:-"http://localhost:3000/api-docs/swagger.json"}
PAYMENTS_SPEC=${PAYMENTS_API_SPEC:-"http://localhost:8000/openapi.json"}

echo "Gerando client para spring-saas-core..."
npx openapi-generator-cli generate \
  -i "$CORE_SPEC" \
  -g typescript-angular \
  -o libs/data-access/core/src/lib/generated \
  --additional-properties=ngVersion=21 2>/dev/null || echo "WARN: Falha ao gerar core client. Verifique se o backend está rodando."

echo "Gerando client para node-b2b-orders..."
npx openapi-generator-cli generate \
  -i "$ORDERS_SPEC" \
  -g typescript-angular \
  -o libs/data-access/orders/src/lib/generated \
  --additional-properties=ngVersion=21 2>/dev/null || echo "WARN: Falha ao gerar orders client. Verifique se o backend está rodando."

echo "Gerando client para py-payments-ledger..."
npx openapi-generator-cli generate \
  -i "$PAYMENTS_SPEC" \
  -g typescript-angular \
  -o libs/data-access/payments/src/lib/generated \
  --additional-properties=ngVersion=21 2>/dev/null || echo "WARN: Falha ao gerar payments client. Verifique se o backend está rodando."

echo ""
echo "Done. Revise os clients gerados em libs/data-access/*/src/lib/generated/"
