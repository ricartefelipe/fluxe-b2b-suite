# Stack e ferramentas — o que usamos e o que pode ser adicionado

Resposta objetiva a: **por que não usamos X?** e **onde estão nossas métricas, Sonar, Kafka, circuit breaker, etc.**

---

## 1. O que já está na stack

| Ferramenta / padrão | Onde | Para quê |
|---------------------|------|----------|
| **RabbitMQ** | CloudAMQP (Railway) ou docker-compose | Mensageria assíncrona: outbox pattern, exchanges `saas.events`, `orders.x`, `payments.x`. Eventos entre Core, Orders e Payments. Ver [CATALOGO-EVENTOS.md](CATALOGO-EVENTOS.md), [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md). |
| **Redis** | Plugin Railway / docker-compose | Cache, idempotência (chaves por request), rate limiting por tenant. Os 3 backends usam. |
| **Métricas (Prometheus)** | Os 3 backends | `GET /metrics` ou `/actuator/prometheus` (Spring). Métricas de negócio: `orders_created_total`, `inventory_adjusted_total`, circuit breaker state, etc. |
| **Grafana** | monitoring/ (fluxe-b2b-suite) | Dashboards: overview, saas-core, orders, payments, tracing. Alertas em `prometheus/alerts/` (infra, service-health, business, RabbitMQ queue backlog). |
| **Circuit breaker** | Spring (Resilience4j), Node (CircuitBreakerModule), Python (gateways PagSeguro/MercadoPago/Stripe) | Proteção em chamadas a IA (Spring), publicação RabbitMQ e gateways de pagamento. |
| **Análise estática / Sonar-like** | spring-saas-core | **Qodana** (JetBrains) em `.github/workflows/qodana_code_quality.yml` + `qodana.yaml` — análise JVM/Java. Não é SonarQube/SonarCloud, mas cumpre papel de qualidade estática em um dos repos. |

Ou seja: **Rabbit, Redis, métricas, Grafana, circuit breaker e análise estática (Qodana) já são usados.** Não estão “faltando” em termos de conceito; parte deles pode estar pouco visível (ex.: Grafana só sobe no compose completo ou em deploy com monitoring).

---

## 2. O que não usamos (e por quê ou o que falta)

| Ferramenta | Situação |
|------------|----------|
| **Kafka** | Escolha de arquitetura: RabbitMQ + outbox atende o volume e o modelo atual (eventos entre 3 serviços). Kafka faria sentido para log de eventos muito grande, replay longo ou muitos consumidores independentes. Pode ser evolução futura se o volume ou os casos de uso justificarem. |
| **NoSQL para retenção pro front** | Hoje: PostgreSQL (fonte de verdade) + Redis (cache/rate limit/idempotência). Não há um NoSQL (ex.: MongoDB) dedicado a “retenção de infos pro front”. Dá para evoluir: cache de respostas de API no Redis com TTL, ou uma camada de leitura (ex.: materialized views / cache) para dashboards e listagens pesadas. |
| **SonarQube / SonarCloud** | Só o spring-saas-core tem Qodana (análise estática). **Falta:** rodar Sonar (ou manter Qodana) nos outros repos (node-b2b-orders, py-payments-ledger, fluxe-b2b-suite) e expor qualidade no CI. |
| **Métricas no front** | Os backends expõem Prometheus; o front (Angular) não envia métricas para um backend de métricas. Dá para adicionar: enviar eventos (ex.: Web Vitals, erros) para um endpoint que grave em Prometheus/backend ou para um serviço de APM. |

---

## 3. Onde ver métricas e monitoramento

- **Prometheus:** cada backend expõe `/metrics` ou `/actuator/prometheus`; o `prometheus.yml` em `monitoring/prometheus/` raspa esses endpoints.
- **Grafana:** datasource apontando para Prometheus; dashboards em `monitoring/grafana/dashboards/` (overview, saas-core, orders, payments).
- **Alertas:** `monitoring/prometheus/alerts/` (incluindo RabbitMQ queue backlog).
- **Deploy Railway:** RabbitMQ é externo (CloudAMQP); Redis é plugin; Prometheus/Grafana não sobem por padrão no Railway — é preciso incluir no deploy ou usar um serviço de monitoring externo.

Se quiser, no próximo passo dá para: (1) documentar um “checklist de métricas” (onde clicar em cada ambiente); (2) propor Sonar/Qodana nos outros repos; (3) esboçar uso de Redis (ou outro) para retenção/cache pro front.
