# Template — release notes (multi-repo)

Usar quando uma release envolve **mais do que um** repositório (Core, Orders, Payments, Suite). Copiar para GitHub Release ou para secções do `CHANGELOG.md` de cada repo.

---

## Fluxe B2B Suite — v`X.Y.Z` — `AAAA-MM-DD`

### Resumo

- Uma frase sobre o tema da release (ex.: “Correções de auth em staging + smoke HTTP”).

### spring-saas-core

- **Adicionado** / **Alterado** / **Corrigido** (bullets).

### node-b2b-orders

- …

### py-payments-ledger

- …

### fluxe-b2b-suite (UI / scripts)

- …

### Contratos

- Drift: nenhum / referência a alterações em `docs/contracts` (link para PR).

### Migrações

- Liquibase / Prisma / Alembic: listar IDs ou nomes dos changesets relevantes.

### Operação

- Variáveis novas ou alteradas (nome, não valores secretos).
- Passos manuais (seed, reprocessamento de fila), se houver.

### Rollback

- Tag ou imagem anterior segura; ver [RUNBOOK-ROLLBACK.md](RUNBOOK-ROLLBACK.md).

---

## Versão por repositório

| Repo | Tag sugerida | Nota |
|------|----------------|------|
| spring-saas-core | `vX.Y.Z` | Alinhar com breaking change no Core |
| node-b2b-orders | `vX.Y.Z` | Idem se houve mudança |
| py-payments-ledger | `vX.Y.Z` | Idem |
| fluxe-b2b-suite | `vX.Y.Z` | Idem |

Se só um repo mudou, pode tagar só esse repo; ainda assim documentar dependências de versão em runtime.
