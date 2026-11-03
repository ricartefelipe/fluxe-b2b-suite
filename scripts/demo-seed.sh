#!/usr/bin/env bash
# Popula dados demo via API nos 3 backends já rodando.
# Requer: curl, jq, uuidgen
# Uso: ./scripts/demo-seed.sh

set -euo pipefail

CORE="${CORE:-http://localhost:8080}"
ORDERS="${ORDERS:-http://localhost:3000}"
PAYMENTS="${PAYMENTS:-http://localhost:8000}"
CURL_OPTS="${CURL_OPTS:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✔${NC} $*"; }
fail() { echo -e "  ${RED}✘${NC} $*"; }
info() { echo -e "  ${CYAN}▸${NC} $*"; }

echo ""
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Fluxe B2B Suite — Demo Seed${NC}"
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
echo ""

# ── Verificar health ──
echo -e "${BOLD}Verificando serviços...${NC}"
check_health() {
  local name="$1" url="$2"
  if curl $CURL_OPTS -sf --max-time 5 "$url" >/dev/null 2>&1; then
    ok "$name OK"
  else
    fail "$name não respondeu em $url"
    echo "  Suba o ambiente primeiro: ./scripts/up-all.sh --no-front"
    exit 1
  fi
}
check_health "spring-saas-core"    "$CORE/actuator/health/liveness"
check_health "node-b2b-orders"     "$ORDERS/v1/healthz"
check_health "py-payments-ledger"  "$PAYMENTS/healthz"
echo ""

# ── Tokens de autenticação ──
echo -e "${BOLD}[1/6] Gerando tokens de operação...${NC}"
JSON="Content-Type: application/json"
SEED_EMAIL="${SEED_EMAIL:-ops@demo.example.com}"
SEED_PASSWORD="${SEED_PASSWORD:?Defina SEED_PASSWORD}"
SEED_TENANT="${SEED_TENANT:-00000000-0000-0000-0000-000000000002}"
TENANT="X-Tenant-Id: $SEED_TENANT"

ORDERS_TOKEN=$(curl $CURL_OPTS -sf -X POST "$ORDERS/v1/auth/token" \
  -H "$JSON" \
  -d "{\"email\":\"$SEED_EMAIL\",\"password\":\"$SEED_PASSWORD\",\"tenantId\":\"$SEED_TENANT\"}" \
  | jq -r '.access_token')

if [ -z "$ORDERS_TOKEN" ] || [ "$ORDERS_TOKEN" = "null" ]; then
  fail "Não foi possível gerar token do node-b2b-orders."
  exit 1
fi
ok "Token node-b2b-orders OK"

PAY_TOKEN=$(curl $CURL_OPTS -sf -X POST "$PAYMENTS/v1/auth/token" \
  -H "$JSON" \
  -d "{\"email\":\"$SEED_EMAIL\",\"password\":\"$SEED_PASSWORD\",\"tenantId\":\"$SEED_TENANT\"}" \
  | jq -r '.access_token')

if [ -z "$PAY_TOKEN" ] || [ "$PAY_TOKEN" = "null" ]; then
  fail "Não foi possível gerar token do py-payments-ledger."
  exit 1
fi
ok "Token py-payments-ledger OK"
echo ""

# ── Headers reutilizáveis ──
AUTH="Authorization: Bearer $ORDERS_TOKEN"
PAY_AUTH="Authorization: Bearer $PAY_TOKEN"

# A API limita as escritas por minuto: a carga espera a janela em vez de perder dados.
post_orders() {
  local path="$1" body="$2" out code attempt
  out=$(mktemp)
  for attempt in 1 2 3 4 5 6 7 8; do
    code=$(curl $CURL_OPTS -s -o "$out" -w '%{http_code}' -X POST "$ORDERS$path" \
      -H "$AUTH" -H "$TENANT" -H "$JSON" -H "Idempotency-Key: $(uuidgen)" -d "$body" || echo 000)
    [ "$code" = "429" ] || break
    sleep 10
  done
  cat "$out"
  rm -f "$out"
  case "$code" in
    2*) return 0 ;;
    *) echo "HTTP $code em $path" >&2; return 1 ;;
  esac
}

