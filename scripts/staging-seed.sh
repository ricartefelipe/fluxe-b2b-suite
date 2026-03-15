#!/usr/bin/env bash
# Alimenta o ambiente STAGING com dados para testes (migrations + seeds).
# Uso:
#   ./scripts/staging-seed.sh railway   — executa seeds nos repos irmãos via Railway CLI (staging)
#   ./scripts/staging-seed.sh           — mostra instruções e uso
#
# Pré-requisitos para "railway":
#   - Railway CLI instalado e logado
#   - Cada repo irmão (node-b2b-orders, py-payments-ledger) linkado ao projeto STAGING no Railway
#   - spring-saas-core: seed roda sozinho no deploy (SPRING_PROFILES_ACTIVE=staging)
# Ver: docs/AMBIENTES-CONFIGURACAO.md e docs/DEPLOY-RAILWAY.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WKS_ROOT="$(cd "$REPO_ROOT/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✔${NC} $*"; }
fail() { echo -e "  ${RED}✘${NC} $*"; }
info() { echo -e "  ${CYAN}▸${NC} $*"; }

usage() {
  echo ""
  echo -e "${BOLD}Staging — alimentar com dados${NC}"
  echo ""
  echo "  Uso:"
  echo "    ./scripts/staging-seed.sh railway   — roda migrations + seeds em node-b2b-orders e py-payments-ledger no Railway (projeto Staging)"
  echo "    ./scripts/staging-seed.sh           — mostra esta ajuda"
  echo ""
  echo "  spring-saas-core: seed já roda no deploy quando SPRING_PROFILES_ACTIVE=staging (Liquibase contexts: staging,seed)."
  echo "  node-b2b-orders:  migration + prisma db seed (tenant_demo, produtos, pedidos base)."
  echo "  py-payments-ledger: alembic upgrade + python -m src.infrastructure.db.seed"
  echo ""
  echo "  Repos irmãos esperados: $WKS_ROOT/node-b2b-orders, $WKS_ROOT/py-payments-ledger"
  echo ""
  echo "  Se 'railway run' falhar com Can't reach database (postgres.railway.internal), use DATABASE_PUBLIC_URL:"
  echo "  Variável fica no serviço Postgres do projeto Railway. Ver config/env/README.md § Seed de staging a partir da máquina."
  echo "  Documentação: docs/AMBIENTES-CONFIGURACAO.md, docs/DEPLOY-RAILWAY.md"
  echo ""
}

run_railway_seed() {
  if ! command -v railway >/dev/null 2>&1; then
    fail "Railway CLI não encontrado. Instale: npm install -g @railway/cli"
    exit 1
  fi

  ORDERS_REPO="$WKS_ROOT/node-b2b-orders"
  PAYMENTS_REPO="$WKS_ROOT/py-payments-ledger"

  for dir in "$ORDERS_REPO" "$PAYMENTS_REPO"; do
    if [ ! -d "$dir" ]; then
      fail "Diretório não encontrado: $dir"
      exit 1
    fi
  done

  echo ""
  echo -e "${BOLD}[1/2] node-b2b-orders — migrate + seed${NC}"
  (cd "$ORDERS_REPO" && railway run npx prisma migrate deploy && railway run npx prisma db seed)
  ok "node-b2b-orders concluído"
  echo ""

  echo -e "${BOLD}[2/2] py-payments-ledger — migrate + seed${NC}"
  (cd "$PAYMENTS_REPO" && railway run alembic upgrade head && railway run python -m src.infrastructure.db.seed)
  ok "py-payments-ledger concluído"
  echo ""

  echo -e "${BOLD}══════════════════════════════════════════════${NC}"
  ok "Staging seed (Railway) concluído."
  echo "  spring-saas-core: seed aplicado no deploy (profile staging)."
  echo "  Para dados extras (pedidos, payment intents, inventário): use demo-seed.sh contra as URLs de staging (CORE, ORDERS, PAYMENTS)."
  echo -e "${BOLD}══════════════════════════════════════════════${NC}"
  echo ""
}

case "${1:-}" in
  railway) run_railway_seed ;;
  "")     usage ;;
  *)      usage; exit 0 ;;
esac
