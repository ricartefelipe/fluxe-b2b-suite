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
| **Análise estática / Sonar-like** | spring-saas-core | Sem ferramenta dedicada de análise estática Sonar-like neste momento; qualidade garantida por validações de CI (build, testes e formatação). |

Ou seja: **Rabbit, Redis, métricas, Grafana e circuit breaker já são usados.** Não estão “faltando” em termos de conceito; parte deles pode estar pouco visível (ex.: Grafana só sobe no compose completo ou em deploy com monitoring).

---

## 2. O que não usamos (e por quê ou o que falta)

| Ferramenta | Situação |
|------------|----------|
| **Kafka** | Escolha de arquitetura: RabbitMQ + outbox atende o volume e o modelo atual (eventos entre 3 serviços). Kafka faria sentido para log de eventos muito grande, replay longo ou muitos consumidores independentes. Pode ser evolução futura se o volume ou os casos de uso justificarem. |
| **NoSQL para retenção pro front** | Hoje: PostgreSQL (fonte de verdade) + Redis (cache/rate limit/idempotência). Não há um NoSQL (ex.: MongoDB) dedicado a “retenção de infos pro front”. Dá para evoluir: cache de respostas de API no Redis com TTL, ou uma camada de leitura (ex.: materialized views / cache) para dashboards e listagens pesadas. |
| **SonarQube / SonarCloud** | Não há SonarQube/SonarCloud padronizado nos backends no momento. **Falta:** padronizar uma solução de análise estática nos repos (spring-saas-core, node-b2b-orders, py-payments-ledger, fluxe-b2b-suite) e expor qualidade no CI. |
| **Métricas no front** | Os backends expõem Prometheus; o front (Angular) não envia métricas para um backend de métricas. Dá para adicionar: enviar eventos (ex.: Web Vitals, erros) para um endpoint que grave em Prometheus/backend ou para um serviço de APM. |

---

## 3. Onde ver métricas e monitoramento

- **Prometheus:** cada backend expõe `/metrics` ou `/actuator/prometheus`; o `prometheus.yml` em `monitoring/prometheus/` raspa esses endpoints.
- **Grafana:** datasource apontando para Prometheus; dashboards em `monitoring/grafana/dashboards/` (overview, saas-core, orders, payments).
- **Alertas:** `monitoring/prometheus/alerts/` (incluindo RabbitMQ queue backlog).
- **Deploy Railway:** RabbitMQ é externo (CloudAMQP); Redis é plugin; Prometheus/Grafana não sobem por padrão no Railway — é preciso incluir no deploy ou usar um serviço de monitoring externo.


**Implementado / documentado neste repo:**  
- **SonarCloud** para o front: workflow em `saas-suite-ui/.github/workflows/sonarcloud.yml` e guia em `saas-suite-ui/docs/SONARCLOUD.md`.  
- **Métricas no deploy:** seção "Métricas e Grafana no deploy" em [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md) (Grafana Cloud ou Prometheus+Grafana no Railway).  
- **Cache Redis pro front:** padrão de chave, TTL e exemplos por stack em [CACHE-REDIS-FRONT.md](CACHE-REDIS-FRONT.md); implementação fica em cada backend.

---

## 4. Próximos passos (ação manual)

| # | Ação | Onde |
|---|------|------|
| 1 | **Ativar SonarCloud** | Criar projeto em [sonarcloud.io](https://sonarcloud.io), gerar token, adicionar secret `SONAR_TOKEN` no GitHub e preencher `sonar.organization` e `sonar.projectKey` em `saas-suite-ui/sonar-project.properties`. Ver [saas-suite-ui/docs/SONARCLOUD.md](saas-suite-ui/docs/SONARCLOUD.md). |
| 2 | **Ligar métricas no deploy** | Escolher Grafana Cloud (scrape das URLs dos backends) ou subir Prometheus + Grafana no Railway. Seguir a seção "Métricas e Grafana no deploy" em [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md). |
| 3 | **Implementar cache Redis nos backends** | Em cada repo (spring-saas-core, node-b2b-orders, py-payments-ledger), aplicar o padrão e os endpoints sugeridos em [CACHE-REDIS-FRONT.md](CACHE-REDIS-FRONT.md). |
