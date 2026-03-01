# Front: o que falta para espelhar o negócio com segurança, performance e design de alto nível

Este documento lista o que **já está feito** e o que **ainda falta** no front (saas-suite-ui) para alinhar com o negócio de forma segura, performática e com design de qualidade.

**Última atualização:** após implementação de CSP, sanitização, budgets, tokens de design, preload e documento de design. Itens implementados estão marcados com ✅.

---

## 1. Segurança

### Já temos

- **AuthGuard**: rotas protegidas; não autenticado → redireciona para `/login`.
- **PermissionGuard** (agora em uso): rotas com `data.permissions` verificam se o usuário tem ao menos uma das permissões; sem permissão → redireciona para `/403`.
- **Sidebar**: itens de menu filtrados por permissão (`hasPermission`).
- **Interceptors**: `authInterceptor` envia Bearer no header; `errorInterceptor` trata 401 (logout + redirect), 403 (snackbar com permissionCode), 404, 409, 429, 5xx.
- **Token**: armazenado em memória/sessionStorage (dev); sem token em localStorage sensível.
- **Página 403**: rota dedicada com mensagem de acesso negado.
- ✅ **CSP (Content-Security-Policy)**: meta tag em `index.html` dos três apps (admin, ops, shop) com default-src, script-src, style-src, font-src, img-src, connect-src, frame-ancestors, base-uri, form-action.
- ✅ **Sanitização**: bootstrap error em `main.ts` escapa HTML antes de exibir; `highlightMatch` no global-search escapa texto e query antes de envolver em `<mark>` (evita XSS).
- **OIDC**: refresh silencioso já configurado em `OidcAuthService` (setupAutomaticSilentRefresh).

### O que falta

| Item | Prioridade | Descrição |
|------|------------|-----------|
| **OIDC em produção** | Alta | Garantir fluxo completo (callback, refresh, logout) documentado e testado com IdP real. |
| **Sem credenciais em código** | Média | Revisão final: URLs de API e issuer vêm de runtime config; conferir que nenhum secret está no bundle. |
| **HTTPS obrigatório** | Média | Em produção, garantir que o app só seja servido via HTTPS (configuração de deploy/reverse proxy). |

---

## 2. Performance

### Já temos

- **Lazy loading**: rotas com `loadComponent` / `loadChildren`; chunks separados por página.
- **Budgets**: admin-console (900 kB warning, 1,5 MB error; component style 6 kB / 10 kB); ops-portal (900 kB / 1,5 MB). 
- **Angular optimizations**: production com scripts/styles otimizados, output hashing.
- **One app per shell**: admin-console e ops-portal são builds separados; shop idem.

### O que falta

| Item | Prioridade | Descrição |
|------|------------|-----------|
| **Respeitar budgets** | Média | Budget inicial do admin-console foi ajustado para 900 kB (warning) / 1,5 MB (error); component style 6 kB / 10 kB. Redução futura: tree-shake de Material, mais code-split. |
| **Imagens e assets** | Média | Se houver imagens pesadas, usar lazy loading, formatos modernos (WebP/AVIF) e dimensões adequadas. |
| **Core Web Vitals** | Média | Medir LCP, FID/INP, CLS em produção (ex.: Lighthouse, RUM); definir metas e corrigir gargalos. |
| **Service Worker / PWA** | Baixa | Shop já tem PWA; admin e ops podem se beneficiar de cache de assets estáticos para repeat visits. |
| ✅ **Prefetch de rotas** | — | Admin e ops usam `withPreloading(PreloadAllModules)` para carregar chunks lazy após o carregamento inicial. |

---

## 3. Design “dos deuses”

### Já temos

- **Design system em CSS vars**: `--app-primary`, `--app-surface`, `--app-text`, chips (allow/deny/warn), dark theme.
- ✅ **Tokens de tipografia e espaçamento**: `--app-space-*` (4–48 px), `--app-font-size-*`, `--app-line-height-*`, `--app-font-weight-*` em admin e ops.
- ✅ **Estados visuais**: classes `.state-loading`, `.state-empty`, `.state-error` nos estilos globais (admin e ops).
- ✅ **Shop alinhado à suite**: `apps/shop/src/styles.scss` define `--app-*` e `--shop-*` como alias; mesma paleta e dark theme.
- ✅ **Documento de design**: `docs/DESIGN-SYSTEM.md` com cores, espaçamento, tipografia, estados e componentes.
- **Angular Material**: componentes consistentes (tabelas, cards, stepper, formulários, dialogs).
- **Tema claro/escuro**: toggle no header; variáveis específicas para `html.dark-theme`.
- **i18n**: pt-BR e en-US; mensagens centralizadas.
- **Componentes reutilizáveis**: StatusChip, PlanChip, EmptyState, ErrorPage, ConfirmDialog, SkipLink, LiveAnnouncer.
- **Responsividade**: media queries em listas, onboarding, dashboard, checkout.
- **Acessibilidade básica**: roles, aria-labels em chips e ícones; skip link; foco em navegação.

### O que falta

| Item | Prioridade | Descrição |
|------|------------|-----------|
| **Tipografia e hierarquia** | Alta | Definir escala tipográfica única (títulos, corpo, legendas), line-height e peso; aplicar em todas as páginas para hierarquia visual clara. |
| **Espaçamento sistemático** | Alta | Grid de espaçamento (ex.: 4/8/16/24/32 px) e aplicar de forma consistente (padding, margin, gap). |
| **Estados visuais** | Alta | Loading, empty, error e success padronizados em todas as listagens e formulários (skeleton, ilustrações ou ícones, mensagens claras). |
| **Microinterações** | Média | Transições suaves em navegação, abertura de modais, hover/focus em botões e cards; feedback imediato em ações (ex.: criar tenant, salvar). |
| **Paleta e contraste** | Média | Revisar contraste (WCAG AA mínimo) em texto e chips; garantir que primary/accent funcionem em fundos claro e escuro. |
| **Documento de design** | Média | Um único doc (ou Storybook) com tokens (cores, espaços, tipografia), componentes e exemplos de uso para alinhar time e futuras features. |
| **Acessibilidade completa** | Média | Testes com leitor de tela; foco preso em modais; ordem de tab lógica; mensagens de erro associadas a campos. |
| **Shop alinhado à suite** | Média | Shop usa `--shop-*`; unificar com `--app-*` onde fizer sentido para identidade visual única. |
| **Ilustrações e empty states** | Baixa | Empty states com ilustração ou ícone grande + CTA claro (já temos EmptyState; padronizar copy e arte). |
| **Onboarding de primeiro acesso** | Baixa | Tour ou dicas na primeira vez que o usuário entra (ex.: “Aqui você gerencia tenants”). |

---

## 4. Resumo executivo

- **Segurança**: ✅ CSP em todos os apps; ✅ sanitização no bootstrap error e no global-search; PermissionGuard em uso; OIDC com silent refresh. Pendente: validar OIDC em produção, HTTPS no deploy.
- **Performance**: ✅ Budgets ajustados (admin 900 kB / 1,5 MB; component style 6 kB / 10 kB); ✅ PreloadAllModules para prefetch de rotas. Pendente: Core Web Vitals, PWA para admin/ops.
- **Design**: ✅ Tokens de tipografia e espaçamento; ✅ estados loading/empty/error; ✅ Shop alinhado a `--app-*`; ✅ `docs/DESIGN-SYSTEM.md`. Pendente: microinterações, a11y completa, ilustrações.

Priorizando **OIDC em produção**, **medir Core Web Vitals** e **microinterações + a11y** o front fica ainda mais alinhado ao negócio.
