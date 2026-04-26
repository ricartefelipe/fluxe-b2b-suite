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
# Opcional ate PAID (duas formas):
#   A) SMOKE_PAYMENT_PAID=1 + RABBITMQ_URL — publica payment.settled manualmente (repo node-b2b-orders ao lado).
#   B) SMOKE_SAGA_PAID_LEDGER=1 — sem publicar; faz poll ate PAID (exige py-payments worker + orders worker no mesmo broker).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WKS="$(cd "$SCRIPT_DIR/../.." && pwd)"

BASE_URL="${ORDERS_SMOKE_URL:-${SMOKE_BASE_URL:-}}"
if [[ -z "$BASE_URL" ]]; then
  echo "[smoke-order] Defina ORDERS_SMOKE_URL (URL base da API orders, sem barra final)."
  exit 1
fi
BASE_URL="${BASE_URL%/}"

OPS_EMAIL="${OPS_EMAIL:-ops@demo.example.com}"
OPS_PASSWORD="${OPS_PASSWORD:-ops123}"
TENANT="${OPS_TENANT:-00000000-0000-0000-0000-000000000002}"

json_get () {
  node -e "const obj=JSON.parse(process.argv[1]); const path=process.argv[2].split('.'); let cur=obj; for (const p of path){cur=cur[p];} console.log(cur);" "$1" "$2"
}

# curl com corpo em stdout; em HTTP != 2xx imprime corpo (ex.: detalhe Prisma) e sai com 1
http_expect_2xx () {
  local out code
  out=$(mktemp)
  code=$(curl -sS -o "$out" -w '%{http_code}' "$@") || true
  if [[ "$code" != 2* ]]; then
    echo "[smoke-order] HTTP $code" >&2
    cat "$out" >&2
    rm -f "$out"
    exit 1
  fi
  cat "$out"
  rm -f "$out"
}

echo "[smoke-order] Base: $BASE_URL"
echo "[smoke-order] Tenant: $TENANT / utilizador: $OPS_EMAIL"

http_expect_2xx --max-time 25 "$BASE_URL/v1/healthz" >/dev/null
echo "[smoke-order] OK GET /v1/healthz"

TOKEN_JSON=$(http_expect_2xx --max-time 25 -X POST "$BASE_URL/v1/auth/token" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$OPS_EMAIL\",\"password\":\"$OPS_PASSWORD\",\"tenantId\":\"$TENANT\"}")
TOKEN=$(json_get "$TOKEN_JSON" "access_token")
if [[ -z "$TOKEN" || "$TOKEN" == "undefined" ]]; then
  echo "[smoke-order] FALHA: token vazio — credenciais ou tenant invalidos para este ambiente."
  exit 1
fi
echo "[smoke-order] OK POST /v1/auth/token"

IDEM="suite-smoke-$(date +%s)-$RANDOM"
ORDER_JSON=$(http_expect_2xx --max-time 30 -X POST "$BASE_URL/v1/orders" \
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

poll_until_status () {
  local expected="$1"
  local max="${2:-30}"
  local label="${3:-aguardando $expected}"
  local observed=""
  echo "[smoke-order] $label"
  for _ in $(seq 1 "$max"); do
    ORDER_STATE=$(http_expect_2xx --max-time 25 "$BASE_URL/v1/orders/$ORDER_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-Tenant-Id: $TENANT")
    observed=$(json_get "$ORDER_STATE" "status")
    if [[ "$observed" == "$expected" ]]; then
      return 0
    fi
    sleep 1
  done
  echo "[smoke-order] FALHA: esperado $expected, obtido: ${observed:-desconhecido}"
  return 1
}

if ! poll_until_status "RESERVED" 30 "Aguardando worker reservar stock (ate 30s)..."; then
  echo "[smoke-order] Verifique worker/RabbitMQ em staging."
  exit 1
fi
echo "[smoke-order] OK GET /v1/orders/:id -> RESERVED"

CONFIRM_JSON=$(http_expect_2xx --max-time 30 -X POST "$BASE_URL/v1/orders/$ORDER_ID/confirm" \
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

poll_until_paid () {
  local max="${1:-25}"
  local label="${2:-aguardando PAID}"
  poll_until_status "PAID" "$max" "$label"
}

if [[ "${SMOKE_PAYMENT_PAID:-0}" == "1" ]]; then
  if [[ "${SMOKE_SAGA_PAID_LEDGER:-0}" == "1" ]]; then
    echo "[smoke-order] Use apenas um modo: SMOKE_PAYMENT_PAID ou SMOKE_SAGA_PAID_LEDGER."
    exit 1
  fi
  if [[ -z "${RABBITMQ_URL:-}" ]]; then
    echo "[smoke-order] SMOKE_PAYMENT_PAID=1 exige RABBITMQ_URL (mesmo broker que API e worker em staging)."
    exit 1
  fi
  PUB="${WKS}/node-b2b-orders/scripts/publish-payment-settled.js"
  if [[ ! -f "$PUB" ]]; then
    echo "[smoke-order] Nao encontrado: $PUB — clone node-b2b-orders ao lado de fluxe-b2b-suite (workspace)."
    exit 1
  fi
  echo "[smoke-order] Publicando payment.settled (simula py-payments-ledger)..."
  (cd "${WKS}/node-b2b-orders" && RABBITMQ_URL="$RABBITMQ_URL" node scripts/publish-payment-settled.js "$ORDER_ID" "$TENANT")
  if ! poll_until_paid 25 "Aguardando worker orders consumir payment.settled..."; then
    echo "[smoke-order] FALHA: status PAID nao atingido (worker orders, fila ou PAYMENTS_EXCHANGE)."
    exit 1
  fi
  echo "[smoke-order] OK GET /v1/orders/:id -> PAID"
  echo "[smoke-order] Fluxo minimo concluido com sucesso (ate PAID, publicacao manual)."
elif [[ "${SMOKE_SAGA_PAID_LEDGER:-0}" == "1" ]]; then
  PAYMENTS_BASE="${PAYMENTS_SMOKE_URL:-${SMOKE_PAYMENTS_BASE:-}}"
  if [[ -n "$PAYMENTS_BASE" ]]; then
    PAYMENTS_BASE="${PAYMENTS_BASE%/}"
    if curl -sfS --max-time 15 "$PAYMENTS_BASE/healthz" >/dev/null; then
      echo "[smoke-order] OK GET payments $PAYMENTS_BASE/healthz"
    else
      echo "[smoke-order] aviso: payments health falhou — continua mesmo assim (opcional)"
    fi
  fi
  echo "[smoke-order] Modo saga: ledger deve consumir order.confirmed/charge, emitir payment.settled (py-payments worker + orders worker)."
  if ! poll_until_paid 90 "Aguardando PAID via ledger (ate 90s)..."; then
    echo "[smoke-order] FALHA: PAID nao atingido. Verifique py-payments worker, ORDERS_INTEGRATION_ENABLED, gateway (fake/stripe) e filas."
    exit 1
  fi
  echo "[smoke-order] OK GET /v1/orders/:id -> PAID"
  echo "[smoke-order] Fluxo saga concluido com sucesso (ate PAID via py-payments-ledger)."
else
  echo "[smoke-order] Fluxo minimo concluido com sucesso (ate CONFIRMED)."
  echo "[smoke-order] PAID: SMOKE_PAYMENT_PAID=1+RABBITMQ_URL ou SMOKE_SAGA_PAID_LEDGER=1 (ver CHECKLIST-PEDIDO-STAGING.md)."
fi
