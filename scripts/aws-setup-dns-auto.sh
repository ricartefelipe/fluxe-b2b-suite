#!/usr/bin/env bash
# DNS automático para piloto EC2 — sem Cloudflare/Route53.
# sslip.io resolve <ip-com-hifens>.sslip.io → IP (ex.: 54-94-52-89.sslip.io).
#
# Uso:
#   FLUXE_HOST=54.94.52.89 ./scripts/aws-setup-dns-auto.sh
#   # imprime FLUXE_DOMAIN e valida propagação
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

FLUXE_HOST="${FLUXE_HOST:-}"
if [[ -z "$FLUXE_HOST" && -f "$SUITE_ROOT/.aws-deploy/last-ec2.env" ]]; then
  # shellcheck disable=SC1091
  source "$SUITE_ROOT/.aws-deploy/last-ec2.env"
  FLUXE_HOST="${PUBLIC_IP:-}"
fi

if [[ -z "$FLUXE_HOST" ]]; then
  echo "Defina FLUXE_HOST (IP público da EC2)." >&2
  exit 1
fi

FLUXE_DOMAIN="${FLUXE_DOMAIN:-${FLUXE_HOST//./-}.sslip.io}"

echo "▸ Domínio piloto (automático): $FLUXE_DOMAIN → $FLUXE_HOST"
echo "  (sslip.io — sem conta, sem Cloudflare)"

for i in $(seq 1 15); do
  RESOLVED="$(dig +short "$FLUXE_DOMAIN" A 2>/dev/null | head -1 || true)"
  if [[ "$RESOLVED" == "$FLUXE_HOST" ]]; then
    echo "✔ DNS OK"
    echo "FLUXE_DOMAIN=$FLUXE_DOMAIN"
    exit 0
  fi
  [[ "$i" -eq 1 ]] && echo "▸ Aguardando DNS..."
  sleep 2
done

echo "DNS não resolveu (esperado $FLUXE_HOST, obtido ${RESOLVED:-vazio})." >&2
exit 1
