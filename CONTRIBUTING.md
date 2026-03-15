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

---

## Links

- [Pipeline e esteiras (desenvolvimento, CI, deploy)](docs/PIPELINE-ESTEIRAS.md)
- [Guia do sistema](docs/GUIA-DO-SISTEMA.md)
- [Manual operacional](docs/GUIA-OPERACIONAL.md)
- [Índice da documentação](docs/README.md)
