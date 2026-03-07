#!/usr/bin/env bash
# Popula dados demo via API nos 3 backends já rodando.
# Requer: curl, jq, uuidgen
# Uso: ./scripts/demo-seed.sh

set -euo pipefail

CORE="http://localhost:8080"
ORDERS="http://localhost:3000"
PAYMENTS="http://localhost:8000"

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
for svc in "$CORE/actuator/health/liveness:spring-saas-core" \
           "$ORDERS/v1/healthz:node-b2b-orders" \
           "$PAYMENTS/healthz:py-payments-ledger"; do
  url="${svc%%:*}"
  name="${svc##*:}"
  if curl -sf --max-time 5 "$url" >/dev/null 2>&1; then
    ok "$name OK"
  else
    fail "$name não respondeu em $url"
    echo "  Suba o ambiente primeiro: ./scripts/up-all.sh --no-front"
    exit 1
  fi
done
echo ""

# ── Token do spring-saas-core (global, aceito por todos) ──
echo -e "${BOLD}[1/6] Gerando token de operação...${NC}"
TOKEN=$(curl -sf -X POST "$CORE/v1/dev/token" \
  -H "Content-Type: application/json" \
  -d '{
    "sub": "ops@demo.example.com",
    "tid": "00000000-0000-0000-0000-000000000002",
    "roles": ["ops"],
    "perms": ["orders:write","orders:read","inventory:read","inventory:write","products:read","products:write","payments:write","payments:read","ledger:read"],
    "plan": "pro",
    "region": "region-a"
  }' | jq -r '.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  fail "Não foi possível gerar token. Verifique o spring-saas-core."
  exit 1
fi
ok "Token gerado"
echo ""

# ── Headers reutilizáveis ──
AUTH="Authorization: Bearer $TOKEN"
TENANT="X-Tenant-Id: tenant_demo"
JSON="Content-Type: application/json"

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
  resp=$(curl -sf -X POST "$ORDERS/v1/inventory/adjust" \
    -H "$AUTH" -H "$TENANT" -H "$JSON" \
    -d "{\"sku\":\"$sku\",\"delta\":$qty,\"reason\":\"demo-seed initial stock\"}" 2>/dev/null) && ((ADJUSTED++)) || true
done
ok "Inventário ajustado para $ADJUSTED SKUs"
echo ""

# ── Criar pedidos de demonstração ──
echo -e "${BOLD}[3/6] Criando pedidos de demonstração...${NC}"

create_order() {
  local customer="$1" items="$2" desc="$3"
  local idem
  idem=$(uuidgen)
  local resp
  resp=$(curl -sf -X POST "$ORDERS/v1/orders" \
    -H "$AUTH" -H "$TENANT" -H "$JSON" \
    -H "Idempotency-Key: $idem" \
    -d "{\"customerId\":\"$customer\",\"items\":$items}" 2>/dev/null)
  if [ -n "$resp" ]; then
    local oid status
    oid=$(echo "$resp" | jq -r '.id')
    status=$(echo "$resp" | jq -r '.status')
    info "$desc → $oid ($status)"
    echo "$oid"
  fi
}

ORDER1=$(create_order "customer-acme-corp" \
  '[{"sku":"ELET-001","qty":2,"price":4899.90},{"sku":"ELET-003","qty":5,"price":489.90}]' \
  "Pedido ACME Corp (notebooks + teclados)")

ORDER2=$(create_order "customer-globex-ltda" \
  '[{"sku":"ESCR-001","qty":3,"price":2199.00},{"sku":"ESCR-002","qty":1,"price":3499.00}]' \
  "Pedido Globex Ltda (cadeiras + mesa)")

ORDER3=$(create_order "customer-initech-sa" \
  '[{"sku":"SEG-001","qty":10,"price":599.90},{"sku":"SEG-005","qty":2,"price":2199.00}]' \
  "Pedido Initech SA (câmeras + alarme)")

ORDER4=$(create_order "customer-umbrella-ind" \
  '[{"sku":"IND-003","qty":1,"price":4599.00},{"sku":"IND-004","qty":5,"price":689.90}]' \
  "Pedido Umbrella Ind (empilhadeira + estantes)")

ORDER5=$(create_order "customer-wayne-ent" \
  '[{"sku":"LIMP-001","qty":2,"price":3299.00},{"sku":"LIMP-002","qty":1,"price":2499.00}]' \
  "Pedido Wayne Enterprises (limpeza)")

echo ""

# ── Aguardar worker reservar (CREATED → RESERVED) ──
echo -e "${BOLD}[4/6] Aguardando worker reservar inventário...${NC}"
sleep 5

