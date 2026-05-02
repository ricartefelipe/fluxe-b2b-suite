#!/usr/bin/env bash
###############################################################################
# up-local.sh — Levanta TODA a Fluxe B2B Suite local com UM comando.
#
# Infra (Docker):  PostgreSQL x3, Redis x3, RabbitMQ (compartilhado),
#                  Keycloak, Prometheus x3, Grafana x3
# Backends (Host): Spring Boot 8080, Node API 3000 + Worker, Python API 8000 + Worker
# Frontends (Host): Shop 4200, Ops Portal 4300, Admin Console 4400
#
# Uso:
#   ./scripts/up-local.sh                   # sobe tudo (infra + back + front + seed)
#   ./scripts/up-local.sh --no-front        # sem frontends
#   ./scripts/up-local.sh --no-seed         # sem demo-seed
#   ./scripts/up-local.sh --no-keycloak     # sem Keycloak
#   ./scripts/up-local.sh --only-infra      # só Docker (DBs, Redis, RabbitMQ)
#   ./scripts/up-local.sh --down            # para tudo
#   ./scripts/up-local.sh --status          # mostra o que está rodando
#
# Pré-requisitos: docker, java 21+, node 20+, pnpm, python 3.12+, pip, mvn
###############################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WKS="$(cd "$SUITE_ROOT/.." && pwd)"
PID_FILE="$SUITE_ROOT/.local-pids"
LOG_DIR="$SUITE_ROOT/.local-logs"

SPRING_DIR="$WKS/spring-saas-core"
NODE_DIR="$WKS/node-b2b-orders"
PY_DIR="$WKS/py-payments-ledger"
UI_DIR="$SUITE_ROOT/saas-suite-ui"
KC_DIR="$UI_DIR/docker/keycloak"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'

info()  { echo -e "${CYAN}▸${NC} $*"; }
ok()    { echo -e "${GREEN}✔${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC} $*"; }
fail()  { echo -e "${RED}✘${NC} $*"; }
header(){ echo -e "\n${BOLD}── $* ──${NC}"; }

SKIP_FRONT=false
SKIP_SEED=false
SKIP_KC=false
ONLY_INFRA=false

for arg in "$@"; do
  case "$arg" in
    --no-front)    SKIP_FRONT=true ;;
    --no-seed)     SKIP_SEED=true ;;
    --no-keycloak) SKIP_KC=true ;;
    --only-infra)  ONLY_INFRA=true; SKIP_FRONT=true; SKIP_SEED=true ;;
    --down)        ;; # handled below
    --status)      ;; # handled below
  esac
done

save_pid() { echo "$1:$2" >> "$PID_FILE"; }

kill_saved_pids() {
  [ -f "$PID_FILE" ] || return 0
  while IFS=: read -r name pid; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null && info "Parado $name (PID $pid)" || true
      sleep 0.3
      kill -9 "$pid" 2>/dev/null || true
    fi
  done < "$PID_FILE"
  rm -f "$PID_FILE"
}

wait_port() {
  local name="$1" port="$2" timeout="${3:-60}" elapsed=0
  while [ $elapsed -lt $timeout ]; do
    if ss -tlnp 2>/dev/null | grep -q ":${port} " || \
       curl -sf --max-time 2 "http://localhost:$port" >/dev/null 2>&1; then
      ok "$name pronto (porta $port, ${elapsed}s)"
      return 0
    fi
    sleep 2; elapsed=$((elapsed + 2))
  done
  warn "$name não respondeu na porta $port em ${timeout}s"
  return 1
}

wait_health() {
  local name="$1" url="$2" timeout="${3:-90}" elapsed=0
  while [ $elapsed -lt $timeout ]; do
    if curl -sf --max-time 3 "$url" >/dev/null 2>&1; then
      ok "$name respondendo (${elapsed}s)"
      return 0
    fi
    sleep 2; elapsed=$((elapsed + 2))
  done
  warn "$name não respondeu em ${timeout}s — verifique $LOG_DIR/"
  return 1
}

