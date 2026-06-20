#!/usr/bin/env bash
# Smoke de signup self-service (/v1/onboarding/signup) no piloto.
#
# Uso:
#   PILOT_BASE_URL=https://54-94-52-89.sslip.io ./scripts/aws-pilot-signup-smoke.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BASE="${PILOT_BASE_URL:-}"
if [[ -z "$BASE" && -f "$SUITE_ROOT/.aws-deploy/last-ec2.env" ]]; then
  # shellcheck disable=SC1091
  source "$SUITE_ROOT/.aws-deploy/last-ec2.env"
  if [[ -n "${PILOT_DOMAIN:-}" ]]; then
    BASE="https://${PILOT_DOMAIN}"
  elif [[ -n "${PUBLIC_IP:-}" ]]; then
    BASE="http://${PUBLIC_IP}"
  fi
fi

[[ -n "$BASE" ]] || { echo "Defina PILOT_BASE_URL ou .aws-deploy/last-ec2.env" >&2; exit 1; }
BASE="${BASE%/}"

STAMP="${SMOKE_SIGNUP_STAMP:-$(date +%s)}"
EMAIL="${SMOKE_SIGNUP_EMAIL:-signup-${STAMP}@demo.example.com}"
COMPANY="Demo Co ${STAMP}"

echo "▸ Signup self-service: $EMAIL → $BASE/api/core/v1/onboarding/signup"

RESP=$(curl -sf --max-time 30 -X POST "$BASE/api/core/v1/onboarding/signup" \
  -H 'Content-Type: application/json' \
  -d "{\"companyName\":\"$COMPANY\",\"plan\":\"starter\",\"region\":\"BR\",\"email\":\"$EMAIL\",\"name\":\"Demo User\",\"password\":\"Signup123!\"}")

if echo "$RESP" | grep -q access_token; then
  TENANT=$(echo "$RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
  echo "  OK  signup (tenant=${TENANT:-?})"
  exit 0
fi

echo "  FAIL signup" >&2
echo "$RESP" >&2
exit 1
