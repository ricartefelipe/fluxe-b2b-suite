#!/usr/bin/env bash
# Prepara e-mail transacional (Amazon SES) quando domínio estiver verificado.
#
# Pré-requisitos:
#   1. Domínio com registro DNS apontando para a EC2 (ou MX/TXT SES)
#   2. Domínio verificado no SES (sair do sandbox se for enviar a clientes reais)
#   3. Credenciais SMTP IAM no .env.aws-pilot:
#        SMTP_HOST=email-smtp.sa-east-1.amazonaws.com
#        SMTP_USER=...
#        SMTP_PASSWORD=...
#        EMAIL_FROM=noreply@seudominio.com
#
# Uso:
#   ./scripts/aws-pilot-prepare-ses.sh --check-domain seudominio.com
#   ./scripts/aws-pilot-prepare-ses.sh --apply --deploy
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$SUITE_ROOT/.env.aws-pilot}"
AWS_REGION="${AWS_REGION:-sa-east-1}"
DOMAIN=""
APPLY=false
DEPLOY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --check-domain) DOMAIN="$2"; shift 2 ;;
    --apply) APPLY=true; shift ;;
    --deploy) DEPLOY=true; shift ;;
    *) echo "Opção desconhecida: $1" >&2; exit 1 ;;
  esac
done

if [[ -n "$DOMAIN" ]]; then
  echo "▸ Verificação SES para $DOMAIN (região $AWS_REGION)..."
  if aws ses get-identity-verification-attributes \
      --region "$AWS_REGION" \
      --identities "$DOMAIN" 2>/dev/null | grep -q Success; then
    echo "  OK  domínio verificado no SES"
  else
    echo "  PENDENTE — verifique no console SES ou rode:" >&2
    echo "    aws ses verify-domain-identity --region $AWS_REGION --domain $DOMAIN" >&2
    exit 1
  fi
fi

if [[ "$APPLY" != true ]]; then
  echo ""
  echo "Quando SES estiver pronto, preencha SMTP_* e EMAIL_FROM em $ENV_FILE e rode:"
  echo "  ./scripts/aws-pilot-prepare-ses.sh --apply --deploy"
  exit 0
fi

[[ -f "$ENV_FILE" ]] || { echo "$ENV_FILE não encontrado" >&2; exit 1; }

get_env() {
  grep "^${1}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- || true
}

SMTP_HOST="$(get_env SMTP_HOST)"
SMTP_USER="$(get_env SMTP_USER)"
SMTP_PASSWORD="$(get_env SMTP_PASSWORD)"
EMAIL_FROM="$(get_env EMAIL_FROM)"

missing=()
[[ -z "$SMTP_HOST" ]] && missing+=("SMTP_HOST")
[[ -z "$SMTP_USER" ]] && missing+=("SMTP_USER")
[[ -z "$SMTP_PASSWORD" ]] && missing+=("SMTP_PASSWORD")
[[ -z "$EMAIL_FROM" ]] && missing+=("EMAIL_FROM")

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Variáveis ausentes em $ENV_FILE:" >&2
  printf '  - %s\n' "${missing[@]}" >&2
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

patch_var EMAIL_PROVIDER smtp
patch_var SMTP_PORT "${SMTP_PORT:-587}"

echo "✔ .env.aws-pilot: EMAIL_PROVIDER=smtp, EMAIL_FROM=$EMAIL_FROM"

if [[ "$DEPLOY" == true ]]; then
  source "$SUITE_ROOT/.aws-deploy/last-ec2.env" 2>/dev/null || true
  FLUXE_HOST="${PUBLIC_IP:-${FLUXE_HOST:-}}"
  FLUXE_KEY="${KEY_FILE:-$HOME/.ssh/fluxe-b2b-deploy.pem}"
  export FLUXE_HOST FLUXE_KEY ENV_FILE
  "$SCRIPT_DIR/aws-deploy-fluxe-ec2.sh"
fi