CONFIRMED=0
for oid in $ORDER1 $ORDER2 $ORDER3; do
  [ -z "$oid" ] && continue
  status=$(curl -sf "$ORDERS/v1/orders/$oid" -H "$AUTH" -H "$TENANT" | jq -r '.status' 2>/dev/null || echo "?")
  if [ "$status" = "RESERVED" ]; then
    curl -sf -X PATCH "$ORDERS/v1/orders/$oid/confirm" \
      -H "$AUTH" -H "$TENANT" >/dev/null 2>&1 && ((CONFIRMED++)) || true
  fi
done
ok "$CONFIRMED pedidos confirmados (restantes ficam RESERVED/CREATED para demonstração)"
echo ""

# ── Criar payment intents ──
echo -e "${BOLD}[5/6] Criando payment intents...${NC}"

PAY_TOKEN=$(curl -sf -X POST "$PAYMENTS/v1/auth/token" \
  -H "$JSON" \
  -d '{"email":"ops@demo.example.com","password":"ops123","tenantId":"tenant_demo"}' \
  | jq -r '.access_token' 2>/dev/null)

if [ -z "$PAY_TOKEN" ] || [ "$PAY_TOKEN" = "null" ]; then
  fail "Não foi possível gerar token de pagamento"
else
  PAY_AUTH="Authorization: Bearer $PAY_TOKEN"

  create_payment() {
    local amount="$1" desc="$2" ref="$3"
    local idem
    idem=$(uuidgen)
    local resp
    resp=$(curl -sf -X POST "$PAYMENTS/v1/payment-intents" \
      -H "$PAY_AUTH" -H "$TENANT" -H "$JSON" \
      -H "Idempotency-Key: $idem" \
      -d "{\"amount\":$amount,\"currency\":\"BRL\",\"description\":\"$desc\",\"reference\":\"$ref\"}" 2>/dev/null)
    if [ -n "$resp" ]; then
      local pid status
      pid=$(echo "$resp" | jq -r '.id')
      status=$(echo "$resp" | jq -r '.status')
      info "$desc → R\$ $amount ($status)"
      echo "$pid"
    fi
  }

  PI1=$(create_payment "12249.30" "Pedido ACME Corp" "${ORDER1:-demo-order-1}")
  PI2=$(create_payment "10096.00" "Pedido Globex Ltda" "${ORDER2:-demo-order-2}")
  PI3=$(create_payment "10397.00" "Pedido Initech SA" "${ORDER3:-demo-order-3}")

  SETTLED=0
  for pid in $PI1 $PI2; do
    [ -z "$pid" ] && continue
    curl -sf -X POST "$PAYMENTS/v1/payment-intents/$pid/confirm" \
      -H "$PAY_AUTH" -H "$TENANT" >/dev/null 2>&1 && ((SETTLED++)) || true
  done
  ok "$SETTLED pagamentos confirmados (worker fará settle automático)"
fi
echo ""

# ── Aguardar settlement ──
echo -e "${BOLD}[6/6] Aguardando worker liquidar pagamentos...${NC}"
sleep 8

if [ -n "${PAY_TOKEN:-}" ]; then
  ENTRIES=$(curl -sf "$PAYMENTS/v1/ledger/entries" \
    -H "$PAY_AUTH" -H "$TENANT" 2>/dev/null | jq 'length' 2>/dev/null || echo "0")
  ok "$ENTRIES entradas no ledger"

  BALANCES=$(curl -sf "$PAYMENTS/v1/ledger/balances" \
    -H "$PAY_AUTH" -H "$TENANT" 2>/dev/null | jq 'length' 2>/dev/null || echo "0")
  ok "$BALANCES contas no balanço"
fi
echo ""

# ── Resumo ──
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
ok "Demo seed concluído!"
echo ""
echo "  Dados criados:"
echo "    • Inventário ajustado para 25 produtos"
echo "    • 5 pedidos (3 confirmados, 2 em reserva)"
echo "    • 3 payment intents (2 confirmados → settled)"
echo "    • Entradas no ledger contábil"
echo ""
echo "  Explore a API:"
echo "    • Produtos:  curl -s $ORDERS/v1/products -H 'Authorization: Bearer TOKEN' -H 'X-Tenant-Id: tenant_demo'"
echo "    • Pedidos:   curl -s $ORDERS/v1/orders   -H 'Authorization: Bearer TOKEN' -H 'X-Tenant-Id: tenant_demo'"
echo "    • Pagamentos: curl -s $PAYMENTS/v1/payment-intents -H 'Authorization: Bearer TOKEN' -H 'X-Tenant-Id: tenant_demo'"
echo "    • Ledger:    curl -s $PAYMENTS/v1/ledger/entries -H 'Authorization: Bearer TOKEN' -H 'X-Tenant-Id: tenant_demo'"
echo ""
echo "  Swagger UI:"
echo "    • http://localhost:8080/swagger-ui.html"
echo "    • http://localhost:3000/docs"
echo "    • http://localhost:8000/docs"
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
