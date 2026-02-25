#!/usr/bin/env bash
#
# Abre a página de configuração do GitHub Pages e diz exatamente o que clicar.
# Você só precisa: 1) rodar este script  2) na página que abrir, escolher "GitHub Actions"  3) dar push na main
#
# Uso: ./scripts/abrir-config-pages.sh
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

PAGES_URL=""
if [[ "$REMOTE_URL" =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
  OWNER="${BASH_REMATCH[1]}"
  REPO="${BASH_REMATCH[2]%.git}"
  PAGES_URL="https://github.com/${OWNER}/${REPO}/settings/pages"
fi

echo ""
echo "=============================================="
echo "  Configurar GitHub Pages — Fluxe B2B Suite"
echo "=============================================="
echo ""

if [ -n "$PAGES_URL" ]; then
  echo "Vou abrir no navegador a página de configuração do GitHub Pages."
  echo ""
  if command -v xdg-open &>/dev/null; then
    xdg-open "$PAGES_URL" 2>/dev/null || true
  elif command -v open &>/dev/null; then
    open "$PAGES_URL" 2>/dev/null || true
  else
    echo "Abra manualmente no navegador:"
    echo "  $PAGES_URL"
    echo ""
  fi
else
  echo "Não foi possível detectar o repositório GitHub."
  echo "Abra no navegador:"
  echo "  https://github.com/SEU-USUARIO/fluxe-b2b-suite/settings/pages"
  echo "  (troque SEU-USUARIO pelo seu usuário do GitHub)"
  echo ""
fi

echo "----------------------------------------------"
echo "O QUE FAZER NA PÁGINA QUE ABRIU:"
echo "----------------------------------------------"
echo ""
echo "  1. Em \"Build and deployment\":"
echo "     - Onde está \"Source\", clique no dropdown."
echo "  2. Escolha: \"GitHub Actions\"."
echo "  3. Não precisa clicar em mais nada. Pode fechar a aba."
echo ""
echo "----------------------------------------------"
echo "DEPOIS:"
echo "----------------------------------------------"
echo ""
echo "  Envie o código para a branch main (se ainda não enviou):"
echo ""
echo "    git push origin main"
echo ""
echo "  (Ou, se sua branch principal for master: git push origin master)"
echo ""
echo "  Em 2 a 5 minutos o site estará no ar em:"
if [ -n "$PAGES_URL" ]; then
  echo "  https://${OWNER}.github.io/${REPO}/"
else
  echo "  https://SEU-USUARIO.github.io/fluxe-b2b-suite/"
fi
echo ""
echo "  (Troque SEU-USUARIO pelo seu usuário do GitHub se o link acima não aparecer.)"
echo ""
