# Estado das Entregas (operacional)

Quadro vivo para execução no modo "concluir e marcar".

Legenda de status:
- `concluida`: entregue e mergeada
- `em_execucao`: em desenvolvimento/revisao
- `proxima`: pronta para iniciar
- `bloqueada`: depende de decisao/infra

---

## Entregas concluidas recentes

### 2026-04-23

- [x] **Releases GitHub v1.3.1 (quatro repos) e merges em develop** (`concluida`)
  - Escopo: PRs [spring-saas-core#121](https://github.com/ricartefelipe/spring-saas-core/pull/121), [py-payments-ledger#100](https://github.com/ricartefelipe/py-payments-ledger/pull/100), [fluxe-b2b-suite#164](https://github.com/ricartefelipe/fluxe-b2b-suite/pull/164); tags `v1.3.1`; releases: [core](https://github.com/ricartefelipe/spring-saas-core/releases/tag/v1.3.1), [orders](https://github.com/ricartefelipe/node-b2b-orders/releases/tag/v1.3.1), [payments](https://github.com/ricartefelipe/py-payments-ledger/releases/tag/v1.3.1), [suite](https://github.com/ricartefelipe/fluxe-b2b-suite/releases/tag/v1.3.1).
  - Evidência: 2026-04-23.

### 2026-04-01

- [x] **Validação staging completa (HTTP + smoke pedido + shop deploy)** (`concluida`)
  - Escopo: `scripts/smoke-staging.sh` (Core, Orders, Payments); `scripts/smoke-order-staging.sh` até `CONFIRMED`; `curl` fronts; Railway `shop-frontend` deploy **SUCCESS** (manifesto `apps/shop/Dockerfile`).
  - Evidência: execução técnica 2026-04-01; [CHECKLIST-AMBIENTES-EVIDENCIAS.md](CHECKLIST-AMBIENTES-EVIDENCIAS.md) atualizado.

- [x] **Tags `v1.3.0` multi-repo (suite, orders, payments)** (`concluida` — tags no remoto)
  - Escopo: tag anotada no `develop` atual de fluxe-b2b-suite, node-b2b-orders, py-payments-ledger; spring-saas-core já tinha `v1.3.0` no origin.
  - Evidência: `git ls-remote origin refs/tags/v1.3.0` após push.

### 2026-03-31

- [x] **Investigação shop staging + rascunho release v1.3.0** (`concluida`)
  - Escopo: linha de troubleshooting em [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md) (deploy FAILED vs tráfego 200); [RASCUNHO-RELEASE-NOTES-v1.3.0.md](RASCUNHO-RELEASE-NOTES-v1.3.0.md); lista de deployments via `railway deployment list -s shop-frontend`.
  - Evidência: CLI Railway 2026-03-31 (últimos deploys FAILED após merges só em docs; último SUCCESS anterior operacional para URL pública).

- [x] **Checklist de ambientes (evidências), Postgres e plano comercial 30 dias** (`concluida`)
  - Escopo: atualização de [CHECKLIST-AMBIENTES-EVIDENCIAS.md](CHECKLIST-AMBIENTES-EVIDENCIAS.md) (Railway, `curl` staging, variáveis `TEST_VAR`/`SSL_CERT_DAYS` ausentes no Postgres), novo [PLANO-COMERCIAL-30-DIAS.md](PLANO-COMERCIAL-30-DIAS.md); estado das tags documentado na fila.
  - Evidência: execução técnica `2026-03-31` (CLI + HTTP).

- [x] **Railway: staging/produção e documentação de manutenção** (`concluida`)
  - Escopo: projetos separados (Staging vs Production), stack verde, smoke HTTP nos backends (200), secção *Manutenção contínua* em `DEPLOY-RAILWAY.md`, referência em `AMBIENTES-CONFIGURACAO.md`, remoção de variáveis vazias de teste no Postgres (staging).
  - Evidência: commits desta entrega; preencher [CHECKLIST-AMBIENTES-EVIDENCIAS.md](CHECKLIST-AMBIENTES-EVIDENCIAS.md) com URLs finais se necessário.

- [x] **Front premium de autenticacao** (`concluida`)
  - Escopo: shell auth premium, recuperação/reset de senha e melhoria de login.
  - Evidencia: fluxe PRs `#113`, `#112`.

- [x] **Admin Console: Home + banner billing + Ajuda/API** (`concluida`)
  - Escopo: página Início, alerta de trial/past-due, links de documentação/API.
  - Evidencia: fluxe PRs `#114`, `#115`, `#116`.

- [x] **Release suite para master** (`concluida`)
  - Evidencia: fluxe PR `#117`.

- [x] **Alinhamento docs AGENTS (link canónico pipeline)** (`concluida`)
  - Escopo: referência padronizada para `PIPELINE-ESTEIRAS.md` no repo fluxe.
  - Evidencia: node PR `#58`, payments PR `#55`, core PR `#92`.

- [x] **Releases backend para master** (`concluida`)
  - Evidencia: node PR `#59`, payments PR `#54`, core PR `#91`.

- [x] **Equalização de branches** (`concluida`)
  - Escopo: `develop == master` nos 4 repositórios.
  - Evidencia: verificação local de SHA alinhado.

---

## Fila de execução imediata (concluir e marcar)

- [x] **Tag de release padronizada multi-repo** — **v1.3.1** concluida (tags + GitHub Releases)
  - Aceite:
    - [x] Definir versão — alinhamento `v1.3.0` em suite, orders, payments, core (core já estava em `v1.3.0`).
    - [x] Criar tags nos repos tocados — `v1.3.0` em fluxe-b2b-suite, node-b2b-orders, py-payments-ledger (push para `origin`).
    - [x] Publicar release notes com links dos PRs — `v1.3.1` com notas (PRs 121, 100, 164 + coordenacao orders); [releases](https://github.com/ricartefelipe/spring-saas-core/releases)

- [x] **Plano comercial de 30 dias (conversão e retenção)** (`concluida` — documento base)
  - Aceite:
    - [x] Priorizar 3 entregas de maior impacto — ver [PLANO-COMERCIAL-30-DIAS.md](PLANO-COMERCIAL-30-DIAS.md)
    - [x] Definir owner/ETA por item — tabela no mesmo doc
    - [x] Incluir métrica de sucesso por item — coluna “Métrica de sucesso” no mesmo doc

---

## Modelo de uso diário

1. Mover item para `em_execucao`.
2. Abrir/ligar PR(s) do item.
3. Marcar aceite linha a linha.
4. Mover para `concluida` com evidência (PR/CI/deploy).
