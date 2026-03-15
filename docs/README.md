# Documentação — Fluxe B2B Suite

Índice da documentação do repositório principal da suite.

---

## Documentos disponíveis

| Documento | Descrição |
|-----------|-----------|
| [README.md](README.md) | Este índice |
| [AMBIENTES-CONFIGURACAO.md](AMBIENTES-CONFIGURACAO.md) | Configuração dos 3 ambientes: local, staging, produção (inclui como alimentar staging com dados) |
| [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md) | Deploy no Railway: serviços, variáveis, migrations e seed (staging vs produção) |
| [PIPELINE-ESTEIRAS.md](PIPELINE-ESTEIRAS.md) | Pipeline, esteiras develop/master e protocolos (Git Flow, qualidade, testes, CI/CD, docs) |
| [OBSERVABILITY.md](OBSERVABILITY.md) | Observabilidade: Sentry, logging, correlation, backup (todos os serviços) |
| [GUIA-DEPLOY-PASSO-A-PASSO.md](GUIA-DEPLOY-PASSO-A-PASSO.md) | Deploy completo passo a passo (servidor, Docker, domínios, SSL) |
| [GUIA-OPERACIONAL.md](GUIA-OPERACIONAL.md) | Visão geral dos 4 serviços, diagrama de dependência e procedimentos operacionais |
| [MANUAL-SISTEMA.md](MANUAL-SISTEMA.md) | Manual completo: arquitetura, segurança, fluxos E2E, APIs e operação |
| [VISTORIA-COMPLETA.md](VISTORIA-COMPLETA.md) | Vistoria dos 4 serviços: o que falta, o que ficou pela metade, o que está inconsistente |

### Documentação auto-gerada

| Documento | Descrição |
|-----------|-----------|
| [DOCUMENTACAO-VIVA.md](DOCUMENTACAO-VIVA.md) | Documentação viva consolidada (gerada por `scripts/generate-docs.sh`) |
| [CATALOGO-API.md](CATALOGO-API.md) | Catálogo de todos os endpoints REST dos 3 serviços backend (gerado por `scripts/api-catalog.py`) |
| [CATALOGO-EVENTOS.md](CATALOGO-EVENTOS.md) | Catálogo completo de eventos RabbitMQ: exchanges, routing keys, schemas, payloads |
| [REFERENCIA-CONFIGURACAO.md](REFERENCIA-CONFIGURACAO.md) | Referência de todas as variáveis de ambiente por serviço |

### Scripts de documentação

| Script | Descrição |
|--------|-----------|
| [scripts/generate-docs.sh](scripts/generate-docs.sh) | Gera `DOCUMENTACAO-VIVA.md` — conecta nos serviços ou roda em modo `--offline` |
| [scripts/api-catalog.py](scripts/api-catalog.py) | Gera `CATALOGO-API.md` via parsing estático do código-fonte (sem dependências externas) |

### Scripts operacionais (ambientes)

| Script | Descrição |
|--------|-----------|
| [scripts/staging-seed.sh](../scripts/staging-seed.sh) | Alimenta **staging** com dados (migrations + seeds) via Railway CLI; ver [AMBIENTES-CONFIGURACAO.md](AMBIENTES-CONFIGURACAO.md) |
| [scripts/demo-seed.sh](../scripts/demo-seed.sh) | Popula dados demo via API (local ou staging); requer backends no ar |

---

## Documentação planejada (roadmap)

Documentos futuros ainda não criados:

| Documento | Descrição planejada |
|-----------|---------------------|
| **C4-suite.md** | Diagramas C4 da suite e fluxo Orders ↔ Payments |
| **documento-implantacao.md** | Ordem de deploy, variáveis por serviço, health checks, rollback |
| **ci-cd-e-deploy.md** | CI (GitHub Actions) por repo; CD/deploy |
| **E2E-RUN.md** | Subir os 4 repos integrados (envs, JWT, RabbitMQ) e sugestões de hospedagem |
| **ESTADO-ENTREGA.md** | Estado da entrega: pronto para venda vs em progresso |
| **PUBLICAR-PASSO-A-PASSO.md** | Publicar frontend (GitHub Pages) ou aplicação completa (Railway) |

---

## Documentação em outros repositórios

- **spring-saas-core:** `docs/PROMPT-EVOLUCAO.md`, `docs/BACKLOG-EVOLUCAO.md`, `docs/compliance.md`, `docs/contracts/`
- **node-b2b-orders:** `docs/contracts/`, `docs/api/`
- **py-payments-ledger:** `docs/contracts/events.md`, `docs/architecture/`, `ROADMAP.md`
