#!/usr/bin/env bash
# Item 1 do checklist: comparar o commit de deploy no Railway com origin/develop.
# Uso (na máquina, com git e rede):
#   ./scripts/staging-compare-develop-sha.sh
# Depois, no Railway → serviço → último Deployment → commit SHA deve coincidir
# (ou ser descendente do mesmo histórico que origin/develop).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Erro: não é um repositório git." >&2
  exit 1
fi

git fetch origin develop 2>/dev/null || true

SHA=$(git rev-parse origin/develop 2>/dev/null || git rev-parse develop)
SHORT=$(git rev-parse --short "$SHA")

echo "origin/develop atual (fluxe-b2b-suite): $SHA ($SHORT)"
echo ""
echo "No Railway: abre o serviço → Deployments → último deploy bem-sucedido → compara o commit com o SHA acima."
echo "Se forem diferentes, não houve build a partir do develop atual — fazer deploy que compile a partir do Git (não só Redeploy da mesma imagem)."
echo ""
echo "Para obter o SHA do develop noutro repo (ex.: py-payments-ledger):"
echo "  cd ../py-payments-ledger && git fetch origin develop && git rev-parse origin/develop"
