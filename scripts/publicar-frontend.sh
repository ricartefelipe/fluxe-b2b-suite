#!/usr/bin/env bash
#
# Tenta ativar o GitHub Pages (source = GitHub Actions) e dar push na main.
# Se você já tiver o GitHub CLI (gh) logado uma vez na vida, este script faz TUDO sozinho.
#
# Uso: ./scripts/publicar-frontend.sh
# (rode de dentro da pasta fluxe-b2b-suite)
#

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$SUITE_ROOT"

# Descobrir owner/repo do remote
REMOTE_URL=""
if git remote get-url origin &>/dev/null; then
  REMOTE_URL="$(git remote get-url origin)"
fi

OWNER=""
REPO=""
if [[ "$REMOTE_URL" =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
  OWNER="${BASH_REMATCH[1]}"
  REPO="${BASH_REMATCH[2]%.git}"
fi

if [[ -z "$OWNER" || -z "$REPO" ]]; then
  echo "Não foi possível detectar o repositório GitHub (remote origin não é do GitHub?)."
  echo "Abra no navegador: https://github.com/SEU-USUARIO/fluxe-b2b-suite/settings/pages"
  echo "Em Source escolha GitHub Actions. Depois: git push origin main"
  exit 1
fi

PAGES_URL="https://github.com/${OWNER}/${REPO}/settings/pages"
SITE_URL="https://${OWNER}.github.io/${REPO}/"

echo ""
echo "=============================================="
echo "  Publicar frontend — Fluxe B2B Suite"
echo "=============================================="
echo ""

# 1) Tentar ativar Pages via API (gh precisa estar logado)
if command -v gh &>/dev/null; then
  if gh auth status &>/dev/null 2>&1; then
    echo "GitHub CLI (gh) está logado. Ativando Pages (source = GitHub Actions)..."
    if gh api "repos/${OWNER}/${REPO}/pages" -X PUT \
      -f build_type=workflow \
      -f 'source={"branch":"main","path":"/"}' \
      --silent 2>/dev/null; then
      echo "  Pages ativado com sucesso."
      PAGES_OK=1
    else
      echo "  Não foi possível ativar pela API (talvez precise ativar uma vez no navegador)."
      PAGES_OK=0
    fi
  else
    echo "O comando 'gh' está instalado mas você não está logado."
    echo "Rode UMA VEZ na vida:  gh auth login"
    echo "Depois rode este script de novo — aí ele fará tudo sozinho."
    echo ""
    PAGES_OK=0
  fi
else
  echo "O GitHub CLI (gh) não está instalado."
  echo "Para não precisar clicar em nada: instale e faça login:"
  echo "  https://cli.github.com/"
  echo "  Depois: gh auth login"
  echo ""
  PAGES_OK=0
fi

# 2) Se não ativou pela API, abrir a página para 1 clique
if [ "${PAGES_OK:-0}" -ne 1 ]; then
  echo "Abrindo a página de configuração no navegador. Faça UM clique:"
  echo "  → Em \"Source\" escolha \"GitHub Actions\" e salve."
  echo ""
  if command -v xdg-open &>/dev/null; then
    xdg-open "$PAGES_URL" 2>/dev/null || true
  elif command -v open &>/dev/null; then
    open "$PAGES_URL" 2>/dev/null || true
  else
    echo "Abra: $PAGES_URL"
  fi
  echo ""
fi

# 3) Dar push na main para disparar o deploy
echo "----------------------------------------------"
echo "Enviando o código para o GitHub (git push)..."
echo "----------------------------------------------"
BRANCH="$(git branch --show-current 2>/dev/null || echo "main")"
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  if git push origin "$BRANCH" 2>/dev/null; then
    echo ""
    echo "Push feito. Em 2 a 5 minutos o site estará no ar em:"
    echo "  $SITE_URL"
    echo ""
    exit 0
  else
    echo "Não foi possível dar push (verifique sua rede ou credenciais)."
    echo "Quando puder, rode: git push origin $BRANCH"
  fi
else
  echo "Você não está na branch main/master (está em: $BRANCH)."
  echo "Para publicar, envie a main: git push origin main"
fi

echo ""
echo "Quando o deploy terminar, acesse: $SITE_URL"
echo ""