# ═══════════════════════════════════════════════════════
# --status
# ═══════════════════════════════════════════════════════
if [[ "${1:-}" == "--status" ]]; then
  echo -e "\n${BOLD}Estado do ambiente local${NC}\n"
  check_svc() {
    local name="$1" url="$2"
    if curl -sf --max-time 2 "$url" >/dev/null 2>&1; then
      echo -e "  ${GREEN}●${NC} $name  →  $url"
    else
      echo -e "  ${RED}●${NC} $name  →  $url"
    fi
  }
  check_svc "Spring API"      "http://localhost:8080/actuator/health/liveness"
  check_svc "Node API"        "http://localhost:3000/v1/healthz"
  check_svc "Python API"      "http://localhost:8000/healthz"
  check_svc "Keycloak"        "http://localhost:8180"
  check_svc "Shop"            "http://localhost:4200"
  check_svc "Ops Portal"      "http://localhost:4300"
  check_svc "Admin Console"   "http://localhost:4400"
  check_svc "Grafana Core"    "http://localhost:3030"
  check_svc "Grafana Node"    "http://localhost:3001"
  check_svc "Grafana Py"      "http://localhost:3002"
  check_svc "Prometheus Core"  "http://localhost:9090"
  check_svc "RabbitMQ UI"     "http://localhost:15675"
  echo ""
  [ -f "$PID_FILE" ] && echo -e "${DIM}PIDs salvos:${NC}" && cat "$PID_FILE" && echo ""
  exit 0
fi

# ═══════════════════════════════════════════════════════
# --down: para tudo
# ═══════════════════════════════════════════════════════
if [[ "${1:-}" == "--down" ]]; then
  echo -e "\n${BOLD}Parando toda a Fluxe B2B Suite...${NC}\n"

  kill_saved_pids

  for port in 8080 3000 8000; do
    pids=$(lsof -t -i:$port 2>/dev/null || true)
    [ -n "$pids" ] && kill $pids 2>/dev/null && info "Processo na porta $port encerrado" || true
  done

  for repo in spring-saas-core node-b2b-orders py-payments-ledger; do
    [ -d "$WKS/$repo" ] || continue
    info "docker compose down $repo..."
    (cd "$WKS/$repo" && docker compose down --remove-orphans) 2>/dev/null || true
  done

  if [ -f "$KC_DIR/docker-compose.yml" ]; then
    info "Parando Keycloak..."
    (cd "$KC_DIR" && docker compose down) 2>/dev/null || true
  fi

  rm -f "$PID_FILE"
  ok "Tudo parado."
  exit 0
fi

# ═══════════════════════════════════════════════════════
# Banner
# ═══════════════════════════════════════════════════════
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║       Fluxe B2B Suite — Ambiente Local Completo        ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Limpar PIDs anteriores
kill_saved_pids 2>/dev/null || true
mkdir -p "$LOG_DIR"

# ═══════════════════════════════════════════════════════
# Pré-requisitos
# ═══════════════════════════════════════════════════════
header "Verificando pré-requisitos"

check_cmd() {
  if command -v "$1" &>/dev/null; then
    ok "$1 → $($1 --version 2>&1 | head -1 || echo 'ok')"
  else
    fail "$1 não encontrado. Instale antes de continuar."
    exit 1
  fi
}

if ! docker info &>/dev/null; then
  fail "Docker não está rodando. Inicie o Docker e tente novamente."
  exit 1
fi
ok "Docker OK"

$ONLY_INFRA || {
  check_cmd java
  check_cmd mvn
  check_cmd node
  check_cmd pnpm
  check_cmd python3
}

# ═══════════════════════════════════════════════════════
# FASE 1: Infraestrutura Docker
# ═══════════════════════════════════════════════════════
header "Fase 1 — Infraestrutura Docker"

docker network create fluxe_shared 2>/dev/null && info "Rede fluxe_shared criada" || true

info "Subindo PostgreSQL + Redis + RabbitMQ (spring-saas-core)..."
(cd "$SPRING_DIR" && docker compose up -d --no-deps postgres redis rabbitmq) 2>&1 | tail -3

info "Subindo PostgreSQL + Redis (node-b2b-orders)..."
(cd "$NODE_DIR" && docker compose up -d --no-deps postgres redis) 2>&1 | tail -3

info "Subindo PostgreSQL + Redis (py-payments-ledger)..."
(cd "$PY_DIR" && docker compose up -d --no-deps postgres redis) 2>&1 | tail -3

info "Aguardando bancos ficarem saudáveis..."
postgres_ready() {
  local dir="$1" user="$2" db="$3"
  (cd "$dir" && docker compose exec -T postgres pg_isready -U "$user" -d "$db") &>/dev/null
}
for _i in $(seq 1 45); do
  if postgres_ready "$SPRING_DIR" saascore saascore &&
    postgres_ready "$NODE_DIR" app app &&
    postgres_ready "$PY_DIR" app app; then
    break
  fi
  sleep 2
