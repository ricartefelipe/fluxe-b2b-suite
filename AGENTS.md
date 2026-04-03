# AGENTS.md — Diretrizes para IA no Fluxe B2B Suite

Este arquivo define regras e preferências para assistentes de código que trabalham neste repositório.

---

## Regras imutáveis (o agente aprende e aplica sempre)

- **Git Flow:** toda alteração via branch `feature/*` ou `fix/*` a partir de `develop` → PR → merge; nunca commit direto em `develop` ou `master`.
- **Base das branches:** antes de criar `feature/*` ou `fix/*`, atualizar `develop` (`git fetch origin && git checkout develop && git pull origin develop`) e só então `git checkout -b feature/...` ou `fix/...`. Nunca abrir trabalho novo a partir de `master` ou de outra feature sem alinhamento explícito.
- **Sem marcas de ferramentas em artefactos Git ou docs:** não incluir nomes comerciais de IDEs ou assistentes em commits, merges, títulos de PR nem em documentação do repositório (incluindo rodapés automáticos de ferramentas).
- **Ao concluir:** fazer o processo de subida completo (branch, commit, push, PR, CI verde, merge em `develop`). **Release para produção** (`develop` → `master`) é da responsabilidade do utilizador; o agente só executa quando o utilizador pedir e seguindo as preferências dele (ver secção "Release para produção").

### Papel do agente e delegação (autorização explícita)

- O utilizador pode delegar a **execução técnica completa** no repositório: branches, implementação, testes, lint, format, commit, push, PR e merge em `develop` quando o CI estiver verde, mais docs alinhadas com o código quando o contrato mudar.
- **Arquiteto (autorização contínua):** em modo arquiteto, o agente **não precisa** de confirmação explícita **por tarefa** para abrir PR, fazer merge em `develop` após CI verde, ou concluir o fluxo Git habitual; deve **avisar** o utilizador ao terminar (resumo, links do PR, estado do CI). Continua a valer: nunca referências a nomes comerciais de IDEs ou de produtos de assistência a código em commits, merges, PRs ou documentação do repositório.
- **Expectativa:** o agente **confirma explicitamente** quando está tudo **correto e verificado** (o que correu, resultado dos comandos), sem exigir que o utilizador repita passos que o próprio agente pode fazer no workspace.
- **Limites fora do repo:** o agente **não** acede a contas de terceiros (Railway, Resend, DNS, login GitHub no browser), nem executa `sudo` na máquina do utilizador. Aí apenas **prepara** variáveis, diffs, PRs e checklists; o que exige painel ou credenciais humanas fica indicado de forma mínima.

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

**Função:** **Staging** é para **testar** (integração, QA, demos); **produção** é **para valer** (clientes, dados e operações reais). Não confundir staging com produção.

- **“Subir ambiente local”** = Docker/scripts na máquina (`./scripts/up-local.sh`, `nx serve`, etc.) — ver doc.  
- **“Staging / produção”** = resultado do que está em **`develop`** / **`master`** no remoto após CI e deploy Railway — não é o mesmo que “processo de subida” Git (PR), embora o PR para `develop` seja o que **dispara** o deploy de staging.

Não presumir que staging/produção “não existem”. Não inventar setup sem checar a doc.

---

## Git Flow e protocolos

### Glossário (não confundir)

- **“Processo de subida” / “subir” / “git flow”** (o que o time pede ao terminar trabalho) = **este fluxo Git abaixo** (branch → commit → push → PR → `develop`). **Não** significa `pnpm dev`, `nx serve`, Docker local ou “subir servidor”, a menos que a pessoa peça explicitamente isso.

- Branches: `master` (prod), `develop` (staging), `feature/*`, `fix/*`
- Merge via PR; CI deve passar antes do merge
- **Mensagens de commit:** proibido citar o IDE ou ferramenta (ex.: não incluir "Made with …" no corpo da mensagem). Remover qualquer trailer de atribuição antes de commitar ou no amend.
- Atualizar documentação quando alterar contratos, APIs, variáveis ou fluxos
- Ver [docs/PIPELINE-ESTEIRAS.md](docs/PIPELINE-ESTEIRAS.md) e [CONTRIBUTING.md](CONTRIBUTING.md)

### Ao terminar uma tarefa — processo de subida (obrigatório para o agente)

1. Garantir que está em `develop` atualizada: `git fetch origin && git checkout develop && git pull origin develop`
2. Criar branch: `git checkout -b feature/nome-descritivo` (ou `fix/...`) — **nunca** commitar direto na `develop`
3. Fazer alterações, `git add`, `git commit` (mensagem profissional, **sem** rodapés ou marcas de ferramentas)
4. `git push -u origin feature/nome-descritivo`
5. Abrir **PR para `develop`** (ou merge local seguindo o mesmo critério); **CI verde** antes de mergear
6. Após merge: apagar branch remota/local da feature quando aplicável
7. **Release para produção:** não fazer merge `develop` → `master` nem criar/mergear o PR de release por iniciativa própria. O responsável pela release é o utilizador; quando ele pedir, executar conforme a secção abaixo.

Aplicar em **toda** tarefa que envolva commit.

### Release para produção (responsabilidade do utilizador)

- **Dono do processo:** o utilizador é o responsável pela release; o agente segue as preferências dele.
- **Sem pedido explícito:** o agente não abre nem mergeia PR `develop` → `master` nem faz deploy para produção.
- **Quando o utilizador pedir release:** o agente deve fazer exactamente como o utilizador prefere. Preferências a aplicar (a documentar/refinar pelo utilizador):
  - Repos em que fazer release (ex.: fluxe-b2b-suite, spring-saas-core; um de cada vez ou em conjunto).
  - Nome/título do PR de release (ex.: "Release: develop → master", "Deploy produção", etc.).
  - Se criar tag (ex.: `v1.2.3`) e em que momento.
  - Se actualizar CHANGELOG ou release notes antes do merge.
  - Quem faz o merge (utilizador faz manualmente ou o agente pode fazer após aprovação).
  - Ordem dos repos (ex.: primeiro Core, depois frontend).
- **Referência:** [PIPELINE-ESTEIRAS.md](docs/PIPELINE-ESTEIRAS.md) — merge manual de develop em master quando pronto; CI verde antes do merge.

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
