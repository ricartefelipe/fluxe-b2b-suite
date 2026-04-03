#!/usr/bin/env bash
# Aplica railwayConfigFile correcto em admin, ops e shop (Staging + Production).
# Requer token de conta: https://railway.com/account/tokens (não serve o token de sessão do CLI).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -z "${RAILWAY_API_TOKEN:-}" ]]; then
  echo "Erro: defina RAILWAY_API_TOKEN antes de correr este script." >&2
  echo "  Crie um token em https://railway.com/account/tokens" >&2
  echo "  export RAILWAY_API_TOKEN='...'" >&2
  echo "  ./scripts/apply-railway-front-configfiles.sh" >&2
  exit 1
fi

echo "=== Staging ==="
python3 scripts/railway-fix-front-service-configfiles.py --staging
echo "=== Production ==="
python3 scripts/railway-fix-front-service-configfiles.py --production
echo ""
echo "Feito. O Railway costuma disparar novos builds; se não, faz Redeploy dos três fronts em cada projeto."
echo "Validação: curl -s URL_DO_ADMIN | grep title"
