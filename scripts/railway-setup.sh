#!/bin/bash
set -euo pipefail

# ============================================================
# Fluxe B2B Suite — Railway Setup Script
# ============================================================
# Este script cria toda a infraestrutura no Railway.
#
# Pré-requisitos:
#   1. railway CLI instalado: npm i -g @railway/cli
#   2. Logado: railway login
#
# Uso:
#   bash scripts/railway-setup.sh
# ============================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }

WKS_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SPRING_DIR="$WKS_ROOT/../spring-saas-core"
NODE_DIR="$WKS_ROOT/../node-b2b-orders"
PY_DIR="$WKS_ROOT/../py-payments-ledger"

JWT_SECRET=$(openssl rand -base64 32)

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   Fluxe B2B Suite — Railway Deploy Setup        ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# 1. Verificar login
info "Verificando login no Railway..."
if ! railway whoami 2>/dev/null; then
  warn "Não logado. Executando login..."
  railway login
fi
ok "Logado no Railway"

# 2. Criar projeto
info "Criando projeto 'fluxe-b2b-suite'..."
cd "$WKS_ROOT"
railway init --name fluxe-b2b-suite 2>/dev/null || true
ok "Projeto criado/vinculado"

PROJECT_ID=$(railway status --json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('projectId',''))" 2>/dev/null || echo "")

if [ -z "$PROJECT_ID" ]; then
  warn "Não consegui detectar o projectId. Continuando manualmente..."
fi

echo ""
info "JWT_SECRET gerado: $JWT_SECRET"
info "IMPORTANTE: Guarde esse secret! Será usado nos 3 backends."
echo ""

# 3. Criar serviços de banco de dados
echo "─────────────────────────────────────────────"
info "Agora vá ao dashboard do Railway e adicione:"
echo ""
echo "  1. PostgreSQL (+ New → Database → PostgreSQL)"
echo "  2. Redis (+ New → Database → Redis)"
echo "  3. (Opcional) Crie conta em cloudamqp.com para RabbitMQ"
echo ""
read -p "Pressione ENTER quando os bancos estiverem criados..."
echo ""

# 4. Deploy spring-saas-core
echo "─────────────────────────────────────────────"
info "Configurando spring-saas-core..."
if [ -d "$SPRING_DIR" ]; then
  cd "$SPRING_DIR"
  info "Conectando repo ao Railway..."
  echo ""
  echo "  No dashboard Railway:"
  echo "  1. + New → GitHub Repo → ricartefelipe/spring-saas-core"
  echo "  2. Configure o Root Directory: /"
  echo "  3. Adicione estas variáveis:"
  echo ""
  echo "  SPRING_PROFILES_ACTIVE=prod"
  echo "  SERVER_PORT=8080"
  echo "  AUTH_MODE=hs256"
  echo "  JWT_HS256_SECRET=$JWT_SECRET"
  echo "  JWT_ISSUER=spring-saas-core"
  echo "  APP_DEV_TOKEN_ENDPOINT_ENABLED=false"
  echo "  AI_ENABLED=false"
  echo ""
  echo "  DB_URL, DB_USER, DB_PASS → Referência ao PostgreSQL"
  echo "  REDIS_HOST, REDIS_PORT → Referência ao Redis"
  echo ""
  read -p "Pressione ENTER quando o serviço estiver configurado..."
  ok "spring-saas-core configurado"
else
  warn "Diretório spring-saas-core não encontrado em $SPRING_DIR"
fi

# 5. Deploy node-b2b-orders
echo "─────────────────────────────────────────────"
info "Configurando node-b2b-orders..."
if [ -d "$NODE_DIR" ]; then
  echo ""
  echo "  No dashboard Railway:"
  echo "  1. + New → GitHub Repo → ricartefelipe/node-b2b-orders"
  echo "  2. Configure o Dockerfile: docker/api.Dockerfile"
  echo "  3. Adicione estas variáveis:"
  echo ""
  echo "  NODE_ENV=production"
  echo "  HTTP_PORT=3000"
  echo "  JWT_SECRET=$JWT_SECRET"
  echo "  JWT_ISSUER=spring-saas-core"
  echo "  JWT_ALGORITHM=HS256"
  echo "  CORS_ORIGINS=<URLs dos frontends>"
  echo "  AUDIT_RETENTION_DAYS=90"
  echo ""
  echo "  DATABASE_URL → Referência ao PostgreSQL"
  echo "  REDIS_URL → Referência ao Redis"
  echo ""
  read -p "Pressione ENTER quando o serviço estiver configurado..."
  ok "node-b2b-orders configurado"
else
  warn "Diretório node-b2b-orders não encontrado em $NODE_DIR"
fi

# 6. Deploy py-payments-ledger
echo "─────────────────────────────────────────────"
info "Configurando py-payments-ledger..."
if [ -d "$PY_DIR" ]; then
  echo ""
  echo "  No dashboard Railway:"
  echo "  1. + New → GitHub Repo → ricartefelipe/py-payments-ledger"
  echo "  2. Configure o Dockerfile: docker/api.Dockerfile"
  echo "  3. Adicione estas variáveis:"
  echo ""
  echo "  APP_ENV=production"
  echo "  HTTP_PORT=8000"
  echo "  JWT_SECRET=$JWT_SECRET"
  echo "  JWT_ISSUER=spring-saas-core"
  echo "  JWT_ALGORITHM=HS256"
  echo "  GATEWAY_PROVIDER=fake"
  echo "  CORS_ORIGINS=<URLs dos frontends>"
  echo ""
  echo "  DATABASE_URL → Referência ao PostgreSQL"
  echo "  REDIS_URL → Referência ao Redis"
  echo ""
  read -p "Pressione ENTER quando o serviço estiver configurado..."
  ok "py-payments-ledger configurado"
else
  warn "Diretório py-payments-ledger não encontrado em $PY_DIR"
fi

# 7. Deploy frontends
echo "─────────────────────────────────────────────"
info "Configurando frontends..."
echo ""
echo "  Para CADA frontend (shop, admin-console, ops-portal):"
echo "  1. + New → GitHub Repo → ricartefelipe/fluxe-b2b-suite"
echo "  2. Root Directory: saas-suite-ui"
echo "  3. Dockerfile: apps/<nome>/Dockerfile"
echo ""
echo "  Variáveis (mesmas para os 3):"
echo "  CORE_API_BASE_URL=<URL do spring-saas-core>"
echo "  ORDERS_API_BASE_URL=<URL do node-b2b-orders>"
echo "  PAYMENTS_API_BASE_URL=<URL do py-payments-ledger>"
echo "  AUTH_MODE=hs256"
echo "  LOG_LEVEL=warn"
echo "  APP_VERSION=1.0.0"
echo ""
read -p "Pressione ENTER quando os frontends estiverem configurados..."
ok "Frontends configurados"

# 8. Resumo
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║              Setup Concluído!                   ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "JWT_SECRET (guarde!): $JWT_SECRET"
echo ""
echo "Próximos passos:"
echo "  1. Aguarde os deploys completarem no dashboard"
echo "  2. Verifique os health checks de cada serviço"
echo "  3. Configure os CORS_ORIGINS com os URLs finais"
echo "  4. Configure domínios customizados se desejar"
echo ""
ok "Tudo pronto! 🚀"