# ── Ajustar inventário dos produtos do catálogo ──
echo -e "${BOLD}[2/6] Ajustando inventário do catálogo...${NC}"
SKUS=("ELET-001:50" "ELET-002:30" "ELET-003:80" "ELET-004:120" "ELET-005:60"
      "ESCR-001:25" "ESCR-002:15" "ESCR-003:200" "ESCR-004:90" "ESCR-005:70"
      "IND-001:10" "IND-002:8" "IND-003:5" "IND-004:40" "IND-005:35"
      "SEG-001:45" "SEG-002:20" "SEG-003:55" "SEG-004:12" "SEG-005:18"
      "LIMP-001:15" "LIMP-002:10" "LIMP-003:7" "LIMP-004:150" "LIMP-005:65")

ADJUSTED=0
for entry in "${SKUS[@]}"; do
  sku="${entry%%:*}"
  qty="${entry##*:}"
  if post_orders "/v1/inventory/adjustments" "{\"sku\":\"$sku\",\"type\":\"IN\",\"qty\":$qty,\"reason\":\"demo-seed initial stock\"}" >/dev/null; then
    ADJUSTED=$((ADJUSTED + 1))
  else
    fail "Ajuste de inventário recusado: $sku"
  fi
done
ok "Inventário ajustado para $ADJUSTED SKUs"
echo ""

# ── Criar pedidos de demonstração ──
echo -e "${BOLD}[3/6] Criando pedidos de demonstração...${NC}"

create_order() {
  local customer="$1" items="$2" desc="$3"
  local resp
  resp=$(post_orders "/v1/orders" "{\"customerId\":\"$customer\",\"items\":$items}") || resp=""
  if [ -n "$resp" ]; then
    local oid status
    oid=$(echo "$resp" | jq -r '.id')
    status=$(echo "$resp" | jq -r '.status')
    info "$desc → $oid ($status)" >&2
    echo "$oid"
  fi
}

ORDER1=$(create_order "customer-acme-corp" \
  '[{"sku":"ELET-001","qty":2},{"sku":"ELET-003","qty":5}]' \
  "Pedido ACME Corp (notebooks + teclados)")

ORDER2=$(create_order "customer-globex-ltda" \
  '[{"sku":"ESCR-001","qty":3},{"sku":"ESCR-002","qty":1}]' \
  "Pedido Globex Ltda (cadeiras + mesa)")

ORDER3=$(create_order "customer-initech-sa" \
  '[{"sku":"SEG-001","qty":10},{"sku":"SEG-005","qty":2}]' \
  "Pedido Initech SA (câmeras + alarme)")

ORDER4=$(create_order "customer-umbrella-ind" \
  '[{"sku":"IND-003","qty":1},{"sku":"IND-004","qty":5}]' \
  "Pedido Umbrella Ind (empilhadeira + estantes)")

ORDER5=$(create_order "customer-wayne-ent" \
  '[{"sku":"LIMP-001","qty":2},{"sku":"LIMP-002","qty":1}]' \
  "Pedido Wayne Enterprises (limpeza)")

echo ""

# ── Aguardar worker reservar e confirmar (CREATED → RESERVED → CONFIRMED) ──
echo -e "${BOLD}[4/6] Aguardando reserva e confirmando pedidos...${NC}"

order_status() {
  curl $CURL_OPTS -sf "$ORDERS/v1/orders/$1" -H "$AUTH" -H "$TENANT" | jq -r '.status' 2>/dev/null || echo "?"
}

wait_status() {
  local oid="$1" expected="$2" attempts="$3" i
  for ((i = 0; i < attempts; i++)); do
    [ "$(order_status "$oid")" = "$expected" ] && return 0
    sleep 1
  done
  return 1
}

