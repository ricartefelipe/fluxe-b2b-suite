# Produção “de verdade” — operação e go-live

Documento único para **venda a clientes**: o que configurar no ambiente, base de dados sem demo, backups e respostas a incidentes. Complementa [GO-LIVE-VENDA.md](GO-LIVE-VENDA.md) com passos acionáveis e scripts na raiz do monorepo.

---

## 1. Domínio e SSL

- **Servidor:** aponte o DNS para o servidor e termine TLS no proxy (Let's Encrypt).
- **Três fronts:** convém subdomínios dedicados (ex.: `loja.`, `ops.`, `admin.`) e **auth** (Keycloak ou IdP) em `auth.` — todos em **HTTPS**.
- Após definir domínios, atualizar **CORS** nos três backends com a lista **exacta** de origens `https://…` (ver `.env.example` na raiz do suite).

### O que só o responsável faz (não automatizável no Git)

| Item | Onde |
|------|------|
| Registo DNS (CNAME/A) e propagação | Registo.br / Cloudflare / DNS do cliente |
| Custom domain + confiança TLS no PaaS | Proxy do servidor / Cloudflare **painel** |
| Chaves live (Stripe, Resend, OIDC prod, JWT forte) | Variáveis em cada serviço |
| Decisão jurídica/contrato com cliente | Fora do repositório |

**VM + Nginx do suite (`deploy/nginx/`):** o sample escuta **HTTP :80**; o HTTPS costuma terminar **à frente** (Cloudflare “Full (strict)”, load balancer, ou Certbot no host). Quem opera a VM deve configurar TLS no edge ou emitir certificados no proxy conforme [GUIA-DEPLOY-PASSO-A-PASSO.md](GUIA-DEPLOY-PASSO-A-PASSO.md).

---

## 2. Variáveis obrigatórias (resumo)

| O quê | Onde |
|--------|------|
| **JWT único** (`JWT_SECRET` ou equivalente por serviço — o mesmo valor HS256 nos três backends) | Core, Orders, Payments |
| **CORS** lista CSV HTTPS dos fronts + auth | Core, Orders, Payments |
| **OIDC** `AUTH_MODE=oidc`, `OIDC_ISSUER_URI`, `OIDC_JWK_SET_URI`, `OIDC_CLIENT_ID` (+ audience se usado) | Core + `config.json` / env builds dos fronts |
| **Sem dev token** | Core em prod já fixa `token-endpoint-enabled: false` em `application-prod.yml`; em **staging** pode usar `APP_DEV_TOKEN_ENABLED` — em produção **não** definir como `true` |
| **Email** `RESEND_API_KEY`, `EMAIL_FROM`, `FRONTEND_URL` | Core |
| **Stripe billing** `STRIPE_BILLING_SECRET_KEY` | Core |
| **Stripe pagamentos** `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`; `ENCRYPTION_KEY` | Payments |
| **Sentry (recomendado)** `SENTRY_DSN` por serviço | Core, Orders, Payments, fronts via `config.json` |

Referência completa: [.env.example](../.env.example) (compose VM) e [REFERENCIA-CONFIGURACAO.md](REFERENCIA-CONFIGURACAO.md).

### Verificação local do ficheiro de secrets

Crie um `.env.producao` **só na tua máquina** (nunca commit) com os valores reais e execute:

```bash
./scripts/producao-preflight.sh .env.producao
```

Na raiz do monorepo também existe `pnpm verify:prod-env` (atalho no `package.json`).

---

## 3. Frontends em produção

- Build com **`AUTH_MODE=oidc`** e URLs absolutas das APIs (`CORE_API_BASE_URL`, `ORDERS_API_BASE_URL`, `PAYMENTS_API_BASE_URL`) nos pipelines que geram `config.json` ou variáveis de runtime.
- **Não** publicar builds com modo `dev` ou segredos embutidos.

---

## 4. Base de dados — só migrations, sem seed de demo

| Serviço | Comando típico (após deploy) |
|---------|-----------------------------------------------------|
| **spring-saas-core** | Liquibase corre no arranque com `SPRING_PROFILES_ACTIVE=prod` — **sem** contextos `staging`/`seed`. |
| **node-b2b-orders** | `npx prisma migrate deploy` — **não** `prisma db seed` em produção. O `entrypoint` só corre seed se `NODE_ENV=staging`. |
| **py-payments-ledger** | `alembic upgrade head` — seed só se `APP_ENV=staging` no entrypoint. |

---

## 5. Backups PostgreSQL

- **Export manual:** com URL de ligação (role só leitura para dump, se possível):

```bash
export DATABASE_URL='postgresql://...'
./scripts/backup-postgres.sh
# ou BACKUP_DIR=/caminho/seguro ./scripts/backup-postgres.sh
```

Guarde o `.dump` fora do repositório, em armazenamento privado e encriptado. **Teste restore** trimestralmente (ambiente isolado).

---

## 6. Incidentes (runbook mínimo)

1. **Indisponibilidade:** health checks públicos (`/actuator/health`, `/v1/healthz`, `/healthz`) — usar `pnpm verify:go-live` com as URLs HTTPS.
2. **Erros 5xx:** painel Sentry (se configurado) ou logs do serviço.
3. **Filas Rabbit:** mensagens acumuladas ou workers parados — ver [MONITORING-THRESHOLDS.md](MONITORING-THRESHOLDS.md).
4. **Escalação:** definir **uma pessoa primária e uma substituta** com acesso ao projeto e aos secrets; contacto de suporte ao cliente publicado (email/página).

---

## 7. Hábitos de monitorização

- **Semanal:** rever erros no Sentry e disponibilidade dos health endpoints.
- **Mensal:** confirmar backups e espaço em disco e custos do servidor.
- **Trimestral:** exercício de restore; rever [GO-LIVE-VENDA.md](GO-LIVE-VENDA.md) secção 7 checklist.

---

## 8. Atualização do RabbitMQ 3 para 4

O `docker-compose.prod.yml` usa o RabbitMQ 4.4. A partir da 4.3, o RabbitMQ só suporta atualizar dados gravados pela 4.2. Sobre um volume `rabbitmq_data` criado pelo RabbitMQ 3.13, a 4.4 arranca e mantém as filas, mas **perde as mensagens em silêncio**: num teste com 3 mensagens persistentes e paragem normal, a fila voltou com 0, sem erro no log. Numa instalação que já corre a versão 3, escolha um dos caminhos antes de subir a nova versão.

**Esvaziar as filas e recriar o volume (recomendado).** Os serviços declaram exchanges e filas ao arrancar, e o utilizador vem de `RABBITMQ_USER` e `RABBITMQ_PASSWORD`, então nada se perde se as filas estiverem vazias.

1. Pare o tráfego de entrada (frontends e APIs) e deixe os workers consumirem o que falta.
2. Confirme que todas as filas estão em zero: `docker compose -f docker-compose.prod.yml exec rabbitmq rabbitmqctl list_queues name messages`.
3. Pare o RabbitMQ e remova só o volume dele: `docker compose -f docker-compose.prod.yml rm -sf rabbitmq` e depois `docker volume rm <projeto>_rabbitmq_data`.
4. Suba o RabbitMQ com a nova versão e **reinicie os serviços** (`docker compose -f docker-compose.prod.yml up -d --force-recreate`), para que cada um declare as suas filas. Até node-b2b-orders 1.4.6 e py-payments-ledger 2.0.5, os workers reconectam a um broker sem filas mas não voltam a funcionar: o despachante do outbox do orders fica preso ao canal antigo e a fila `payments.orders.events` não é declarada de novo.
5. Confira `rabbitmqctl list_queues name consumers`: cada fila de trabalho precisa ter pelo menos um consumidor.

**Atualizar no lugar, mantendo as mensagens.** Ative todas as feature flags na 3.13 (`rabbitmqctl enable_feature_flag all`), troque a imagem para a última 4.2.x (por exemplo `rabbitmq:4.2.9-management-alpine`), ative de novo todas as feature flags e só então suba para a 4.4. Pare o RabbitMQ com `docker compose stop` (paragem normal) entre as versões. No mesmo teste, as 3 mensagens chegaram à 4.4. Ver o [guia de atualização do RabbitMQ](https://www.rabbitmq.com/docs/upgrade).

---

## 9. Referências

| Documento | Uso |
|-----------|-----|
| [GO-LIVE-VENDA.md](GO-LIVE-VENDA.md) | Checklist completo legal, Stripe, domínio |
| [GUIA-DEPLOY-PASSO-A-PASSO.md](GUIA-DEPLOY-PASSO-A-PASSO.md) | Passo a passo de implantação |
| [MONITORING-THRESHOLDS.md](MONITORING-THRESHOLDS.md) | Alertas iniciais |
| [EXECUCAO-VENDA-MONITORIZACAO.md](EXECUCAO-VENDA-MONITORIZACAO.md) | Fluxo staging → produção |
