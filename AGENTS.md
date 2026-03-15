# AGENTS.md — Diretrizes para IA no Fluxe B2B Suite

Este arquivo define regras e preferências para assistentes de código (Cursor, Copilot, etc.) que trabalham neste repositório.

---

## Código limpo (obrigatório)

- **Sem código morto:** não deixar funções, variáveis ou imports não usados
- **Nomes descritivos:** variáveis, funções e arquivos com nomes que explicam o propósito
- **Funções pequenas:** uma responsabilidade por função; extrair lógica complexa
- **Sem comentários óbvios:** código autoexplicativo; comentar apenas o "porquê", não o "o quê"
- **Formatting consistente:** seguir ESLint/Prettier (frontend), Spotless (Java), Black/Ruff (Python)
- **Não quebrar o que funciona:** antes de refatorar, garantir que testes passam e comportamento é preservado

---

## Ambientes

O projeto tem **três ambientes** bem definidos. Ver [docs/AMBIENTES-CONFIGURACAO.md](docs/AMBIENTES-CONFIGURACAO.md):

| Ambiente | Uso | Dados |
|----------|-----|-------|
| **Local** | Dev na máquina | Migration + seed até a tampa |
| **Staging** | Railway, branch develop | Migration + seed completo |
| **Produção** | Railway, branch master | Migration + só essencial |

Não presumir que "ambiente não existe" — staging e produção já foram usados. Não inventar passos de setup do zero sem checar a doc.

---

## Git Flow e protocolos

- Branches: `master` (prod), `develop` (staging), `feature/*`, `fix/*`
- Merge via PR; CI deve passar antes do merge
- Atualizar documentação quando alterar contratos, APIs, variáveis ou fluxos
- Ver [docs/PIPELINE-ESTEIRAS.md](docs/PIPELINE-ESTEIRAS.md) e [CONTRIBUTING.md](CONTRIBUTING.md)

---

## Testes e qualidade

- **Não quebrar testes:** alterações devem manter ou melhorar cobertura
- **Não remover ou desabilitar testes** para "consertar" build
- Lint, format e testes devem passar no CI
- Evitar mudanças que introduzam warnings ou erros de tipo

---

## Quando alterar código

- **Evitar refatorações desnecessárias** — mudar só o necessário para o objetivo
- **Não "arrumar" código que não foi pedido** — focar no escopo da tarefa
- **Respeitar a arquitetura existente** — hexagonal, ABAC, JWT padronizado, etc.
- **Se errar e "cagar o código":** admitir, reverter ou corrigir, não deixar quebrado

---

## Documentação

- Manter docs sincronizados com o código
- Contratos: `docs/contracts/`, OpenAPI, `CATALOGO-API.md`, `CATALOGO-EVENTOS.md`
- Ambientes e deploy: `AMBIENTES-CONFIGURACAO.md`, `DEPLOY-RAILWAY.md`, `PIPELINE-ESTEIRAS.md`
