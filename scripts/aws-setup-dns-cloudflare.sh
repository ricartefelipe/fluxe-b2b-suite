#!/usr/bin/env bash
# Cria/atualiza registro A no Cloudflare (DNS only — necessário para Let's Encrypt HTTP-01).
#
# Uso:
#   CLOUDFLARE_API_TOKEN=xxx FLUXE_DOMAIN=app.fluxe.com.br FLUXE_HOST=54.x.x.x ./scripts/aws-setup-dns-cloudflare.sh
#
# Sem token: imprime instruções manuais para o painel Cloudflare.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

FLUXE_DOMAIN="${FLUXE_DOMAIN:-app.fluxe.com.br}"
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

ZONE_ROOT="${FLUXE_DOMAIN#*.}"
if [[ "$ZONE_ROOT" == "$FLUXE_DOMAIN" ]]; then
  ZONE_ROOT="$FLUXE_DOMAIN"
fi

echo "▸ Domínio piloto: $FLUXE_DOMAIN → $FLUXE_HOST (zona: $ZONE_ROOT)"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  cat <<EOF

Cloudflare (manual) — fluxe.com.br está na Cloudflare:

  1. https://dash.cloudflare.com → fluxe.com.br → DNS → Records
  2. Add record:
       Type: A
       Name: ${FLUXE_DOMAIN%%.*}   # ex.: app para app.fluxe.com.br
       IPv4: $FLUXE_HOST
       Proxy: DNS only (nuvem CINZA — obrigatório para Let's Encrypt HTTP-01)
  3. Aguarde propagação (1–5 min) e rode:
       FLUXE_DOMAIN=$FLUXE_DOMAIN ./scripts/aws-setup-tls-ec2.sh

Opcional: export CLOUDFLARE_API_TOKEN=... e rode este script de novo para automatizar.

EOF
  exit 0
fi

ZONE_ID="$(curl -sf \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones?name=$ZONE_ROOT" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result'][0]['id'] if d.get('result') else '')" 2>/dev/null || true)"

if [[ -z "$ZONE_ID" ]]; then
  echo "Zona Cloudflare não encontrada: $ZONE_ROOT" >&2
  exit 1
fi

RECORD_NAME="${FLUXE_DOMAIN}."
EXISTING="$(curl -sf \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?type=A&name=$RECORD_NAME" \
  | python3 -c "import sys,json; r=json.load(sys.stdin).get('result',[]); print(r[0]['id'] if r else '')")"

PAYLOAD=$(python3 - <<PY
import json
print(json.dumps({
  "type": "A",
  "name": "$FLUXE_DOMAIN",
  "content": "$FLUXE_HOST",
  "ttl": 120,
  "proxied": False
}))
PY
)

if [[ -n "$EXISTING" ]]; then
  curl -sf -X PUT \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$EXISTING" \
    -d "$PAYLOAD" >/dev/null
  echo "✔ Registro A atualizado: $FLUXE_DOMAIN → $FLUXE_HOST (DNS only)"
else
  curl -sf -X POST \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
    -d "$PAYLOAD" >/dev/null
  echo "✔ Registro A criado: $FLUXE_DOMAIN → $FLUXE_HOST (DNS only)"
fi

echo "▸ Aguardando DNS..."
for _ in $(seq 1 30); do
  RESOLVED="$(dig +short "$FLUXE_DOMAIN" A 2>/dev/null | head -1 || true)"
  if [[ "$RESOLVED" == "$FLUXE_HOST" ]]; then
    echo "✔ DNS OK: $FLUXE_DOMAIN → $RESOLVED"
    exit 0
  fi
  sleep 10
done

echo "DNS ainda não propagou (esperado $FLUXE_HOST, obtido ${RESOLVED:-vazio}). Tente TLS em alguns minutos." >&2
exit 1
