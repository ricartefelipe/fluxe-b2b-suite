#!/usr/bin/env bash
# Verifica que variáveis críticas de produção estão definidas num ficheiro .env (local, não commitar).
#
# Uso:
#   ./scripts/producao-preflight.sh /caminho/.env.producao
#   PROD_ENV_FILE=/caminho/.env.producao ./scripts/producao-preflight.sh
#
# Falha com código 1 se alguma chave obrigatória estiver ausente ou vazia (após remover espaços).
set -euo pipefail

env_file="${1:-${PROD_ENV_FILE:-}}"
if [[ -z "$env_file" || ! -f "$env_file" ]]; then
  echo "Uso: $0 <ficheiro-.env>   (ou PROD_ENV_FILE=...)" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$env_file"
set +a

required=(
  CORS_ALLOWED_ORIGINS
  OIDC_JWK_SET_URI
  OIDC_ISSUER_URI
  OIDC_CLIENT_ID
  RESEND_API_KEY
  STRIPE_BILLING_SECRET_KEY
  STRIPE_API_KEY
  STRIPE_WEBHOOK_SECRET
  ENCRYPTION_KEY
)

ok=0

jwt="${JWT_SECRET:-${JWT_HS256_SECRET:-}}"
if [[ -z "${jwt// /}" ]]; then
  echo "FALTA ou vazio: JWT_SECRET (ou JWT_HS256_SECRET) — deve ser o mesmo segredo nos três backends." >&2
  ok=1
else
  echo "OK JWT_SECRET ou JWT_HS256_SECRET"
fi

for key in "${required[@]}"; do
  val="${!key:-}"
  if [[ -z "${val// /}" ]]; then
    echo "FALTA ou vazio: $key" >&2
    ok=1
  else
    echo "OK $key"
  fi
done

if [[ "$ok" -ne 0 ]]; then
  echo "" >&2
  echo "Preencha as chaves em falta. Ver .env.example na raiz e docs/PRODUCAO-OPERACAO.md" >&2
  exit 1
fi

echo ""
echo "Preflight concluído: variáveis obrigatórias do checklist estão preenchidas (valor não vazio)."
