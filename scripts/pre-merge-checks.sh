#!/usr/bin/env bash
set -euo pipefail

# Unified local quality gate for the four repositories.
# Usage:
#   ./scripts/pre-merge-checks.sh
#   ./scripts/pre-merge-checks.sh core payments

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE_DIR="$(cd "${ROOT_DIR}/.." && pwd)"

declare -A REPO_PATHS=(
  [suite]="${ROOT_DIR}/saas-suite-ui"
  [core]="${WORKSPACE_DIR}/spring-saas-core"
  [orders]="${WORKSPACE_DIR}/node-b2b-orders"
  [payments]="${WORKSPACE_DIR}/py-payments-ledger"
)

declare -A REPO_COMMANDS=(
  [suite]="pnpm lint && pnpm build && pnpm test"
  [core]="./mvnw spotless:check test"
  [orders]="npm run lint && npm run build && npm test"
  [payments]=".venv/bin/ruff check . && .venv/bin/black --check . && .venv/bin/mypy src && .venv/bin/pytest -q"
)

print_usage() {
  cat <<'EOF'
Usage:
  ./scripts/pre-merge-checks.sh [suite|core|orders|payments]...

Examples:
  ./scripts/pre-merge-checks.sh
  ./scripts/pre-merge-checks.sh core payments
EOF
}

run_repo_checks() {
  local repo_key="$1"
  local repo_path="${REPO_PATHS[$repo_key]}"
  local repo_cmd="${REPO_COMMANDS[$repo_key]}"

  if [[ ! -d "${repo_path}" ]]; then
    echo "[ERROR] Repository path not found for '${repo_key}': ${repo_path}"
    return 1
  fi

  echo ""
  echo "=================================================================="
  echo "[CHECK] ${repo_key} :: ${repo_path}"
  echo "[CMD]   ${repo_cmd}"
  echo "=================================================================="
  (cd "${repo_path}" && bash -lc "${repo_cmd}")
}

main() {
  local repos=("$@")
  local failures=0
  local selected=()

  if [[ "${#repos[@]}" -eq 0 ]]; then
    selected=(suite core orders payments)
  else
    for repo in "${repos[@]}"; do
      if [[ -z "${REPO_PATHS[$repo]+x}" ]]; then
        echo "[ERROR] Unknown repository key: ${repo}"
        print_usage
        exit 2
      fi
      selected+=("${repo}")
    done
  fi

  for repo in "${selected[@]}"; do
    if ! run_repo_checks "${repo}"; then
      failures=$((failures + 1))
      echo "[FAIL] ${repo}"
    else
      echo "[PASS] ${repo}"
    fi
  done

  echo ""
  if [[ "${failures}" -gt 0 ]]; then
    echo "[SUMMARY] ${failures} repository group(s) failed."
    exit 1
  fi

  echo "[SUMMARY] All selected repository checks passed."
}

main "$@"