CONFIRMED=()
for oid in $ORDER1 $ORDER2 $ORDER3; do
  if ! wait_status "$oid" "RESERVED" 30; then
    fail "Pedido $oid não foi reservado: $(order_status "$oid")"
    continue
  fi
  if post_orders "/v1/orders/$oid/confirm" '{}' >/dev/null; then
    CONFIRMED+=("$oid")
  else
    fail "Confirmação recusada: $oid"
  fi
done
ok "${#CONFIRMED[@]} pedidos confirmados (os demais ficam em reserva para demonstração)"
echo ""

# ── Aguardar o pagamento: a confirmação gera a cobrança, como numa compra real ──
echo -e "${BOLD}[5/6] Aguardando pagamento dos pedidos confirmados...${NC}"
PAID=0
for oid in "${CONFIRMED[@]}"; do
  if wait_status "$oid" "PAID" 90; then
    PAID=$((PAID + 1))
    info "Pedido $oid pago"
  else
    fail "Pedido $oid não foi pago: $(order_status "$oid")"
  fi
done
ok "$PAID pedidos pagos"
echo ""

# ── Conferir pagamentos e ledger ──
echo -e "${BOLD}[6/6] Conferindo pagamentos e ledger...${NC}"
PAYMENTS_TOTAL=$(curl $CURL_OPTS -sf "$PAYMENTS/v1/payment-intents" -H "$PAY_AUTH" -H "$TENANT" | jq 'if type == "array" then length else (.total // (.items | length)) end' 2>/dev/null || echo "?")
ok "$PAYMENTS_TOTAL pagamentos no locatário"
ENTRIES=$(curl $CURL_OPTS -sf "$PAYMENTS/v1/ledger/entries" -H "$PAY_AUTH" -H "$TENANT" | jq 'if type == "array" then length else (.total // (.items | length)) end' 2>/dev/null || echo "?")
ok "$ENTRIES entradas no ledger"
BALANCES=$(curl $CURL_OPTS -sf "$PAYMENTS/v1/ledger/balances" -H "$PAY_AUTH" -H "$TENANT" | jq 'if type == "array" then length else (.total // (.items | length)) end' 2>/dev/null || echo "?")
ok "$BALANCES contas no balanço"
echo ""

if [ "$ADJUSTED" -ne "${#SKUS[@]}" ] || [ "${#CONFIRMED[@]}" -ne 3 ] || [ "$PAID" -ne 3 ]; then
  fail "Carga incompleta: $ADJUSTED/${#SKUS[@]} ajustes, ${#CONFIRMED[@]}/3 confirmados, $PAID/3 pagos."
  exit 1
fi

# ── Resumo ──
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
ok "Demo seed concluído!"
echo ""
echo "  Dados criados:"
echo "    • Inventário ajustado para 25 produtos"
echo "    • 5 pedidos (3 pagos, 2 em reserva)"
echo "    • 1 pagamento por pedido pago, gerado pela confirmação"
echo "    • Entradas no ledger contábil"
echo ""
echo "  Explore a API:"
echo "    • Produtos:  curl -s $ORDERS/v1/products -H 'Authorization: Bearer TOKEN' -H 'X-Tenant-Id: 00000000-0000-0000-0000-000000000002'"
echo "    • Pedidos:   curl -s $ORDERS/v1/orders   -H 'Authorization: Bearer TOKEN' -H 'X-Tenant-Id: 00000000-0000-0000-0000-000000000002'"
echo "    • Pagamentos: curl -s $PAYMENTS/v1/payment-intents -H 'Authorization: Bearer TOKEN' -H 'X-Tenant-Id: 00000000-0000-0000-0000-000000000002'"
echo "    • Ledger:    curl -s $PAYMENTS/v1/ledger/entries -H 'Authorization: Bearer TOKEN' -H 'X-Tenant-Id: 00000000-0000-0000-0000-000000000002'"
echo ""
echo "  Swagger UI:"
echo "    • http://localhost:8080/swagger-ui.html"
echo "    • http://localhost:3000/docs"
echo "    • http://localhost:8000/docs"
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
