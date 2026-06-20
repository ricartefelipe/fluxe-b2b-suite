#!/usr/bin/env bash
# Route 53: cria registro A em hosted zone existente (domínio registrado na AWS ou NS delegados).
#
# Uso:
#   FLUXE_DOMAIN=demo.seudominio.com.br FLUXE_HOST=54.94.52.89 ./scripts/aws-setup-dns-route53.sh
set -euo pipefail

FLUXE_DOMAIN="${FLUXE_DOMAIN:?FLUXE_DOMAIN obrigatório}"
FLUXE_HOST="${FLUXE_HOST:?FLUXE_HOST obrigatório}"
AWS_REGION="${AWS_REGION:-sa-east-1}"

ZONE_ROOT="${FLUXE_DOMAIN#*.}"
if [[ "$ZONE_ROOT" == "$FLUXE_DOMAIN" ]]; then
  ZONE_ROOT="$FLUXE_DOMAIN"
fi

ZONE_ID="$(aws route53 list-hosted-zones-by-name --dns-name "$ZONE_ROOT" \
  --query "HostedZones[?Name=='${ZONE_ROOT}.'].Id" --output text 2>/dev/null | head -1 | sed 's|/hostedzone/||')"

if [[ -z "$ZONE_ID" ]]; then
  cat <<EOF
Nenhuma hosted zone Route 53 para "$ZONE_ROOT".

Crie em AWS Console → Route 53 → Hosted zones → Create hosted zone
e delegue NS no seu registrador (Registro.br, etc.).

Piloto imediato sem domínio: ./scripts/aws-setup-dns-auto.sh (sslip.io)
EOF
  exit 1
fi

RECORD_NAME="${FLUXE_DOMAIN}."
UPSERT=$(cat <<JSON
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "$RECORD_NAME",
      "Type": "A",
      "TTL": 60,
      "ResourceRecords": [{"Value": "$FLUXE_HOST"}]
    }
  }]
}
JSON
)

aws route53 change-resource-record-sets --hosted-zone-id "$ZONE_ID" --change-batch "$UPSERT" >/dev/null
echo "✔ Route 53 A: $FLUXE_DOMAIN → $FLUXE_HOST (zone $ZONE_ROOT)"

for _ in $(seq 1 30); do
  RESOLVED="$(dig +short "$FLUXE_DOMAIN" A 2>/dev/null | head -1 || true)"
  if [[ "$RESOLVED" == "$FLUXE_HOST" ]]; then
    echo "✔ DNS propagado"
    exit 0
  fi
  sleep 10
done

echo "Registro criado; propagação ainda em andamento." >&2
exit 1
