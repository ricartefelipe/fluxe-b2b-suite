#!/usr/bin/env bash
# Abre um PR develop → master em cada repositório do suite quando os SHAs divergem.
# Pré-requisitos: GitHub CLI (`gh`) autenticado; clones dos quatro repos sob o mesmo diretório pai do monorepo.
#
# Uso (na raiz do fluxe-b2b-suite):
#   ./scripts/promote-develop-to-master-pr.sh
#
# Depois: rever CI verde em cada PR e fazer merge conforme CHECKLIST-PROMOCAO-DEVELOP-MASTER.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
WORKSPACE_ROOT="$(cd "${SUITE_ROOT}/.." && pwd)"

REPOS=(fluxe-b2b-suite spring-saas-core node-b2b-orders py-payments-ledger)

promote_one() {
  local name="$1"
  local path="${WORKSPACE_ROOT}/${name}"
  if [[ ! -d "${path}/.git" ]]; then
    echo "[skip] ${name}: diretório não encontrado em ${path}"
    return 0
  fi

  git -C "${path}" fetch origin --quiet

  local mh dh
  mh="$(git -C "${path}" rev-parse origin/master)"
  dh="$(git -C "${path}" rev-parse origin/develop)"

  if [[ "${mh}" == "${dh}" ]]; then
    echo "[ok] ${name}: master e develop já no mesmo commit (${mh:0:7})"
    return 0
  fi

  local existing
  existing="$(gh pr list --repo "ricartefelipe/${name}" --base master --head develop --state open --json number --jq '.[0].number' 2>/dev/null || true)"
  if [[ -n "${existing}" && "${existing}" != "null" ]]; then
    echo "[open] ${name}: já existe PR #${existing} (develop → master)"
    return 0
  fi

  echo "[create] ${name}: abrindo PR develop → master …"
  gh pr create \
    --repo "ricartefelipe/${name}" \
    --base master \
    --head develop \
    --title "release: promote develop → master" \
    --body "Promoção automática via \`scripts/promote-develop-to-master-pr.sh\`.

Antes de mergear: [CHECKLIST-PROMOCAO-DEVELOP-MASTER.md](https://github.com/ricartefelipe/fluxe-b2b-suite/blob/develop/docs/CHECKLIST-PROMOCAO-DEVELOP-MASTER.md).
CI deve estar verde nos quatro repositórios."
}

command -v gh >/dev/null || {
  echo "Instale e autentique o GitHub CLI: https://cli.github.com/"
  exit 1
}

for r in "${REPOS[@]}"; do
  promote_one "${r}"
done

echo "Concluído."
