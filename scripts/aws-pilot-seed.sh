#!/usr/bin/env bash
# Alimenta o piloto AWS com massa de dados em Core, Orders e Payments.
#
# Uso:
#   source .aws-deploy/last-ec2.env
#   ./scripts/aws-pilot-seed.sh
#
# O que faz:
#   1. Payments: seed_realistic_data.py no container (20+ intents plataforma + 12 demo)
#   2. Demo API: demo-seed.sh contra URLs HTTPS do piloto (inventário + pedidos + pagamentos)
#   3. Resumo de contagens por serviço
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -f "$SUITE_ROOT/.aws-deploy/last-ec2.env" ]]; then
  # shellcheck disable=SC1091
  source "$SUITE_ROOT/.aws-deploy/last-ec2.env"
fi

FLUXE_HOST="${PUBLIC_IP:-${FLUXE_HOST:-}}"
FLUXE_KEY="${KEY_FILE:-${FLUXE_KEY:-$HOME/.ssh/fluxe-b2b-deploy.pem}}"
PILOT_DOMAIN="${PILOT_DOMAIN:-}"
BASE="${PILOT_BASE_URL:-}"

if [[ -z "$BASE" && -n "$PILOT_DOMAIN" ]]; then
  BASE="https://${PILOT_DOMAIN}"
elif [[ -z "$BASE" && -n "$FLUXE_HOST" ]]; then
  BASE="http://${FLUXE_HOST}"
fi

if [[ -z "$FLUXE_HOST" ]]; then
  echo "Defina PUBLIC_IP ou FLUXE_HOST (source .aws-deploy/last-ec2.env)." >&2
  exit 1
fi

BASE="${BASE%/}"
SSH=(ssh -i "$FLUXE_KEY" -o StrictHostKeyChecking=accept-new "ec2-user@${FLUXE_HOST}")
COMPOSE_DIR="/opt/fluxe/fluxe-b2b-suite"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✔${NC} $*"; }
info() { echo -e "  ${CYAN}▸${NC} $*"; }

echo ""
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Piloto AWS — massa de dados${NC}"
echo -e "${BOLD}  $BASE${NC}"
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
echo ""

info "[1/3] Payments — seed_realistic_data.py na EC2..."
"${SSH[@]}" bash <<REMOTE
set -euo pipefail
cd ${COMPOSE_DIR}
COMPOSE="\$(command -v docker-compose || echo docker-compose)"
CF="-f docker-compose.prod.yml -f docker-compose.prod.pilot.yml"
if [[ -f docker-compose.prod.build.yml ]]; then
  CF="\$CF -f docker-compose.prod.build.yml"
fi
sudo \$COMPOSE \$CF exec -T payments-api python /app/scripts/seed_realistic_data.py
REMOTE
ok "Payments realistic seed aplicado"

info "[2/3] Demo API — pedidos, inventário e pagamentos extras (tenant demo)..."
export CORE="${BASE}/api/core"
export ORDERS="${BASE}/api/orders"
export PAYMENTS="${BASE}/api/payments"
export SEED_PASSWORD=ops123
export SEED_EMAIL=ops@demo.example.com
export SEED_TENANT=00000000-0000-0000-0000-000000000002
export CURL_OPTS="-sk"
"$SCRIPT_DIR/demo-seed.sh" || true
ok "Demo seed via API concluído"

info "[3/3] Contagens..."
TENANT="00000000-0000-0000-0000-000000000002"
CORE_TOKEN=$(curl -sk -X POST "${BASE}/api/core/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@local","password":"admin123"}' | jq -r '.access_token')
ORDERS_TOKEN=$(curl -sk -X POST "${BASE}/api/orders/v1/auth/token" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"ops@demo.example.com\",\"password\":\"ops123\",\"tenantId\":\"$TENANT\"}" | jq -r '.access_token')
PAY_TOKEN=$(curl -sk -X POST "${BASE}/api/payments/v1/auth/token" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"ops@demo.example.com\",\"password\":\"ops123\",\"tenantId\":\"$TENANT\"}" | jq -r '.access_token')

CORE_TENANTS=$(curl -sk -H "Authorization: Bearer $CORE_TOKEN" "${BASE}/api/core/v1/tenants" | jq '.items | length')
CORE_USERS=$(curl -sk -H "Authorization: Bearer $CORE_TOKEN" "${BASE}/api/core/v1/users" | jq 'if type=="array" then length else (.content|length // .items|length // 0) end')
ORDERS_PRODUCTS=$(curl -sk -H "Authorization: Bearer $ORDERS_TOKEN" -H "X-Tenant-Id: $TENANT" "${BASE}/api/orders/v1/products" | jq '.data | length')
ORDERS_ORDERS=$(curl -sk -H "Authorization: Bearer $ORDERS_TOKEN" -H "X-Tenant-Id: $TENANT" "${BASE}/api/orders/v1/orders" | jq '.data | length')
PAY_INTENTS=$(curl -sk -H "Authorization: Bearer $PAY_TOKEN" -H "X-Tenant-Id: $TENANT" "${BASE}/api/payments/v1/payment-intents" | jq '.total // (.data|length)')
PAY_LEDGER=$(curl -sk -H "Authorization: Bearer $PAY_TOKEN" -H "X-Tenant-Id: $TENANT" "${BASE}/api/payments/v1/ledger/entries" | jq 'if type=="array" then length else (.data|length // 0) end')

echo ""
echo -e "${BOLD}Resumo (tenant demo ${TENANT}):${NC}"
printf "  Core:     %s tenants, %s users\n" "$CORE_TENANTS" "$CORE_USERS"
printf "  Orders:   %s produtos, %s pedidos\n" "$ORDERS_PRODUCTS" "$ORDERS_ORDERS"
printf "  Payments: %s payment intents, %s ledger entries\n" "$PAY_INTENTS" "$PAY_LEDGER"
echo ""
echo -e "${BOLD}Logins para teste:${NC}"
echo "  Admin:  $BASE/admin/  → admin@local / admin123"
echo "  Ops:    $BASE/ops/     → ops@demo.example.com / ops123"
echo "  Shop:   $BASE/"
echo ""
ok "Massa de dados do piloto aplicada."
