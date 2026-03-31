#!/usr/bin/env bash
set -euo pipefail

# Comparacao byte-a-byte dos contratos canonicos do spring-saas-core com os espelhos
# em node-b2b-orders e py-payments-ledger (docs/contracts).
#
# Uso: na raiz do fluxe-b2b-suite, com os tres repos lado a lado no workspace:
#   ./scripts/check-contract-drift.sh
#
# Variaveis (CI cross-repo):
#   CORE_BASE_DIR, ORDERS_BASE_DIR, PAYMENTS_BASE_DIR

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE_DIR="$(cd "${ROOT_DIR}/.." && pwd)"
CORE_BASE_DIR="${CORE_BASE_DIR:-${WORKSPACE_DIR}/spring-saas-core}"
ORDERS_BASE_DIR="${ORDERS_BASE_DIR:-${WORKSPACE_DIR}/node-b2b-orders}"
PAYMENTS_BASE_DIR="${PAYMENTS_BASE_DIR:-${WORKSPACE_DIR}/py-payments-ledger}"
CORE_CONTRACTS_DIR="${CORE_BASE_DIR}/docs/contracts"
CORE_SCHEMAS_DIR="${CORE_CONTRACTS_DIR}/schemas"

FILES_MD=(
  "events.md"
  "headers.md"
  "identity.md"
)

if [[ ! -d "${CORE_CONTRACTS_DIR}" ]]; then
  echo "[ERRO] Pasta de contratos do Core nao encontrada: ${CORE_CONTRACTS_DIR}"
  exit 2
fi

# JSON Schema canonicos no Core (todos os .json em schemas/)
FILES_SCHEMA=()
if [[ -d "${CORE_SCHEMAS_DIR}" ]]; then
  shopt -s nullglob
  for f in "${CORE_SCHEMAS_DIR}"/*.json; do
    [[ -f "$f" ]] && FILES_SCHEMA+=("$(basename "$f")")
  done
  shopt -u nullglob
fi

if [[ "${#FILES_SCHEMA[@]}" -eq 0 ]]; then
  echo "[AVISO] Nenhum .json em ${CORE_SCHEMAS_DIR} — apenas ficheiros .md serao comparados."
fi

TARGETS=(
  "orders:${ORDERS_BASE_DIR}/docs/contracts"
  "payments:${PAYMENTS_BASE_DIR}/docs/contracts"
)

failures=0

compare_file() {
  local label="$1"
  local core_file="$2"
  local target_file="$3"

  if [[ ! -f "${target_file}" ]]; then
    echo "[FALHA] ${label} — ficheiro em falta: ${target_file}"
    return 1
  fi
  if cmp -s "${core_file}" "${target_file}"; then
    echo "[OK] ${label}"
    return 0
  fi
  echo "[FALHA] ${label} — drift (diff entre Core e espelho)"
  return 1
}

for entry in "${TARGETS[@]}"; do
  IFS=: read -r name path <<< "${entry}"
  echo ""
  echo "=== Alvo: ${name} (${path}) ==="

  if [[ ! -d "${path}" ]]; then
    echo "[ERRO] Pasta nao encontrada: ${path}"
    failures=$((failures + 1))
    continue
  fi

  for file in "${FILES_MD[@]}"; do
    core_file="${CORE_CONTRACTS_DIR}/${file}"
    target_file="${path}/${file}"
    if [[ ! -f "${core_file}" ]]; then
      echo "[ERRO] Core sem ficheiro: ${core_file}"
      failures=$((failures + 1))
      continue
    fi
    if ! compare_file "${name}/${file}" "${core_file}" "${target_file}"; then
      failures=$((failures + 1))
    fi
  done

  for file in "${FILES_SCHEMA[@]}"; do
    core_file="${CORE_SCHEMAS_DIR}/${file}"
    target_file="${path}/schemas/${file}"
    if ! compare_file "${name}/schemas/${file}" "${core_file}" "${target_file}"; then
      failures=$((failures + 1))
    fi
  done
done

echo ""
if [[ "${failures}" -gt 0 ]]; then
  echo "[RESUMO] Drift de contratos: ${failures} problema(s)."
  exit 1
fi

echo "[RESUMO] Contratos e schemas canonicos alinhados com o Core."
