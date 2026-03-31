# Documentação — Fluxe B2B Suite

Índice da documentação do repositório principal da suite.

---

## Documentos disponíveis

| Documento | Descrição |
|-----------|-----------|
| [README.md](README.md) | Este índice |
| [AMBIENTES-CONFIGURACAO.md](AMBIENTES-CONFIGURACAO.md) | Configuração dos 3 ambientes: local, staging, produção (inclui como alimentar staging com dados) |
| [GO-LIVE-VENDA.md](GO-LIVE-VENDA.md) | Checklist completo go-live para venda (produção, Stripe, Resend, domínio, OIDC, migrations, termos) |
| [EXECUCAO-VENDA-MONITORIZACAO.md](EXECUCAO-VENDA-MONITORIZACAO.md) | Playbook único: staging, smoke pedido/PAID, monitorização, promoção e produção |
| [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md) | Deploy no Railway: serviços, variáveis, migrations, seed (staging vs produção), domínio customizado e SSL |
| [URLS-AMBIENTES.md](URLS-AMBIENTES.md) | URLs de staging e production (fronts e APIs) e usuário inicial nos 3 fronts |
| [PIPELINE-ESTEIRAS.md](PIPELINE-ESTEIRAS.md) | Pipeline, esteiras develop/master, release e tags, protocolos (Git Flow, qualidade, testes, CI/CD, docs) |
| [CHECKLIST-PROMOCAO-DEVELOP-MASTER.md](CHECKLIST-PROMOCAO-DEVELOP-MASTER.md) | Checklist único antes de promover `develop` → `master` |
| [POLITICA-FREEZE-RELEASE.md](POLITICA-FREEZE-RELEASE.md) | Política de freeze por risco (P0/P1) em release |
| [TEMPLATE-RELEASE-NOTES.md](TEMPLATE-RELEASE-NOTES.md) | Template de release notes multi-repo |
| [RUNBOOK-ROLLBACK.md](RUNBOOK-ROLLBACK.md) | Runbook enxuto de rollback por serviço |
| [ANALISE-ESTATICA.md](ANALISE-ESTATICA.md) | Decisão Semgrep + linters (substituto Sonar-like) |
| [MONITORING-THRESHOLDS.md](MONITORING-THRESHOLDS.md) | Thresholds p95/5xx/filas e mapeamento de alertas |
| [BACKLOG-MELHORIA-SISTEMICA-2026-03.md](BACKLOG-MELHORIA-SISTEMICA-2026-03.md) | Backlog executável EPIC A–D (estado de execução) |
| [FLUXO-PR-FEATURE.md](FLUXO-PR-FEATURE.md) | Fluxo resumido: feature branch → PR → merge → apagar branch |
| [BRANCHES-E-WORKFLOWS.md](BRANCHES-E-WORKFLOWS.md) | **Matriz factual:** que ramos disparam que workflows (sem suposições sobre ambientes) |
| [DEPLOY-GITHUB.md](DEPLOY-GITHUB.md) | Deploy via GitHub Actions (CI, Cloudflare Pages, VPS) |
| [OBSERVABILITY.md](OBSERVABILITY.md) | Observabilidade: Sentry, logging, correlation, backup (todos os serviços) |
| [GUIA-DEPLOY-PASSO-A-PASSO.md](GUIA-DEPLOY-PASSO-A-PASSO.md) | Deploy completo passo a passo (servidor, Docker, domínios, SSL) |
| [GUIA-OPERACIONAL.md](GUIA-OPERACIONAL.md) | Visão geral dos 4 serviços, diagrama de dependência e procedimentos operacionais |
| [MANUAL-SISTEMA.md](MANUAL-SISTEMA.md) | Manual completo: arquitetura, segurança, fluxos E2E, APIs e operação |
| [VISTORIA-COMPLETA.md](VISTORIA-COMPLETA.md) | Vistoria dos 4 serviços: o que falta, o que ficou pela metade, o que está inconsistente |
| [O-QUE-FALTA-100-VENDAVEL.md](O-QUE-FALTA-100-VENDAVEL.md) | Checklist do que falta para o produto estar 100% vendável (config, legal, suporte, CORS) |
| [STACK-E-FERRAMENTAS.md](STACK-E-FERRAMENTAS.md) | O que já usamos (Rabbit, Redis, métricas, Grafana, circuit breaker) e o que pode ser adicionado (Kafka, NoSQL pro front, Sonar) |
| [CACHE-REDIS-FRONT.md](CACHE-REDIS-FRONT.md) | Cache Redis para respostas consumidas pelo front (padrão de chave, TTL, exemplos por stack) |

### Documentação auto-gerada

| Documento | Descrição |
|-----------|-----------|
| [DOCUMENTACAO-VIVA.md](DOCUMENTACAO-VIVA.md) | Documentação viva consolidada (gerada por `scripts/generate-docs.sh`) |
| [CATALOGO-API.md](CATALOGO-API.md) | Catálogo de todos os endpoints REST dos 3 serviços backend (gerado por `scripts/api-catalog.py`) |
| [CATALOGO-EVENTOS.md](CATALOGO-EVENTOS.md) | Catálogo completo de eventos RabbitMQ: exchanges, routing keys, schemas, payloads |
| [REFERENCIA-CONFIGURACAO.md](REFERENCIA-CONFIGURACAO.md) | Referência de todas as variáveis de ambiente por serviço |
| [TERMOS-PRIVACIDADE.md](TERMOS-PRIVACIDADE.md) | Referência para publicação de Termos de Uso e Política de Privacidade |

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
| **ESTADO-ENTREGA.md** | Estado da entrega: pronto para venda vs em progresso _(parcialmente coberto por_ [O-QUE-FALTA-100-VENDAVEL.md](O-QUE-FALTA-100-VENDAVEL.md)_)_ |
| **PUBLICAR-PASSO-A-PASSO.md** | Publicar frontend (GitHub Pages) ou aplicação completa (Railway) |

---

## Documentação em outros repositórios

- **spring-saas-core:** `docs/PROMPT-EVOLUCAO.md`, `docs/BACKLOG-EVOLUCAO.md`, `docs/compliance.md`, `docs/contracts/`
- **node-b2b-orders:** `docs/contracts/`, `docs/api/`
- **py-payments-ledger:** `docs/contracts/events.md`, `docs/architecture/`, `ROADMAP.md`

**Contrato de eventos RabbitMQ:** a fonte de verdade é **spring-saas-core** `docs/contracts/events.md`. Os repositórios **node-b2b-orders** e **py-payments-ledger** mantêm o mesmo texto com preâmbulo (réplica); alterações ao contrato devem ser feitas primeiro no Core e depois espelhadas.
