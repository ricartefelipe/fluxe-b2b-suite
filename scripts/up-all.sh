#!/usr/bin/env bash
# Sobe toda a Fluxe B2B Suite: backends (Docker) + frontend (Angular).
#
# Uso:
#   ./scripts/up-all.sh              # backends + escolhe frontend interativamente
#   ./scripts/up-all.sh shop         # backends + Shop
#   ./scripts/up-all.sh ops          # backends + Ops Portal
#   ./scripts/up-all.sh admin        # backends + Admin Console
#   ./scripts/up-all.sh --no-front   # só backends
#   ./scripts/up-all.sh --down       # para tudo
#
# Portas:
#   Spring API     → 8080    |  Node API     → 3000    |  Python API   → 8000
#   RabbitMQ UI    → 15672   |  Grafana Core → 3030    |  Keycloak     → 8180 (se ativo)
#   Shop           → 4200    |  Ops Portal   → 4300    |  Admin Console→ 4400

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WKS="$(cd "$SUITE_ROOT/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}▸${NC} $*"; }
ok()    { echo -e "${GREEN}✔${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC} $*"; }
fail()  { echo -e "${RED}✘${NC} $*"; }

# ─── --down: para tudo ───
if [[ "${1:-}" == "--down" ]]; then
  echo -e "\n${BOLD}Parando toda a suite...${NC}\n"
  for repo in spring-saas-core node-b2b-orders py-payments-ledger; do
    if [ -d "$WKS/$repo" ]; then
      info "Parando $repo..."
      ( cd "$WKS/$repo" && docker compose down ) 2>/dev/null || true
    fi
  done
  if [ -f "$SUITE_ROOT/saas-suite-ui/docker/keycloak/docker-compose.yml" ]; then
    info "Parando Keycloak..."
    ( cd "$SUITE_ROOT/saas-suite-ui/docker/keycloak" && docker compose down ) 2>/dev/null || true
  fi
  ok "Tudo parado."
  exit 0
fi

echo ""
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Fluxe B2B Suite — Ambiente Local${NC}"
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
echo ""

# ─── Docker ───
info "Verificando Docker..."
if ! docker info &>/dev/null; then
  fail "Docker inacessível."
  echo ""
  echo "  Possíveis soluções:"
  echo "    1) Abra o Docker Desktop"
  echo "    2) Ou use o Docker Engine:"
  echo "       sudo usermod -aG docker \$USER"
  echo "       (logout/login depois)"
  echo "    3) Se já está no grupo docker mas usa Docker Desktop:"
  echo "       docker context use default"
  exit 1
fi
ok "Docker OK"
echo ""

# ─── Rede compartilhada ───
docker network create fluxe_shared 2>/dev/null && ok "Rede fluxe_shared criada" || true

# ─── .env para Node e Python ───
RABBITMQ_SUITE_URL="amqp://guest:guest@fluxe-rabbitmq:5672"

for repo in node-b2b-orders py-payments-ledger; do
  dir="$WKS/$repo"
  [ -d "$dir" ] || continue
  if [ ! -f "$dir/.env" ] && [ -f "$dir/.env.example" ]; then
    cp "$dir/.env.example" "$dir/.env"
    info "Criado $repo/.env a partir de .env.example"
  fi
  if [ -f "$dir/.env" ] && grep -q 'JWT_SECRET=change-me' "$dir/.env" 2>/dev/null; then
    sed -i 's|JWT_SECRET=change-me|JWT_SECRET=local-dev-secret-min-32-chars-for-hs256-signing|' "$dir/.env"
    sed -i 's|JWT_ISSUER=local-auth|JWT_ISSUER=spring-saas-core|' "$dir/.env"
    info "JWT de $repo alinhado com spring-saas-core"
  fi
done
echo ""

# ─── Função: aguardar saúde ───
wait_health() {
  local name="$1" url="$2" timeout="${3:-90}"
  local elapsed=0
  while [ $elapsed -lt $timeout ]; do
    if curl -sf "$url" &>/dev/null; then
      ok "$name respondendo em ${elapsed}s"
      return 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done
  warn "$name não respondeu em ${timeout}s — verifique: docker compose logs -f"
  return 1
}

# ─── Backends ───
FAILED=""

echo -e "${BOLD}── [1/3] spring-saas-core ──${NC}"
if [ -d "$WKS/spring-saas-core" ]; then
  CORE_DIR="$WKS/spring-saas-core"
  if ( cd "$CORE_DIR" && mvn -q -DskipTests package -B ) 2>/dev/null; then
    info "JAR buildado no host; usando imagem com app.local.Dockerfile"
    ( cd "$CORE_DIR" && docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build ) || { fail "Erro ao subir Spring"; FAILED="$FAILED spring"; }
  else
    ( cd "$CORE_DIR" && docker compose up -d --build ) || { fail "Erro ao subir Spring"; FAILED="$FAILED spring"; }
  fi
  wait_health "Spring API" "http://localhost:8080/actuator/health/liveness" 120 || FAILED="$FAILED spring"
else
  warn "Pasta spring-saas-core não encontrada — pulando"
fi
echo ""

