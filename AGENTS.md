# AGENTS.md — Diretrizes para IA no Fluxe B2B Suite

Este arquivo define regras e preferências para assistentes de código que trabalham neste repositório.

---

## Regras imutáveis (o agente aprende e aplica sempre)

- **Git Flow:** toda alteração via branch `feature/*` ou `fix/*` a partir de `develop` → PR → merge; nunca commit direto em `develop` ou `master`.
- **Sem menções a ferramentas em commits:** nunca incluir "Cursor", "Made with Cursor", "Copilot" ou similar em mensagens de commit.
- **Ao concluir:** fazer o processo de subida completo (branch, commit, push, PR, CI verde, merge) e, se aplicável, release `develop` → `master` para deploy em produção.

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

| Ambiente | Onde | Branch que “alimenta” o deploy | Dados |
|----------|------|--------------------------------|-------|
| **Local** | Máquina do dev | *(não há deploy)* — qualquer branch | Migration + seed até a tampa |
| **Staging** | Railway | **`develop`** | Migration + seed completo |
| **Produção** | Railway | **`master`** | Migration + só essencial |

- **“Subir ambiente local”** = Docker/scripts na máquina (`./scripts/up-local.sh`, `nx serve`, etc.) — ver doc.  
- **“Staging / produção”** = resultado do que está em **`develop`** / **`master`** no remoto após CI e deploy Railway — não é o mesmo que “processo de subida” Git (PR), embora o PR para `develop` seja o que **dispara** o deploy de staging.

Não presumir que staging/produção “não existem”. Não inventar setup sem checar a doc.

---

## Git Flow e protocolos

### Glossário (não confundir)

- **“Processo de subida” / “subir” / “git flow”** (o que o time pede ao terminar trabalho) = **este fluxo Git abaixo** (branch → commit → push → PR → `develop`). **Não** significa `pnpm dev`, `nx serve`, Docker local ou “subir servidor”, a menos que a pessoa peça explicitamente isso.

- Branches: `master` (prod), `develop` (staging), `feature/*`, `fix/*`
- Merge via PR; CI deve passar antes do merge
- Atualizar documentação quando alterar contratos, APIs, variáveis ou fluxos
- Ver [docs/PIPELINE-ESTEIRAS.md](docs/PIPELINE-ESTEIRAS.md) e [CONTRIBUTING.md](CONTRIBUTING.md)

### Ao terminar uma tarefa — processo de subida (obrigatório para o agente)

1. Garantir que está em `develop` atualizada: `git fetch origin && git checkout develop && git pull origin develop`
2. Criar branch: `git checkout -b feature/nome-descritivo` (ou `fix/...`) — **nunca** commitar direto na `develop`
3. Fazer alterações, `git add`, `git commit` (mensagem **sem** “Made-with: Cursor” ou similar)
4. `git push -u origin feature/nome-descritivo`
5. Abrir **PR para `develop`** (ou merge local seguindo o mesmo critério); **CI verde** antes de mergear
6. Após merge: apagar branch remota/local da feature quando aplicável
7. Release para produção: só depois de staging ok — PR `develop` → `master` conforme [PIPELINE-ESTEIRAS.md](docs/PIPELINE-ESTEIRAS.md)

Aplicar em **toda** tarefa que envolva commit.

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
