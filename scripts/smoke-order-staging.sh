#!/usr/bin/env bash
set -euo pipefail

# Fluxo minimo de pedido contra a API node-b2b-orders em STAGING (ou qualquer URL base).
# Requer utilizador e seed alinhados ao ambiente (ver docs/CHECKLIST-PEDIDO-STAGING.md).
#
# Uso:
#   export ORDERS_SMOKE_URL="https://xxx.railway.app"
#   ./scripts/smoke-order-staging.sh
#
# Opcional: OPS_EMAIL, OPS_PASSWORD, OPS_TENANT (defaults = seed local/demo)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BASE_URL="${ORDERS_SMOKE_URL:-${SMOKE_BASE_URL:-}}"
if [[ -z "$BASE_URL" ]]; then
  echo "[smoke-order] Defina ORDERS_SMOKE_URL (URL base da API orders, sem barra final)."
  exit 1
fi
BASE_URL="${BASE_URL%/}"

OPS_EMAIL="${OPS_EMAIL:-ops@demo.example.com}"
OPS_PASSWORD="${OPS_PASSWORD:-ops123}"
TENANT="${OPS_TENANT:-tenant_demo}"

json_get () {
  node -e "const obj=JSON.parse(process.argv[1]); const path=process.argv[2].split('.'); let cur=obj; for (const p of path){cur=cur[p];} console.log(cur);" "$1" "$2"
}

echo "[smoke-order] Base: $BASE_URL"
echo "[smoke-order] Tenant: $TENANT / utilizador: $OPS_EMAIL"

curl -sfS --max-time 25 "$BASE_URL/v1/healthz" >/dev/null
echo "[smoke-order] OK GET /v1/healthz"

TOKEN_JSON=$(curl -sfS --max-time 25 -X POST "$BASE_URL/v1/auth/token" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$OPS_EMAIL\",\"password\":\"$OPS_PASSWORD\",\"tenantId\":\"$TENANT\"}")
TOKEN=$(json_get "$TOKEN_JSON" "access_token")
if [[ -z "$TOKEN" || "$TOKEN" == "undefined" ]]; then
  echo "[smoke-order] FALHA: token vazio — credenciais ou tenant invalidos para este ambiente."
  exit 1
fi
echo "[smoke-order] OK POST /v1/auth/token"

IDEM="suite-smoke-$(date +%s)-$RANDOM"
ORDER_JSON=$(curl -sfS --max-time 30 -X POST "$BASE_URL/v1/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT" \
  -H "Idempotency-Key: $IDEM" \
  -H "Content-Type: application/json" \
  -d '{"customerId":"STAGING-CHECK","items":[{"sku":"SKU-1","qty":1,"price":10}]}')
ORDER_ID=$(json_get "$ORDER_JSON" "id")
STATUS=$(json_get "$ORDER_JSON" "status")
if [[ "$STATUS" != "CREATED" ]]; then
  echo "[smoke-order] FALHA: esperado status CREATED, obtido: $STATUS"
  exit 1
fi
echo "[smoke-order] OK POST /v1/orders id=$ORDER_ID"

echo "[smoke-order] Aguardar worker (reserva de stock)..."
sleep 4

ORDER_AFTER=$(curl -sfS --max-time 25 "$BASE_URL/v1/orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT")
RSV=$(json_get "$ORDER_AFTER" "status")
if [[ "$RSV" != "RESERVED" ]]; then
  echo "[smoke-order] AVISO: esperado RESERVED apos worker, obtido: $RSV (verifique worker/RabbitMQ em staging)"
  exit 1
fi
echo "[smoke-order] OK GET /v1/orders/:id -> RESERVED"

CONFIRM_JSON=$(curl -sfS --max-time 30 -X POST "$BASE_URL/v1/orders/$ORDER_ID/confirm" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT" \
  -H "Idempotency-Key: confirm-$IDEM" \
  -H "Content-Type: application/json" \
  -d '{}')
CF=$(json_get "$CONFIRM_JSON" "status")
if [[ "$CF" != "CONFIRMED" ]]; then
  echo "[smoke-order] FALHA: confirm esperado CONFIRMED, obtido: $CF"
  exit 1
fi
echo "[smoke-order] OK POST /v1/orders/:id/confirm -> CONFIRMED"

echo "[smoke-order] Fluxo minimo concluido com sucesso (ate CONFIRMED)."
echo "[smoke-order] Nota: estado PAID depende de py-payments-ledger + evento payment.settled (ver README node-b2b-orders)."
