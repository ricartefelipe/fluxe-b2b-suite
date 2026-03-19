#!/usr/bin/env bash
# Deploy manual (sem depender do GitHub Actions).
# Uso: defina variáveis ou crie .env.deploy (VPS_HOST, VPS_USER, GHCR_ORG, opcional VPS_SSH_KEY).
# Para publicar a imagem spring-saas-core antes: BUILD_CORE=1 ./scripts/deploy-manual.sh
# Requer: docker (login ghcr.io), rsync, ssh.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DEPLOY_ENV="${PROJECT_DIR}/.env.deploy"

if [[ -f "$DEPLOY_ENV" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$DEPLOY_ENV"
  set +a
fi

VPS_HOST="${VPS_HOST:?Defina VPS_HOST (ou crie .env.deploy)}"
VPS_USER="${VPS_USER:?Defina VPS_USER (ou crie .env.deploy)}"
GHCR_ORG="${GHCR_ORG:-ricartefelipe}"

BUILD_CORE="${BUILD_CORE:-0}"
CORE_REPO_PATH="${CORE_REPO_PATH:-$(dirname "$PROJECT_DIR")/spring-saas-core}"

log()  { echo "[deploy-manual] $*"; }
warn() { echo "[deploy-manual] WARN: $*" >&2; }

if [[ "$BUILD_CORE" == "1" || "$BUILD_CORE" == "true" ]]; then
  if [[ ! -d "$CORE_REPO_PATH" ]]; then
    warn "CORE_REPO_PATH=$CORE_REPO_PATH não encontrado. Ignorando build do core."
  else
    log "Build e push da imagem spring-saas-core em $CORE_REPO_PATH ..."
    (cd "$CORE_REPO_PATH" && ./mvnw -B -q package -DskipTests)
    (cd "$CORE_REPO_PATH" && docker build -f docker/app.Dockerfile.hostbuild -t "ghcr.io/${GHCR_ORG}/spring-saas-core:latest" .)
    docker push "ghcr.io/${GHCR_ORG}/spring-saas-core:latest"
    log "Imagem spring-saas-core:latest publicada."
  fi
else
  log "BUILD_CORE desativado. O VPS fará pull da imagem já existente no GHCR."
fi

SSH_KEY_FILE=""
if [[ -n "${VPS_SSH_KEY:-}" ]]; then
  SSH_KEY_FILE=$(mktemp -u)
  echo "$VPS_SSH_KEY" > "$SSH_KEY_FILE"
  chmod 600 "$SSH_KEY_FILE"
  trap 'rm -f '"$SSH_KEY_FILE" EXIT
  RSH="ssh -i $SSH_KEY_FILE -o StrictHostKeyChecking=accept-new"
  SSH_CMD=(ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=accept-new)
else
  RSH="ssh -o StrictHostKeyChecking=accept-new"
  SSH_CMD=(ssh -o StrictHostKeyChecking=accept-new)
fi

log "Enviando ficheiros para o VPS..."
rsync -avz --delete -e "$RSH" \
  "$PROJECT_DIR"/docker-compose.prod.yml \
  "$PROJECT_DIR"/deploy/ \
  "$PROJECT_DIR"/scripts/ \
  "${VPS_USER}@${VPS_HOST}:~/fluxe-b2b-suite/"

log "A executar deploy no VPS..."
"${SSH_CMD[@]}" "${VPS_USER}@${VPS_HOST}" << 'REMOTE'
  set -euo pipefail
  cd ~/fluxe-b2b-suite
  chmod +x scripts/deploy.sh
  ./scripts/deploy.sh
REMOTE

log "Smoke test..."
"${SSH_CMD[@]}" "${VPS_USER}@${VPS_HOST}" << 'SMOKE'
  set -e
  curl -sf http://127.0.0.1:80/health || true
  curl -sf http://127.0.0.1:8080/actuator/health/liveness || true
  curl -sf http://127.0.0.1:3000/v1/healthz || true
  curl -sf http://127.0.0.1:8000/healthz || true
  echo "Smoke tests concluídos."
SMOKE

log "Deploy manual concluído."
