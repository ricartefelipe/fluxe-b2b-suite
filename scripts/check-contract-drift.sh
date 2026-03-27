#!/usr/bin/env bash
set -euo pipefail

# Contract drift checker between spring-saas-core and consuming services.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE_DIR="$(cd "${ROOT_DIR}/.." && pwd)"
CORE_BASE_DIR="${CORE_BASE_DIR:-${WORKSPACE_DIR}/spring-saas-core}"
ORDERS_BASE_DIR="${ORDERS_BASE_DIR:-${WORKSPACE_DIR}/node-b2b-orders}"
PAYMENTS_BASE_DIR="${PAYMENTS_BASE_DIR:-${WORKSPACE_DIR}/py-payments-ledger}"
CORE_CONTRACTS_DIR="${CORE_BASE_DIR}/docs/contracts"

TARGETS=(
  "${ORDERS_BASE_DIR}/docs/contracts"
  "${PAYMENTS_BASE_DIR}/docs/contracts"
)

FILES_TO_COMPARE=(
  "events.md"
  "headers.md"
  "identity.md"
)

if [[ ! -d "${CORE_CONTRACTS_DIR}" ]]; then
  echo "[ERROR] Core contracts directory not found: ${CORE_CONTRACTS_DIR}"
  exit 2
fi

failures=0
for target_dir in "${TARGETS[@]}"; do
  if [[ ! -d "${target_dir}" ]]; then
    echo "[ERROR] Target contracts directory not found: ${target_dir}"
    failures=$((failures + 1))
    continue
  fi

  echo ""
  echo "Checking target: ${target_dir}"
  for file in "${FILES_TO_COMPARE[@]}"; do
    core_file="${CORE_CONTRACTS_DIR}/${file}"
    target_file="${target_dir}/${file}"

    if [[ ! -f "${target_file}" ]]; then
      echo "[FAIL] Missing file: ${target_file}"
      failures=$((failures + 1))
      continue
    fi

    if cmp -s "${core_file}" "${target_file}"; then
      echo "[PASS] ${file}"
    else
      echo "[FAIL] Drift detected in ${file}"
      failures=$((failures + 1))
    fi
  done
done

echo ""
if [[ "${failures}" -gt 0 ]]; then
  echo "[SUMMARY] Contract drift check failed (${failures} issue(s))."
  exit 1
fi

echo "[SUMMARY] Contracts are in sync across repositories."
