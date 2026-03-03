#!/usr/bin/env bash
#
# Generates a production-ready Keycloak realm JSON from the template.
#
# Required environment variables:
#   FRONTEND_URL      - Shop frontend URL (e.g. https://shop.example.com)
#   OPS_PORTAL_URL    - Ops Portal URL    (e.g. https://ops.example.com)
#   ADMIN_CONSOLE_URL - Admin Console URL  (e.g. https://admin.example.com)
#
# Optional:
#   OUTPUT_FILE       - Output path (default: realm-prod.json in current dir)
#
# Usage:
#   FRONTEND_URL=https://shop.example.com \
#   OPS_PORTAL_URL=https://ops.example.com \
#   ADMIN_CONSOLE_URL=https://admin.example.com \
#   ./scripts/generate-keycloak-realm.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="${SCRIPT_DIR}/../docker/keycloak/realm-prod-template.json"
OUTPUT="${OUTPUT_FILE:-${SCRIPT_DIR}/../realm-prod.json}"

: "${FRONTEND_URL:?ERROR: FRONTEND_URL is required (e.g. https://shop.example.com)}"
: "${OPS_PORTAL_URL:?ERROR: OPS_PORTAL_URL is required (e.g. https://ops.example.com)}"
: "${ADMIN_CONSOLE_URL:?ERROR: ADMIN_CONSOLE_URL is required (e.g. https://admin.example.com)}"

if [ ! -f "$TEMPLATE" ]; then
  echo "ERROR: Template not found at $TEMPLATE"
  exit 1
fi

echo "Generating production Keycloak realm..."
echo "  FRONTEND_URL:      $FRONTEND_URL"
echo "  OPS_PORTAL_URL:    $OPS_PORTAL_URL"
echo "  ADMIN_CONSOLE_URL: $ADMIN_CONSOLE_URL"
echo ""

sed \
  -e "s|\${FRONTEND_URL}|${FRONTEND_URL}|g" \
  -e "s|\${OPS_PORTAL_URL}|${OPS_PORTAL_URL}|g" \
  -e "s|\${ADMIN_CONSOLE_URL}|${ADMIN_CONSOLE_URL}|g" \
  "$TEMPLATE" > "$OUTPUT"

echo "Realm JSON generated at: $OUTPUT"
echo ""
echo "To import into Keycloak:"
echo "  /opt/keycloak/bin/kc.sh import --file $(realpath "$OUTPUT")"
echo ""
echo "Production differences from dev realm:"
echo "  - sslRequired: external (TLS enforced)"
echo "  - bruteForceProtected: true (5 failures = lockout)"
echo "  - directAccessGrantsEnabled: false (no password grant)"
echo "  - No default users (create via Admin API or console)"
echo "  - URLs point to production domains"
