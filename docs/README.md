# Documentação — Fluxe B2B Suite

Índice da documentação do repositório principal da suite.

---

## Documentos disponíveis

| Documento | Descrição |
|-----------|-----------|
| [README.md](README.md) | Este índice |
| [OBSERVABILITY.md](OBSERVABILITY.md) | Observabilidade: Sentry, logging, correlation, backup (todos os serviços) |
| [GUIA-DEPLOY-PASSO-A-PASSO.md](GUIA-DEPLOY-PASSO-A-PASSO.md) | Deploy completo passo a passo (servidor, Docker, domínios, SSL) |
| [VISTORIA-COMPLETA.md](VISTORIA-COMPLETA.md) | Vistoria dos 4 serviços: o que falta, o que ficou pela metade, o que está inconsistente |

---

## Roadmap de documentação

Documentos futuros planejados (ainda não criados):

- **E2E-RUN.md** — Subir os 4 repos integrados (envs, JWT, RabbitMQ) e sugestões de hospedagem
- **ESTADO-ENTREGA.md** — Estado da entrega: pronto para venda vs em progresso
- **regras-de-negocio.md** — Regras de negócio: auth, pedidos, pagamentos, inventário, core, frontend
- **DAS.md** — Documento de Arquitetura de Software
- **C4-suite.md** — Diagramas C4 da suite e fluxo Orders ↔ Payments
- **historias-de-usuario.md** — Histórias de usuário (Ops, Admin, Shop, Auth)
- **documento-implantacao.md** — Ordem de deploy, variáveis por serviço, health checks, rollback
- **ci-cd-e-deploy.md** — CI (GitHub Actions) por repo; CD/deploy
- **PROMPT-CONCLUSAO-VISTORIA.md** — Critérios de qualidade e etapas finais para estado vendável
- **PUBLICAR-PASSO-A-PASSO.md** — Publicar frontend (GitHub Pages) ou aplicação completa (Railway)

> **Nota:** `PROMPT-EVOLUCAO.md` existe em `spring-saas-core/docs/PROMPT-EVOLUCAO.md`.

---

## Outros repositórios

- **spring-saas-core:** `docs/PROMPT-EVOLUCAO.md`, `docs/BACKLOG-EVOLUCAO.md`, `docs/compliance.md`, `docs/contracts/`
- **node-b2b-orders:** `docs/contracts/`, `docs/api/`
- **py-payments-ledger:** `docs/contracts/events.md`, `docs/architecture/`, `ROADMAP.md`
