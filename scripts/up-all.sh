#!/usr/bin/env bash
# Sobe toda a suite: backends (Docker) + frontend.
# Uso: ./scripts/up-all.sh
# Requer: Docker acessível (seu usuário no grupo docker ou sudo).
# Acesse: http://localhost:4200 (Ops Portal), login com "Ops User".

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WKS="$(cd "$SUITE_ROOT/.." && pwd)"

# --- Verificar Docker ---
echo "=== Verificando Docker ==="
if ! docker info &>/dev/null; then
  echo "ERRO: Docker inacessível. Corra: docker info"
  echo "  Se 'permission denied': adicione seu usuário ao grupo docker:"
  echo "    sudo usermod -aG docker \$USER"
  echo "  Depois faça logout/login ou: newgrp docker"
  exit 1
fi
echo "  Docker OK"
echo ""

# --- Garantir .env com JWT E2E (Node e Python) ---
for repo in node-b2b-orders py-payments-ledger; do
  dir="$WKS/$repo"
  if [ -d "$dir" ] && [ -f "$dir/.env.example" ]; then
    if [ ! -f "$dir/.env" ]; then
      echo "Criando $dir/.env a partir de .env.example"
      cp "$dir/.env.example" "$dir/.env"
    fi
    # Garantir JWT igual ao Core para login E2E
    if grep -q 'JWT_SECRET=change-me' "$dir/.env" 2>/dev/null; then
      echo "Ajustando JWT em $dir/.env para E2E"
      sed -i.bak 's|JWT_SECRET=change-me|JWT_SECRET=local-dev-secret-min-32-chars-for-hs256-signing|' "$dir/.env"
      sed -i.bak 's|JWT_ISSUER=local-auth|JWT_ISSUER=spring-saas-core|' "$dir/.env"
      rm -f "$dir/.env.bak"
    fi
  fi
done
echo ""

# --- Backends (não sair no primeiro erro para ver todos os problemas) ---
FAILED=""

echo "--- [1/3] spring-saas-core ---"
if [ ! -d "$WKS/spring-saas-core" ]; then
  echo "  SKIP: pasta não encontrada"
else
  if ( cd "$WKS/spring-saas-core" && docker compose up -d --build ); then
    echo "  Aguardando app (até 2 min)..."
    for i in $(seq 1 60); do
      if curl -sf http://localhost:8080/actuator/health/liveness &>/dev/null; then
        echo "  Spring OK: http://localhost:8080"
        break
      fi
      [ "$i" -eq 60 ] && { echo "  WARN: timeout Spring"; FAILED="$FAILED spring"; }
      sleep 2
    done
  else
    echo "  ERRO ao subir Spring"
    FAILED="$FAILED spring"
  fi
fi
echo ""

echo "--- [2/3] node-b2b-orders ---"
if [ ! -d "$WKS/node-b2b-orders" ]; then
  echo "  SKIP: pasta não encontrada"
else
  ( cd "$WKS/node-b2b-orders" && docker compose up -d --build ) || { echo "  ERRO ao subir Node"; FAILED="$FAILED node"; }
  sleep 5
  ( cd "$WKS/node-b2b-orders" && docker compose run --rm api npx prisma migrate deploy ) || true
  ( cd "$WKS/node-b2b-orders" && docker compose run --rm api npx prisma db seed ) || true
  if curl -sf http://localhost:3000/v1/healthz &>/dev/null; then
    echo "  Node OK: http://localhost:3000"
  else
    echo "  WARN: Node pode ainda estar subindo (porta 3000)"
  fi
fi
echo ""

echo "--- [3/3] py-payments-ledger ---"
if [ ! -d "$WKS/py-payments-ledger" ]; then
  echo "  SKIP: pasta não encontrada"
else
  ( cd "$WKS/py-payments-ledger" && docker compose up -d --build ) || { echo "  ERRO ao subir Python"; FAILED="$FAILED py"; }
  echo "  Aguardando Postgres..."
  sleep 10
  ( cd "$WKS/py-payments-ledger" && docker compose run --rm api alembic upgrade head ) || true
  ( cd "$WKS/py-payments-ledger" && docker compose run --rm api python -m src.infrastructure.db.seed ) || true
  if curl -sf http://localhost:8000/healthz &>/dev/null; then
    echo "  Python OK: http://localhost:8000"
  else
    echo "  WARN: Python pode ainda estar subindo (porta 8000)"
  fi
fi
echo ""

if [ -n "$FAILED" ]; then
  echo "Atenção: alguns serviços falharam:$FAILED"
  echo "Verifique os logs: cd $WKS/<repo> && docker compose logs -f"
  echo ""
fi

echo "=== Iniciando frontend (Ops Portal) ==="
echo "  URL: http://localhost:4200"
echo "  Login: perfil 'Ops User' (tenant_demo)"
echo "  Ctrl+C encerra só o frontend; containers continuam rodando."
echo ""

cd "$SUITE_ROOT/saas-suite-ui"
exec pnpm nx serve ops-portal