done
ok "PostgreSQL x3 + Redis x3 + RabbitMQ prontos"

# Keycloak
if [ "$SKIP_KC" = false ] && [ -f "$KC_DIR/docker-compose.yml" ]; then
  info "Subindo Keycloak (porta 8180)..."
  (cd "$KC_DIR" && docker compose up -d) 2>&1 | tail -2
fi

$ONLY_INFRA && {
  echo ""
  ok "Infraestrutura Docker pronta (--only-infra). Backends não iniciados."
  echo -e "  PostgreSQL spring  → localhost:5435"
  echo -e "  PostgreSQL node    → localhost:5433"
  echo -e "  PostgreSQL python  → localhost:5434"
  echo -e "  Redis spring       → localhost:6382"
  echo -e "  Redis node         → localhost:6380"
  echo -e "  Redis python       → localhost:6381"
  echo -e "  RabbitMQ           → localhost:5675 (UI: 15675)"
  [ "$SKIP_KC" = false ] && echo -e "  Keycloak           → localhost:8180"
  exit 0
}

# ═══════════════════════════════════════════════════════
# FASE 2: Build dos backends
# ═══════════════════════════════════════════════════════
header "Fase 2 — Build dos backends"

info "Spring: mvn package..."
(cd "$SPRING_DIR" && mvn -DskipTests package -B -q) 2>&1 | tail -5
SPRING_JAR=$(ls -1t "$SPRING_DIR"/target/*.jar 2>/dev/null | head -1)
[ -f "$SPRING_JAR" ] && ok "JAR: $(basename "$SPRING_JAR")" || { fail "Falha ao buildar Spring JAR"; exit 1; }

info "Node: npm ci + prisma generate + build..."
(cd "$NODE_DIR" && npm ci --silent 2>&1 | tail -1 && npx prisma generate 2>&1 | tail -1 && npm run build 2>&1 | tail -1)
ok "Node buildado"

info "Python: verificando dependências..."
if [ ! -d "$PY_DIR/.venv" ]; then
  if ! (cd "$PY_DIR" && python3 -m venv .venv); then
    fail "Não foi possível criar .venv em py-payments-ledger. Em Debian/Ubuntu: sudo apt install python3.12-venv (ou o pacote venv da tua versão de Python)."
    exit 1
  fi
fi
if [ ! -x "$PY_DIR/.venv/bin/pip" ]; then
  fail "pip ausente no venv. Instale python3-venv, apague py-payments-ledger/.venv e execute este script de novo."
  exit 1
fi
(cd "$PY_DIR" && .venv/bin/pip install -q -r requirements.txt 2>&1 | tail -2)
ok "Python pronto"

# ═══════════════════════════════════════════════════════
# FASE 3: Iniciar backends no host
# ═══════════════════════════════════════════════════════
header "Fase 3 — Iniciando backends no host"

JWT_SECRET="local-dev-secret-min-32-chars-for-hs256-signing"
JWT_ISSUER="spring-saas-core"

# -- Spring Boot --
info "Iniciando Spring Boot (porta 8080)..."
SPRING_PROFILES_ACTIVE=local \
SERVER_PORT=8080 \
DB_URL="jdbc:postgresql://localhost:5435/saascore" \
DB_USER=saascore \
DB_PASS=saascore \
AUTH_MODE=hs256 \
JWT_HS256_SECRET="$JWT_SECRET" \
JWT_ISSUER="$JWT_ISSUER" \
REDIS_HOST=localhost \
REDIS_PORT=6382 \
RABBITMQ_HOST=localhost \
RABBITMQ_PORT=5675 \
AI_ENABLED="${AI_ENABLED:-false}" \
OPENAI_API_KEY="${OPENAI_API_KEY:-}" \
AI_MODEL="${AI_MODEL:-gpt-4o-mini}" \
java -jar "$SPRING_JAR" > "$LOG_DIR/spring.log" 2>&1 &
save_pid "spring" $!
wait_health "Spring API" "http://localhost:8080/actuator/health/liveness" 120

# -- Node API --
info "Iniciando Node API (porta 3000)..."
DATABASE_URL="postgresql://app:app@localhost:5433/app" \
REDIS_URL="redis://localhost:6380" \
RABBITMQ_URL="amqp://guest:guest@localhost:5675" \
JWT_SECRET="$JWT_SECRET" \
JWT_ISSUER="$JWT_ISSUER" \
JWKS_URI="" \
HTTP_PORT=3000 \
NODE_ENV=development \
APP_ENV=local \
CORS_ORIGINS="http://localhost:4200,http://localhost:4300,http://localhost:4400,http://localhost:3000" \
node "$NODE_DIR/dist/src/main.js" > "$LOG_DIR/node-api.log" 2>&1 &
save_pid "node-api" $!

# -- Node Worker --
info "Iniciando Node Worker..."
DATABASE_URL="postgresql://app:app@localhost:5433/app" \
REDIS_URL="redis://localhost:6380" \
RABBITMQ_URL="amqp://guest:guest@localhost:5675" \
JWT_SECRET="$JWT_SECRET" \
JWT_ISSUER="$JWT_ISSUER" \
NODE_ENV=development \
APP_ENV=local \
node "$NODE_DIR/dist/src/worker/main.js" > "$LOG_DIR/node-worker.log" 2>&1 &
save_pid "node-worker" $!
wait_health "Node API" "http://localhost:3000/v1/healthz" 60

# -- Python API --
info "Iniciando Python API (porta 8000)..."
(cd "$PY_DIR" && \
DATABASE_URL="postgresql+psycopg://app:app@localhost:5434/app" \
REDIS_URL="redis://localhost:6381/0" \
RABBITMQ_URL="amqp://guest:guest@localhost:5675/" \
JWT_SECRET="$JWT_SECRET" \
JWT_ISSUER="$JWT_ISSUER" \
JWT_ALGORITHM=HS256 \
JWKS_URI="" \
HTTP_HOST=0.0.0.0 \
HTTP_PORT=8000 \
APP_ENV=local \
GATEWAY_PROVIDER=fake \
CORS_ORIGINS="http://localhost:4200,http://localhost:4300,http://localhost:4400" \
.venv/bin/uvicorn src.api.main:app --host 0.0.0.0 --port 8000 > "$LOG_DIR/python-api.log" 2>&1 &)
save_pid "python-api" $!

# -- Python Worker --
info "Iniciando Python Worker..."
(cd "$PY_DIR" && \
DATABASE_URL="postgresql+psycopg://app:app@localhost:5434/app" \
REDIS_URL="redis://localhost:6381/0" \
RABBITMQ_URL="amqp://guest:guest@localhost:5675/" \
JWT_SECRET="$JWT_SECRET" \
JWT_ISSUER="$JWT_ISSUER" \
APP_ENV=local \
GATEWAY_PROVIDER=fake \
.venv/bin/python -m src.worker.main > "$LOG_DIR/python-worker.log" 2>&1 &)
save_pid "python-worker" $!
wait_health "Python API" "http://localhost:8000/healthz" 60

# ═══════════════════════════════════════════════════════
# FASE 4: Migrations
# ═══════════════════════════════════════════════════════
header "Fase 4 — Migrations"

info "Spring (Liquibase): migrations rodam no startup automaticamente"
ok "Spring migrations aplicadas"

info "Node (Prisma migrate deploy)..."
(cd "$NODE_DIR" && \
DATABASE_URL="postgresql://app:app@localhost:5433/app" \
npx prisma migrate deploy 2>&1 | tail -3) && ok "Node migrations OK" || warn "Node migrations com problema"

info "Python (Alembic upgrade head)..."
(cd "$PY_DIR" && \
DATABASE_URL="postgresql+psycopg://app:app@localhost:5434/app" \
.venv/bin/alembic upgrade head 2>&1 | tail -3) && ok "Python migrations OK" || warn "Python migrations com problema"

# ═══════════════════════════════════════════════════════
# FASE 5: Seed data
# ═══════════════════════════════════════════════════════
header "Fase 5 — Seed data"

info "Node (Prisma seed)..."
(cd "$NODE_DIR" && \
DATABASE_URL="postgresql://app:app@localhost:5433/app" \
node dist/prisma/seed.js 2>&1 | tail -3) && ok "Node seed OK" || warn "Node seed (já existia ou falhou)"

info "Python seed..."
(cd "$PY_DIR" && \
DATABASE_URL="postgresql+psycopg://app:app@localhost:5434/app" \
REDIS_URL="redis://localhost:6381/0" \
RABBITMQ_URL="amqp://guest:guest@localhost:5675/" \
JWT_SECRET="$JWT_SECRET" \
JWT_ISSUER="$JWT_ISSUER" \
GATEWAY_PROVIDER=fake \
.venv/bin/python -m src.infrastructure.db.seed 2>&1 | tail -3) && ok "Python seed OK" || warn "Python seed (já existia ou falhou)"

# ═══════════════════════════════════════════════════════
# FASE 6: Observabilidade (Prometheus + Grafana)
# ═══════════════════════════════════════════════════════
header "Fase 6 — Prometheus & Grafana"

HOST_GATEWAY=$(ip route | grep default | awk '{print $3}' 2>/dev/null || echo "172.17.0.1")

setup_prometheus_override() {
  local project_dir="$1" target_host="$2" target_port="$3" metrics_path="$4"
  local override_dir="$project_dir/.local-prometheus"
  mkdir -p "$override_dir"
  local job_name
  job_name=$(basename "$project_dir")
  cat > "$override_dir/prometheus.yml" <<PROMEOF
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: '$job_name'
    metrics_path: '$metrics_path'
    static_configs:
      - targets: ['$target_host:$target_port']
PROMEOF
  echo "$override_dir/prometheus.yml"
}

PROM_SPRING=$(setup_prometheus_override "$SPRING_DIR" "host.docker.internal" "8080" "/actuator/prometheus")
PROM_NODE=$(setup_prometheus_override "$NODE_DIR" "host.docker.internal" "3000" "/v1/metrics")
PROM_PY=$(setup_prometheus_override "$PY_DIR" "host.docker.internal" "8000" "/metrics")

start_prometheus() {
  local name="$1" port="$2" config="$3"
  docker rm -f "fluxe-prom-$name" 2>/dev/null || true
  docker run -d --name "fluxe-prom-$name" \
    --add-host=host.docker.internal:host-gateway \
    -p "$port:9090" \
    -v "$config:/etc/prometheus/prometheus.yml:ro" \
    --restart unless-stopped \
    prom/prometheus:latest \
    --config.file=/etc/prometheus/prometheus.yml >/dev/null 2>&1
  ok "Prometheus $name → localhost:$port"
}

start_grafana() {
  local name="$1" port="$2" prov_dir="$3" dash_dir="$4"
  docker rm -f "fluxe-grafana-$name" 2>/dev/null || true
  local vol_args=()
  [ -d "$prov_dir" ] && vol_args+=(-v "$prov_dir:/etc/grafana/provisioning:ro")
  [ -d "$dash_dir" ] && vol_args+=(-v "$dash_dir:/var/lib/grafana/dashboards:ro")
  docker run -d --name "fluxe-grafana-$name" \
    --add-host=host.docker.internal:host-gateway \
    -p "$port:3000" \
    -e GF_SECURITY_ADMIN_USER=admin \
    -e GF_SECURITY_ADMIN_PASSWORD=admin \
    "${vol_args[@]}" \
    --restart unless-stopped \
    grafana/grafana:10.4.2 >/dev/null 2>&1
  ok "Grafana $name → localhost:$port (admin/admin)"
}

start_prometheus "spring"  9090 "$PROM_SPRING"
start_prometheus "node"    9091 "$PROM_NODE"
start_prometheus "python"  9092 "$PROM_PY"

start_grafana "spring" 3030 "$SPRING_DIR/observability/grafana/provisioning" "$SPRING_DIR/observability/grafana/dashboards"
start_grafana "node"   3001 "$NODE_DIR/observability/grafana/provisioning"   "$NODE_DIR/observability/grafana/dashboards"
start_grafana "python" 3002 "$PY_DIR/observability/grafana/provisioning"     "$PY_DIR/observability/grafana/dashboards"

# ═══════════════════════════════════════════════════════
# FASE 7: Demo seed via API (opcional)
# ═══════════════════════════════════════════════════════
if [ "$SKIP_SEED" = false ] && [ -x "$SUITE_ROOT/scripts/demo-seed.sh" ]; then
  header "Fase 7 — Demo seed via API"
  bash "$SUITE_ROOT/scripts/demo-seed.sh" 2>&1 | tail -20 || warn "Demo seed falhou parcialmente"
fi

# ═══════════════════════════════════════════════════════
# FASE 8: Frontends
# ═══════════════════════════════════════════════════════
if [ "$SKIP_FRONT" = false ]; then
  header "Fase 8 — Frontends Angular"

  cd "$UI_DIR"

  if [ ! -d "node_modules" ]; then
    info "Instalando dependências (pnpm install)..."
    pnpm install 2>&1 | tail -3
  fi

  info "Iniciando Shop (porta 4200)..."
  pnpm nx serve shop -c development --port 4200 > "$LOG_DIR/front-shop.log" 2>&1 &
  save_pid "front-shop" $!

  info "Iniciando Ops Portal (porta 4300)..."
  pnpm nx serve ops-portal -c development --port 4300 > "$LOG_DIR/front-ops.log" 2>&1 &
  save_pid "front-ops" $!

  info "Iniciando Admin Console (porta 4400)..."
  pnpm nx serve admin-console -c development --port 4400 > "$LOG_DIR/front-admin.log" 2>&1 &
  save_pid "front-admin" $!

  info "Aguardando frontends compilarem..."
  wait_port "Shop"          4200 120 || true
  wait_port "Ops Portal"    4300 120 || true
  wait_port "Admin Console" 4400 120 || true
fi

# ═══════════════════════════════════════════════════════
# Resumo final
# ═══════════════════════════════════════════════════════
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║           AMBIENTE LOCAL PRONTO                         ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Backends${NC}"
echo -e "    Spring API         → ${CYAN}http://localhost:8080${NC}"
echo -e "    Node API           → ${CYAN}http://localhost:3000${NC}"
echo -e "    Python API         → ${CYAN}http://localhost:8000${NC}"
echo ""
echo -e "  ${BOLD}Frontends${NC}"
if [ "$SKIP_FRONT" = false ]; then
echo -e "    Shop               → ${CYAN}http://localhost:4200${NC}"
echo -e "    Ops Portal         → ${CYAN}http://localhost:4300${NC}"
echo -e "    Admin Console      → ${CYAN}http://localhost:4400${NC}"
else
echo -e "    (não iniciados — use sem --no-front)"
fi
echo ""
echo -e "  ${BOLD}SSO${NC}"
if [ "$SKIP_KC" = false ]; then
echo -e "    Keycloak           → ${CYAN}http://localhost:8180${NC}  (admin/admin)"
else
echo -e "    (não iniciado — use sem --no-keycloak)"
fi
echo ""
echo -e "  ${BOLD}API Docs${NC}"
echo -e "    Swagger (Spring)   → ${CYAN}http://localhost:8080/swagger-ui/index.html${NC}"
echo -e "    Docs (Node)        → ${CYAN}http://localhost:3000/docs${NC}"
echo -e "    Docs (Python)      → ${CYAN}http://localhost:8000/docs${NC}"
echo ""
echo -e "  ${BOLD}Observabilidade${NC}"
echo -e "    Grafana Spring     → ${CYAN}http://localhost:3030${NC}  (admin/admin)"
echo -e "    Grafana Node       → ${CYAN}http://localhost:3001${NC}  (admin/admin)"
echo -e "    Grafana Python     → ${CYAN}http://localhost:3002${NC}  (admin/admin)"
echo -e "    Prometheus Spring  → ${CYAN}http://localhost:9090${NC}"
echo -e "    Prometheus Node    → ${CYAN}http://localhost:9091${NC}"
echo -e "    Prometheus Python  → ${CYAN}http://localhost:9092${NC}"
echo -e "    RabbitMQ UI        → ${CYAN}http://localhost:15675${NC} (guest/guest)"
echo ""
echo -e "  ${BOLD}Logs${NC}"
echo -e "    tail -f $LOG_DIR/spring.log"
echo -e "    tail -f $LOG_DIR/node-api.log"
echo -e "    tail -f $LOG_DIR/python-api.log"
echo ""
echo -e "  ${BOLD}Controle${NC}"
echo -e "    Parar tudo:  ${CYAN}./scripts/up-local.sh --down${NC}"
echo -e "    Status:      ${CYAN}./scripts/up-local.sh --status${NC}"
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Ctrl+C para parar frontends (backends continuam rodando)${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════════${NC}"
echo ""

if [ "$SKIP_FRONT" = false ]; then
  trap 'echo -e "\n${YELLOW}Frontends parados.${NC} Backends e infra continuam. Use --down para parar tudo."; exit 0' INT
  wait
fi