echo -e "${BOLD}── [2/3] node-b2b-orders ──${NC}"
if [ -d "$WKS/node-b2b-orders" ]; then
  ( cd "$WKS/node-b2b-orders" && RABBITMQ_URL="$RABBITMQ_SUITE_URL" docker compose up -d --build ) || { fail "Erro ao subir Node"; FAILED="$FAILED node"; }
  wait_health "Node API" "http://localhost:3000/v1/healthz" 90 || FAILED="$FAILED node"
  info "Rodando migrações e seed..."
  ( cd "$WKS/node-b2b-orders" && docker compose exec -T api npx prisma migrate deploy 2>/dev/null ) || true
  ( cd "$WKS/node-b2b-orders" && docker compose exec -T api npx prisma db seed 2>/dev/null ) || true
else
  warn "Pasta node-b2b-orders não encontrada — pulando"
fi
echo ""

echo -e "${BOLD}── [3/3] py-payments-ledger ──${NC}"
if [ -d "$WKS/py-payments-ledger" ]; then
  ( cd "$WKS/py-payments-ledger" && RABBITMQ_URL="$RABBITMQ_SUITE_URL" docker compose up -d --build ) || { fail "Erro ao subir Python"; FAILED="$FAILED python"; }
  wait_health "Python API" "http://localhost:8000/healthz" 90 || FAILED="$FAILED python"
  info "Rodando migrações e seed..."
  ( cd "$WKS/py-payments-ledger" && docker compose exec -T api env PYTHONPATH=/app alembic upgrade head 2>/dev/null ) || true
  ( cd "$WKS/py-payments-ledger" && docker compose exec -T api env PYTHONPATH=/app python -m src.infrastructure.db.seed 2>/dev/null ) || true
else
  warn "Pasta py-payments-ledger não encontrada — pulando"
fi
echo ""

# ─── Resumo backends ───
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
if [ -n "$FAILED" ]; then
  warn "Alguns serviços falharam:$FAILED"
  echo "  Verifique: cd ~/Documentos/wks/<repo> && docker compose logs -f"
else
  ok "Todos os backends rodando!"
fi
echo ""
echo -e "  ${BOLD}Spring API${NC}     → http://localhost:8080"
echo -e "  ${BOLD}Node API${NC}       → http://localhost:3000"
echo -e "  ${BOLD}Python API${NC}     → http://localhost:8000"
echo -e "  ${BOLD}RabbitMQ UI${NC}    → http://localhost:15675  (guest/guest)"
echo -e "  ${BOLD}Grafana${NC}        → http://localhost:3030   (admin/admin)"
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
echo ""

# ─── Frontend ───
if [[ "${1:-}" == "--no-front" ]]; then
  ok "Backends prontos. Frontend não iniciado (--no-front)."
  exit 0
fi

FRONTEND="${1:-}"

if [ -z "$FRONTEND" ]; then
  echo -e "${BOLD}Qual frontend deseja iniciar?${NC}"
  echo ""
  echo "  1) shop           → Loja B2B         (porta 4200)"
  echo "  2) ops             → Ops Portal       (porta 4300)"
  echo "  3) admin           → Admin Console    (porta 4400)"
  echo "  4) todos           → Os 3 em paralelo"
  echo "  5) nenhum          → Só backends"
  echo ""
  read -rp "Escolha [1-5]: " choice
  case "$choice" in
    1) FRONTEND="shop" ;;
    2) FRONTEND="ops" ;;
    3) FRONTEND="admin" ;;
    4) FRONTEND="all" ;;
    5) ok "Backends prontos. Até!"; exit 0 ;;
    *) FRONTEND="shop" ;;
  esac
fi

cd "$SUITE_ROOT/saas-suite-ui"

if ! command -v pnpm &>/dev/null; then
  info "Instalando pnpm..."
  npm i -g pnpm
fi

if [ ! -d "node_modules" ]; then
  info "Instalando dependências (pnpm install)..."
  pnpm install
fi

case "$FRONTEND" in
  shop)
    echo ""
    ok "Iniciando Shop → http://localhost:4200"
    exec pnpm nx serve shop -c development --port 4200
    ;;
  ops)
    echo ""
    ok "Iniciando Ops Portal → http://localhost:4300"
    exec pnpm nx serve ops-portal -c development --port 4300
    ;;
  admin)
    echo ""
    ok "Iniciando Admin Console → http://localhost:4400"
    exec pnpm nx serve admin-console -c development --port 4400
    ;;
  all)
    echo ""
    ok "Iniciando os 3 frontends em paralelo..."
    echo "  Shop           → http://localhost:4200"
    echo "  Ops Portal     → http://localhost:4300"
    echo "  Admin Console  → http://localhost:4400"
    echo ""
    echo "  Ctrl+C para parar todos os frontends."
    echo ""
    pnpm nx serve shop -c development --port 4200 &
    pnpm nx serve ops-portal -c development --port 4300 &
    pnpm nx serve admin-console -c development --port 4400 &
    wait
    ;;
  --no-front)
    ok "Backends prontos."
    ;;
  *)
    warn "Frontend desconhecido: $FRONTEND"
    exit 1
    ;;
esac
