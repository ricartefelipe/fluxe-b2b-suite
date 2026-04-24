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
  echo "  node-b2b-orders:  migration + prisma db seed (00000000-0000-0000-0000-000000000002, produtos, pedidos base)."
  echo "  py-payments-ledger: alembic upgrade + python -m src.infrastructure.db.seed"
  echo ""
  echo "  Repos irmãos esperados: $WKS_ROOT/node-b2b-orders, $WKS_ROOT/py-payments-ledger"
  echo ""
  echo "  O modo 'railway' liga ao serviço Postgres, obtém DATABASE_PUBLIC_URL e corre migrate/seed na"
  echo "  tua máquina (rede pública). Não precisa copiar URL do painel."
  echo "  Documentação: docs/AMBIENTES-CONFIGURACAO.md, docs/DEPLOY-RAILWAY.md, config/env/README.md"
  echo ""
}

# Lê DATABASE_PUBLIC_URL do serviço Postgres (staging) e exporta DATABASE_URL para comandos locais.
# Motivo: railway run com DATABASE_URL interna (postgres.railway.internal) não resolve fora da rede Railway.
railway_export_public_database_url() {
  local pub
  railway service link Postgres
  pub="$(railway run printenv DATABASE_PUBLIC_URL)"
  if [ -z "${pub}" ]; then
    fail "DATABASE_PUBLIC_URL vazio. No Railway: serviço Postgres → Variables → confirme DATABASE_PUBLIC_URL."
    exit 1
  fi
  export DATABASE_URL="$pub"
}

# Payments espera postgresql+psycopg:// no Settings; Alembic/seed aceitam o mesmo prefixo.
railway_export_public_database_url_payments() {
  local pub
  railway service link Postgres
  pub="$(railway run printenv DATABASE_PUBLIC_URL)"
  if [ -z "${pub}" ]; then
    fail "DATABASE_PUBLIC_URL vazio."
    exit 1
  fi
  if [[ "$pub" == postgresql://* ]]; then
    export DATABASE_URL="postgresql+psycopg://${pub#postgresql://}"
  else
    export DATABASE_URL="$pub"
  fi
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

  info "Ativar ambiente staging e usar DATABASE_PUBLIC_URL do Postgres (sem colar URL à mão)."
  (cd "$ORDERS_REPO" && railway environment staging)

  echo ""
  echo -e "${BOLD}[1/2] node-b2b-orders — migrate + seed${NC}"
  (
    cd "$ORDERS_REPO"
    railway_export_public_database_url
    railway service link node-b2b-orders
    npx prisma migrate deploy
    npx prisma db seed
  )
  ok "node-b2b-orders concluído"
  echo ""

  echo -e "${BOLD}[2/2] py-payments-ledger — migrate + seed${NC}"
  (
    cd "$PAYMENTS_REPO"
    railway environment staging
    railway_export_public_database_url_payments
    railway service link py-payments-ledger
    if [ -d ".venv" ]; then
      # shellcheck disable=SC1091
      . .venv/bin/activate
    fi
    alembic upgrade head
    python -m src.infrastructure.db.seed
  )
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
