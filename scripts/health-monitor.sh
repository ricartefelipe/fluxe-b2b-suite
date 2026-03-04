#!/usr/bin/env bash
# Health monitoring for Fluxe B2B Suite services.
# Run via cron every 5 minutes:
#   */5 * * * * /opt/fluxe/scripts/health-monitor.sh >> /opt/fluxe/logs/health.log 2>&1
set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

COMPOSE_FILE="${SUITE_ROOT}/docker-compose.prod.yml"

# Webhook URL for alerts (Slack, Discord, etc). Leave empty to disable.
ALERT_WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}"
# Email for alerts (requires mailutils). Leave empty to disable.
ALERT_EMAIL="${ALERT_EMAIL:-}"

TIMEOUT=10

declare -A SERVICES=(
  ["saas-core"]="http://localhost:8080/actuator/health/liveness"
  ["orders-api"]="http://localhost:3000/v1/healthz"
  ["payments-api"]="http://localhost:8000/healthz"
  ["keycloak"]="http://localhost:8180/health/live"
  ["nginx"]="http://localhost:80/"
  ["rabbitmq"]="http://localhost:15672/"
)

# ─── Functions ───────────────────────────────────────────────────────────────
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

check_service() {
  local name="$1"
  local url="$2"
  local http_code

  http_code=$(curl -sf -o /dev/null -w "%{http_code}" --max-time "${TIMEOUT}" "${url}" 2>/dev/null || echo "000")

  if [ "${http_code}" -ge 200 ] && [ "${http_code}" -lt 400 ]; then
    return 0
  else
    return 1
  fi
}

restart_container() {
  local service="$1"
  log "  Reiniciando container: ${service}..."
  if docker compose -f "${COMPOSE_FILE}" restart "${service}" 2>/dev/null; then
    log "  Container ${service} reiniciado."
  else
    log "  ERRO ao reiniciar ${service}."
  fi
}

send_alert() {
  local message="$1"

  if [ -n "${ALERT_WEBHOOK_URL}" ]; then
    local payload
    payload=$(jq -n --arg text "${message}" '{"text": $text}')
    curl -sf -X POST -H "Content-Type: application/json" \
      -d "${payload}" "${ALERT_WEBHOOK_URL}" >/dev/null 2>&1 || true
  fi

  if [ -n "${ALERT_EMAIL}" ] && command -v mail &>/dev/null; then
    echo "${message}" | mail -s "[Fluxe] Health Alert" "${ALERT_EMAIL}" 2>/dev/null || true
  fi
}

check_docker_health() {
  local service="$1"
  local status
  status=$(docker compose -f "${COMPOSE_FILE}" ps --format json "${service}" 2>/dev/null \
    | jq -r '.Health // .State // "unknown"' 2>/dev/null || echo "unknown")
  echo "${status}"
}

# ─── Main ────────────────────────────────────────────────────────────────────
main() {
  local down_services=()
  local all_ok=true

  for service in "${!SERVICES[@]}"; do
    local url="${SERVICES[${service}]}"

    if check_service "${service}" "${url}"; then
      log "OK: ${service}"
    else
      all_ok=false
      log "DOWN: ${service} (${url})"
      down_services+=("${service}")

      local docker_status
      docker_status=$(check_docker_health "${service}")
      log "  Docker status: ${docker_status}"

      restart_container "${service}"
    fi
  done

  if [ "${#down_services[@]}" -gt 0 ]; then
    local hostname
    hostname=$(hostname -f 2>/dev/null || hostname)
    local alert_msg="[Fluxe ${hostname}] Services DOWN: ${down_services[*]}. Auto-restart attempted."
    send_alert "${alert_msg}"
    log "Alerta enviado: ${alert_msg}"
  fi

  if [ "${all_ok}" = true ]; then
    log "Todos os serviços OK."
  fi
}

main "$@"
