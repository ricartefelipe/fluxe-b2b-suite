# Design system — Fluxe B2B Suite (saas-suite-ui)

Tokens e padrões visuais usados no Admin Console, Ops Portal e Shop para manter consistência e acessibilidade.

---

## 1. Cores

### Light theme (`:root`)

| Token | Uso | Valor light |
|-------|-----|-------------|
| `--app-primary` | Ações principais, links | `#1565c0` |
| `--app-primary-light` | Hover, destaque | `#1976d2` |
| `--app-primary-dark` | Press | `#0d47a1` |
| `--app-bg` | Fundo da página | `#f4f6f9` |
| `--app-surface` | Cards, modais | `#fff` |
| `--app-surface-variant` | Header de tabela, alternado | `#f8fafc` |
| `--app-text` | Texto principal | `#263238` |
| `--app-text-secondary` | Legendas, hints | `#546e7a` |
| `--app-border` | Bordas | `#e0e0e0` |
| `--app-chip-allow-bg` / `-text` | Status positivo (ativo, pago) | Verde |
| `--app-chip-deny-bg` / `-text` | Status negativo (suspenso, erro) | Vermelho |
| `--app-chip-warn-bg` / `-text` | Status de atenção (pendente) | Laranja |

### Dark theme (`html.dark-theme`)

Os mesmos tokens são redefinidos para contraste adequado (ex.: `--app-bg: #121212`, `--app-surface: #1e1e1e`).

### Shop

O Shop usa aliases `--shop-*` que apontam para `--app-*`, garantindo a mesma paleta.

---

## 2. Espaçamento (grid 4px)

| Token | Valor | Uso |
|-------|--------|-----|
| `--app-space-4` | 4px | Gap entre ícone e texto |
| `--app-space-8` | 8px | Padding interno pequeno |
| `--app-space-12` | 12px | Gap entre controles |
| `--app-space-16` | 16px | Padding de card, gap entre seções |
| `--app-space-24` | 24px | Margin entre blocos |
| `--app-space-32` | 32px | Padding de página |
| `--app-space-48` | 48px | Estados vazios / loading |

---

## 3. Tipografia

| Token | Valor | Uso |
|-------|--------|-----|
| `--app-font-size-caption` | 12px | Legendas, chips |
| `--app-font-size-body` | 14px | Corpo de texto |
| `--app-font-size-subtitle` | 16px | Subtítulo |
| `--app-font-size-title` | 18px | Título de card |
| `--app-font-size-headline` | 22px | Título de seção |
| `--app-font-size-display` | 26px | Título de página |
| `--app-line-height-tight` | 1.25 | Títulos |
| `--app-line-height-normal` | 1.5 | Corpo |
| `--app-line-height-relaxed` | 1.75 | Texto longo |
| `--app-font-weight-medium` | 500 | Destaque |
| `--app-font-weight-semibold` | 600 | Títulos |
| `--app-font-weight-bold` | 700 | Ênfase |

Fonte: **Roboto** (Google Fonts).

---

## 4. Estados visuais

### Loading

Classe `.state-loading`: flex coluna, centralizado, `padding: var(--app-space-48) var(--app-space-24)`, texto secundário. Use com `<mat-spinner>` e uma mensagem.

### Empty

Classe `.state-empty`: flex coluna, centralizado, texto e CTA. Use com `saas-empty-state` ou ícone + título + subtítulo + botão.

### Error

Classe `.state-error`: igual ao empty, com `color: var(--app-chip-deny-text)`.

### Success

Feedback de ação bem-sucedida: snackbar (verde) ou card de confirmação com ícone de check.

---

## 5. Componentes reutilizáveis

- **StatusChip**: status de tenant, pedido, pagamento (allow/deny/warn).
- **PlanChip**: plano do tenant (Starter, Professional, Enterprise) com ícone e cor.
- **EmptyStateComponent**: ícone, título, subtítulo opcional.
- **ErrorPageComponent**: página 403/404 com título e mensagem.
- **ConfirmDialogComponent**: alertdialog com título, mensagem, cancelar e confirmar.

---

## 6. Acessibilidade

- **Foco visível**: `outline: 2px solid var(--app-primary)` em `:focus-visible` para botões e links.
- **Skip link**: primeiro elemento focável; leva ao `#main-content`.
- **Roles e ARIA**: dialogs com `aria-labelledby` e `aria-describedby`; chips com `role="status"`.
- **Contraste**: paleta light/dark pensada para WCAG AA no texto principal e secundário.

---

## 7. Transições

- Troca de tema: `transition: background-color 0.3s, color 0.3s` no `body`.
- Cards e botões: `transition: box-shadow 0.2s ease, transform 0.2s ease` para hover/focus.
- Sidebar: `transition: margin-left 0.2s ease`.

---

## 8. Onde os tokens estão definidos

- **Admin Console**: `apps/admin-console/src/styles.scss`
- **Ops Portal**: `apps/ops-portal/src/styles.scss`
- **Shop**: `apps/shop/src/styles.scss` (usa `--app-*` como fonte e `--shop-*` como alias).

Para novas telas, prefira usar os tokens em vez de valores fixos (ex.: `var(--app-space-16)` em vez de `16px`).
