# Contribuindo — Fluxe B2B Suite

Siga os protocolos definidos em **[docs/PIPELINE-ESTEIRAS.md](docs/PIPELINE-ESTEIRAS.md)**.

---

## Resumo rápido

| Área | Protocolo |
|------|------------|
| **Git Flow** | `feature/*` ou `fix/*` → merge em develop (--no-ff) → push → staging. merge develop→master quando pronto para prod |
| **Qualidade** | Lint, testes e build devem passar no CI antes do merge |
| **Testes** | Não fazer merge com testes quebrados; coverage mantido |
| **CI/CD** | develop → staging; master → production |
| **Documentação** | Atualizar contratos, API, variáveis e guias conforme mudanças |

### E2E (Playwright) na máquina local (Linux)

Se os testes E2E falharem por dependências de browser no sistema, instalar as libs do host: `pnpm exec playwright install-deps` (a partir de `saas-suite-ui`, com permissões adequadas) ou seguir a mensagem do Playwright após `pnpm exec playwright install`.

---

## Links

- [Pipeline e esteiras (desenvolvimento, CI, deploy)](docs/PIPELINE-ESTEIRAS.md)
- [Guia do sistema](docs/GUIA-DO-SISTEMA.md)
- [Manual operacional](docs/GUIA-OPERACIONAL.md)
- [Índice da documentação](docs/README.md)
