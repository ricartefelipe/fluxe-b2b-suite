#!/usr/bin/env bash
# Ativa Stripe test no piloto quando chaves existem em .env.aws-pilot (nunca commitar secrets).
#
# Pré-requisitos no .env.aws-pilot:
#   STRIPE_BILLING_SECRET_KEY=sk_test_...
#   STRIPE_API_KEY=sk_test_...
#   STRIPE_WEBHOOK_SECRET=whsec_...   (opcional para webhook remoto)
#
# Uso:
#   ./scripts/aws-pilot-prepare-billing.sh
#   ./scripts/aws-pilot-prepare-billing.sh --deploy
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$SUITE_ROOT/.env.aws-pilot}"
DEPLOY=false

for arg in "$@"; do
  [[ "$arg" == "--deploy" ]] && DEPLOY=true
done

[[ -f "$ENV_FILE" ]] || { echo "Arquivo $ENV_FILE não encontrado." >&2; exit 1; }

get_env() {
  grep "^${1}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- || true
}

STRIPE_BILLING_SECRET_KEY="$(get_env STRIPE_BILLING_SECRET_KEY)"
STRIPE_API_KEY="$(get_env STRIPE_API_KEY)"

missing=()
[[ -z "$STRIPE_BILLING_SECRET_KEY" ]] && missing+=("STRIPE_BILLING_SECRET_KEY")
[[ -z "$STRIPE_API_KEY" ]] && missing+=("STRIPE_API_KEY")

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Chaves Stripe ausentes em $ENV_FILE:" >&2
  printf '  - %s\n' "${missing[@]}" >&2
  echo "" >&2
  echo "Adicione chaves test (https://dashboard.stripe.com/test/apikeys) e rode de novo." >&2
  exit 1
fi

patch_var() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
  else
    echo "${key}=${val}" >> "$ENV_FILE"
  fi
}

patch_var APP_BILLING_PROVIDER stripe
patch_var GATEWAY_PROVIDER stripe

echo "✔ .env.aws-pilot atualizado: APP_BILLING_PROVIDER=stripe, GATEWAY_PROVIDER=stripe"
echo "  Core:  STRIPE_BILLING_SECRET_KEY=sk_test_... (presente)"
echo "  Ledger: STRIPE_API_KEY=sk_test_... (presente)"

if [[ "$DEPLOY" == true ]]; then
  echo "▸ Redeploy na EC2..."
  source "$SUITE_ROOT/.aws-deploy/last-ec2.env" 2>/dev/null || true
  FLUXE_HOST="${PUBLIC_IP:-${FLUXE_HOST:-}}"
  FLUXE_KEY="${KEY_FILE:-$HOME/.ssh/fluxe-b2b-deploy.pem}"
  export FLUXE_HOST FLUXE_KEY ENV_FILE
  "$SCRIPT_DIR/aws-deploy-fluxe-ec2.sh"
  echo "▸ Configure webhook Stripe → https://<domínio>/api/payments/webhooks/stripe (quando tiver URL fixa)"
else
  echo ""
  echo "Próximo passo: ./scripts/aws-pilot-prepare-billing.sh --deploy"
fi
