#!/usr/bin/env bash
set -euo pipefail

# Gate local unificado dos quatro repositorios (ver docs/PIPELINE-ESTEIRAS.md).
# Falha imediata por repo; ao final, resumo e codigo de saida != 0 se algum falhar.
#
# Uso:
#   ./scripts/pre-merge-checks.sh
#   ./scripts/pre-merge-checks.sh core payments
#
# Variaveis:
#   MAVEN_REPO_LOCAL — repositorio Maven local (default: $HOME/.m2/repository)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE_DIR="$(cd "${ROOT_DIR}/.." && pwd)"

PATH_SUITE="${ROOT_DIR}/saas-suite-ui"
PATH_CORE="${WORKSPACE_DIR}/spring-saas-core"
PATH_ORDERS="${WORKSPACE_DIR}/node-b2b-orders"
PATH_PAYMENTS="${WORKSPACE_DIR}/py-payments-ledger"

MAVEN_REPO_LOCAL="${MAVEN_REPO_LOCAL:-$HOME/.m2/repository}"

print_usage() {
  cat <<'EOF'
Uso:
  ./scripts/pre-merge-checks.sh [suite|core|orders|payments]...

Exemplos:
  ./scripts/pre-merge-checks.sh
  ./scripts/pre-merge-checks.sh core orders
EOF
}

declare -A REPO_PATHS=(
  [suite]="${PATH_SUITE}"
  [core]="${PATH_CORE}"
  [orders]="${PATH_ORDERS}"
  [payments]="${PATH_PAYMENTS}"
)

check_suite() {
  (cd "${PATH_SUITE}" && pnpm lint && pnpm build && pnpm test)
}

check_core() {
  (cd "${PATH_CORE}" && ./mvnw -Dmaven.repo.local="${MAVEN_REPO_LOCAL}" spotless:check test)
}

check_orders() {
  (cd "${PATH_ORDERS}" && npm run lint && npm run build && npm test)
}

check_payments() {
  (
    cd "${PATH_PAYMENTS}"
    if [[ -x .venv/bin/ruff ]]; then
      .venv/bin/ruff check .
      .venv/bin/black --check .
      .venv/bin/mypy src
      .venv/bin/pytest -q
    elif command -v uv >/dev/null 2>&1 && [[ -f pyproject.toml ]]; then
      uv run ruff check .
      uv run black --check .
      uv run mypy src
      uv run pytest -q
    else
      echo "[ERRO] py-payments-ledger: crie .venv (python -m venv .venv && pip install -e '.[dev]') ou instale uv."
      exit 1
    fi
  )
}

run_repo_checks() {
  local repo_key="$1"
  local repo_path="${REPO_PATHS[$repo_key]}"

  if [[ ! -d "${repo_path}" ]]; then
    echo "[ERRO] Pasta nao encontrada para '${repo_key}': ${repo_path}"
    return 1
  fi

  echo ""
  echo "=================================================================="
  echo "[CHECK] ${repo_key} :: ${repo_path}"
  echo "=================================================================="

  case "${repo_key}" in
    suite) check_suite ;;
    core) check_core ;;
    orders) check_orders ;;
    payments) check_payments ;;
    *)
      echo "[ERRO] Chave desconhecida: ${repo_key}"
      return 1
      ;;
  esac
}

main() {
  local repos=("$@")
  local failures=0
  local selected=()
  local start_ts
  start_ts=$(date +%s)

  if [[ "${#repos[@]}" -eq 0 ]]; then
    selected=(suite core orders payments)
  else
    for repo in "${repos[@]}"; do
      if [[ -z "${REPO_PATHS[$repo]+x}" ]]; then
        echo "[ERRO] Repositorio desconhecido: ${repo}"
        print_usage
        exit 2
      fi
      selected+=("${repo}")
    done
  fi

  echo "=== pre-merge-checks (${#selected[@]} grupo(s)) — MAVEN_REPO_LOCAL=${MAVEN_REPO_LOCAL} ==="

  for repo in "${selected[@]}"; do
    if ! run_repo_checks "${repo}"; then
      failures=$((failures + 1))
      echo "[FALHA] ${repo}"
    else
      echo "[OK] ${repo}"
    fi
  done

  local end_ts elapsed
  end_ts=$(date +%s)
  elapsed=$((end_ts - start_ts))

  echo ""
  if [[ "${failures}" -gt 0 ]]; then
    echo "[RESUMO] ${failures} grupo(s) falharam. Tempo: ${elapsed}s"
    exit 1
  fi

  echo "[RESUMO] Todos os checks passaram. Tempo: ${elapsed}s"
}

main "$@"
