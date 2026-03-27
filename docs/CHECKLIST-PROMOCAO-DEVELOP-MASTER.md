# Checklist de promocao `develop -> master`

Checklist unico para promover release com seguranca nos repositorios da suite.

## 1) Gate tecnico obrigatorio

- [ ] `fluxe-b2b-suite`: `./scripts/pre-merge-checks.sh suite`
- [ ] `spring-saas-core`: `./mvnw spotless:check test`
- [ ] `node-b2b-orders`: `npm run lint && npm run build && npm test`
- [ ] `py-payments-ledger`: `.venv/bin/ruff check . && .venv/bin/black --check . && .venv/bin/mypy src && .venv/bin/pytest -q`
- [ ] Contratos sem drift: `./scripts/check-contract-drift.sh`

## 2) Gate de CI/CD

- [ ] PRs para `develop` dos repos envolvidos com CI verde
- [ ] Imagens/tag de `develop` geradas sem erro (quando aplicavel)
- [ ] Nenhum alerta bloqueante de seguranca aberto para a release

## 3) Gate funcional minimo

- [ ] Smoke de `spring-saas-core` executado
- [ ] Smoke de `node-b2b-orders` executado
- [ ] Smoke de `py-payments-ledger` executado
- [ ] Fluxo principal validado no frontend (login + operacao critica)

## 4) Gate de observabilidade

- [ ] Health endpoints respondendo 200 nos servicos
- [ ] Sem backlog anormal em filas criticas RabbitMQ
- [ ] Sem taxa de erro 5xx acima do baseline da ultima release

## 5) Gate de governanca

- [ ] Changelog/release notes atualizados para os repos alterados
- [ ] Plano de rollback da release revisado
- [ ] Responsavel pelo merge `develop -> master` definido

## 6) Fechamento

- [ ] Merge de release realizado
- [ ] Tag de release criada (semver)
- [ ] Registro pos-release preenchido (status + incidentes + acao corretiva)
