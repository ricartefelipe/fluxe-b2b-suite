# Thresholds de monitoramento (EPIC-C)

Referencia inicial para alertas em staging/producao (Grafana, Railway health, logs). Ajustar por tenant e por carga.

## Latencia HTTP (p95)

| Servico        | Rota / ambito      | p95 alvo | Acao se ultrapassar        |
|----------------|-------------------|----------|----------------------------|
| spring-saas-core | `/healthz`, `/v1/*` API | 800 ms   | Rever DB, pool, cold start |
| node-b2b-orders  | `/v1/healthz`, API pedidos | 1 s   | Redis, Prisma, fila       |
| py-payments-ledger | `/healthz`, `/v1/*` pagamentos | 1.2 s | DB, gateway externo   |

## Erros HTTP

| Metrica        | Threshold | Janela   |
|----------------|-----------|----------|
| Taxa 5xx       | > 1%      | 5 min    |
| Taxa 4xx auth  | > 5% em `/v1/*` protegidos | 15 min | Possivel ataque ou cliente mal configurado |

## Filas e mensageria

| Recurso        | Threshold | Nota |
|----------------|-----------|------|
| RabbitMQ: fila `outbox` (por servico) | crescimento > 10k msgs / 10 min | Worker ou broker |
| DLQ | > 0 mensagens | Inspecionar payload e reprocessar |

## Smoke pos-deploy

| Check | Frequencia |
|-------|------------|
| Scripts `smoke-post-merge.sh` por servico | Apos merge em `develop` (GitHub Actions), com secrets `*_SMOKE_URL` |
| Suite local `scripts/smoke-suite.sh` | Manual com stack Docker |

Valores sao **pontos de partida**; o dono do servico deve confirmar SLO com dados reais de staging.
