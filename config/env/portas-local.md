# Portas e hosts — ambiente local

Resumo para quando a **infra** sobe com `spring-saas-core/docker-compose.yml` e os **apps** rodam na máquina.

| Recurso    | Host:Porta        | Uso em |
|------------|------------------|--------|
| Postgres   | localhost:5435   | Core (saascore), Orders (app), Payments (se configurado) |
| Redis      | localhost:6382   | Core, Orders, Payments |
| RabbitMQ   | localhost:5675   | Core, Orders, Payments |
| Core API   | localhost:8080   | spring-saas-core |
| Orders API | localhost:3000   | node-b2b-orders |
| Payments API | localhost:8000 | py-payments-ledger |
| Admin Console | localhost:4200 | nx serve admin-console |
| Ops Portal | localhost:4300 ou 4201 | nx serve ops-portal |
| Shop       | localhost:4200 (ou outra se 4200 ocupada) | nx serve shop |

Proxy do front (dev): `/api/core` → 8080, `/api/orders` → 3000, `/api/payments` → 8000.
