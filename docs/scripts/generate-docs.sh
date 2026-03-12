#!/usr/bin/env bash
#
# generate-docs.sh — Gerador de documentação consolidada da Fluxe B2B Suite
#
# Conecta nos serviços para extrair documentação viva (OpenAPI, AI docs)
# e gera o arquivo consolidado DOCUMENTACAO-VIVA.md
#
# Uso:
#   ./docs/scripts/generate-docs.sh              # modo padrão
#   ./docs/scripts/generate-docs.sh --offline     # sem conectar nos serviços
#   ./docs/scripts/generate-docs.sh --help
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCS_DIR="$SUITE_DIR/docs"
OUTPUT="$DOCS_DIR/DOCUMENTACAO-VIVA.md"

SPRING_URL="${SPRING_URL:-http://localhost:8080}"
ORDERS_URL="${ORDERS_URL:-http://localhost:3000}"
PAYMENTS_URL="${PAYMENTS_URL:-http://localhost:8000}"

OFFLINE=false

# ---------------------------------------------------------------------------
# Argumentos
# ---------------------------------------------------------------------------
usage() {
    cat <<EOF
Uso: $(basename "$0") [opções]

Opções:
  --offline    Gera documentação sem conectar nos serviços (usa dados estáticos)
  --output F   Caminho do arquivo de saída (padrão: docs/DOCUMENTACAO-VIVA.md)
  --help       Mostra esta mensagem

Variáveis de ambiente:
  SPRING_URL    URL do spring-saas-core   (padrão: http://localhost:8080)
  ORDERS_URL    URL do node-b2b-orders    (padrão: http://localhost:3000)
  PAYMENTS_URL  URL do py-payments-ledger (padrão: http://localhost:8000)
EOF
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --offline)  OFFLINE=true; shift ;;
        --output)   OUTPUT="$2"; shift 2 ;;
        --help|-h)  usage ;;
        *)          echo "Opção desconhecida: $1" >&2; exit 1 ;;
    esac
done

# ---------------------------------------------------------------------------
# Utilitários
# ---------------------------------------------------------------------------
NOW=$(date -u +"%Y-%m-%d %H:%M UTC")
SERVICES=("spring-saas-core|$SPRING_URL" "node-b2b-orders|$ORDERS_URL" "py-payments-ledger|$PAYMENTS_URL")

check_health() {
    local name="$1" url="$2"
    local healthz_paths=("/healthz" "/actuator/health")
    for path in "${healthz_paths[@]}"; do
        if curl -sf --max-time 3 "${url}${path}" > /dev/null 2>&1; then
            echo "ok"
            return
        fi
    done
    echo "offline"
}

fetch_json() {
    local url="$1"
    curl -sf --max-time 10 "$url" 2>/dev/null || echo ""
}

# ---------------------------------------------------------------------------
# 1. Verificar status dos serviços
# ---------------------------------------------------------------------------
declare -A SERVICE_STATUS
declare -A SERVICE_OPENAPI
declare -A SERVICE_AIDOCS

echo "=== Geração de documentação viva — Fluxe B2B Suite ==="
echo "Data: $NOW"
echo ""

if [[ "$OFFLINE" == "true" ]]; then
    echo "[modo offline] Serviços não serão consultados."
    for entry in "${SERVICES[@]}"; do
        IFS='|' read -r name url <<< "$entry"
        SERVICE_STATUS[$name]="offline"
    done
else
    echo "Verificando serviços..."
    for entry in "${SERVICES[@]}"; do
        IFS='|' read -r name url <<< "$entry"
        status=$(check_health "$name" "$url")
        SERVICE_STATUS[$name]="$status"
        echo "  $name ($url): $status"

        if [[ "$status" == "ok" ]]; then
            openapi=$(fetch_json "${url}/v3/api-docs" || fetch_json "${url}/openapi.json" || echo "")
            SERVICE_OPENAPI[$name]="$openapi"

            aidocs=$(fetch_json "${url}/v1/ai/docs" || echo "")
            SERVICE_AIDOCS[$name]="$aidocs"
        fi
    done
fi

# ---------------------------------------------------------------------------
# 2. Gerar catálogo de APIs (parsing estático)
# ---------------------------------------------------------------------------
echo ""
echo "Gerando catálogo de APIs..."
API_CATALOG=""
if command -v python3 &> /dev/null; then
    API_CATALOG=$(python3 "$SCRIPT_DIR/api-catalog.py" --stdout 2>/dev/null || echo "")
fi

# ---------------------------------------------------------------------------
# 3. Últimas mudanças (git log)
# ---------------------------------------------------------------------------
echo "Coletando histórico recente..."
GIT_LOG=""
for repo_dir in "$SUITE_DIR" "$SUITE_DIR/../spring-saas-core" "$SUITE_DIR/../node-b2b-orders" "$SUITE_DIR/../py-payments-ledger"; do
    if [[ -d "$repo_dir/.git" ]]; then
        repo_name=$(basename "$repo_dir")
        log=$(cd "$repo_dir" && git log --oneline -10 --format="- %h %s (%ar)" 2>/dev/null || echo "")
        if [[ -n "$log" ]]; then
            GIT_LOG+="### $repo_name"$'\n\n'"$log"$'\n\n'
        fi
    fi
done

# ---------------------------------------------------------------------------
# 4. Gerar DOCUMENTACAO-VIVA.md
# ---------------------------------------------------------------------------
echo "Gerando $OUTPUT..."

cat > "$OUTPUT" << 'HEADER'
# Documentação Viva — Fluxe B2B Suite

> **Este documento é gerado automaticamente.** Não edite manualmente.
> Para regenerar, execute: `./docs/scripts/generate-docs.sh`

HEADER

cat >> "$OUTPUT" << EOF
**Gerado em:** $NOW

---

## Visão Geral do Sistema

A Fluxe B2B Suite é uma plataforma SaaS multi-tenant para operações B2B, composta por:

| Serviço | Tecnologia | Porta | Responsabilidade |
|---------|-----------|-------|------------------|
| **spring-saas-core** | Java 21 / Spring Boot | 8080 | Control plane: tenants, ABAC/RBAC, feature flags, auditoria, JWT, outbox |
| **node-b2b-orders** | Node.js / NestJS / Prisma | 3000 | Pedidos, produtos, inventário, saga de pedido |
| **py-payments-ledger** | Python / FastAPI / SQLAlchemy | 8000 | Pagamentos, ledger double-entry, disputas, payouts, reconciliação |
| **saas-suite-ui** | Angular | 4200 | Interface administrativa |

### Infraestrutura compartilhada

- **PostgreSQL** — banco de dados por serviço (isolamento)
- **Redis** — cache, idempotência, rate limiting, circuit breaker
- **RabbitMQ** — mensageria assíncrona (outbox pattern, topic exchanges)

---

## Status dos Serviços

EOF

echo "| Serviço | URL | Status |" >> "$OUTPUT"
echo "|---------|-----|--------|" >> "$OUTPUT"
for entry in "${SERVICES[@]}"; do
    IFS='|' read -r name url <<< "$entry"
    status="${SERVICE_STATUS[$name]:-desconhecido}"
    if [[ "$status" == "ok" ]]; then
        icon="✅ Online"
    else
        icon="⬚ Offline"
    fi
    echo "| $name | $url | $icon |" >> "$OUTPUT"
done
echo "" >> "$OUTPUT"

# ---------------------------------------------------------------------------
# Catálogo de APIs
# ---------------------------------------------------------------------------
if [[ -n "$API_CATALOG" ]]; then
    cat >> "$OUTPUT" << 'EOF'
---

EOF
    echo "$API_CATALOG" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
fi

# ---------------------------------------------------------------------------
# AI docs por serviço
# ---------------------------------------------------------------------------
has_aidocs=false
for entry in "${SERVICES[@]}"; do
    IFS='|' read -r name url <<< "$entry"
    aidocs="${SERVICE_AIDOCS[$name]:-}"
    if [[ -n "$aidocs" ]]; then
        if [[ "$has_aidocs" == "false" ]]; then
            echo "---" >> "$OUTPUT"
            echo "" >> "$OUTPUT"
            echo "## Documentação por IA" >> "$OUTPUT"
            echo "" >> "$OUTPUT"
            has_aidocs=true
        fi
        echo "### $name" >> "$OUTPUT"
        echo "" >> "$OUTPUT"
        echo '```json' >> "$OUTPUT"
        echo "$aidocs" >> "$OUTPUT"
        echo '```' >> "$OUTPUT"
        echo "" >> "$OUTPUT"
    fi
done

# ---------------------------------------------------------------------------
# Catálogo de Eventos (referência)
# ---------------------------------------------------------------------------
cat >> "$OUTPUT" << 'EOF'
---

## Catálogo de Eventos

Consulte [CATALOGO-EVENTOS.md](CATALOGO-EVENTOS.md) para documentação completa dos eventos.

### Resumo das Exchanges

| Exchange | Tipo | Produtor | Descrição |
|----------|------|----------|-----------|
| `saas.events` | topic | spring-saas-core | Governança: tenants, políticas, flags |
| `orders.x` | topic | node-b2b-orders | Pedidos e inventário |
| `payments.x` | topic | py-payments-ledger | Pagamentos, disputas, payouts |

EOF

# ---------------------------------------------------------------------------
# Referência de configuração (link)
# ---------------------------------------------------------------------------
cat >> "$OUTPUT" << 'EOF'
---

## Referência de Configuração

Consulte [REFERENCIA-CONFIGURACAO.md](REFERENCIA-CONFIGURACAO.md) para todas as variáveis de ambiente.

### Variáveis críticas (compartilhadas)

| Variável | Descrição |
|----------|-----------|
| `JWT_SECRET` | Secret HS256 — deve ser idêntico em todos os serviços |
| `JWT_ISSUER` | Issuer do token JWT |
| `RABBITMQ_*` | Conexão com o broker RabbitMQ |

EOF

# ---------------------------------------------------------------------------
# Métricas Prometheus
# ---------------------------------------------------------------------------
cat >> "$OUTPUT" << 'EOF'
---

## Referência de Métricas

### spring-saas-core (Actuator + Micrometer)

| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `http_server_requests_seconds` | histogram | Latência HTTP por URI, método e status |
| `jvm_memory_used_bytes` | gauge | Uso de memória JVM |
| `hikaricp_connections_active` | gauge | Conexões ativas no pool |
| `resilience4j_circuitbreaker_state` | gauge | Estado do circuit breaker |
| `outbox_events_published_total` | counter | Eventos publicados pelo outbox |
| `outbox_events_failed_total` | counter | Falhas de publicação |

### node-b2b-orders (prom-client)

| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `http_request_duration_seconds` | histogram | Latência HTTP |
| `http_requests_total` | counter | Total de requisições por rota e status |
| `orders_created_total` | counter | Pedidos criados |
| `inventory_adjustments_total` | counter | Ajustes de inventário |
| `outbox_events_total` | counter | Eventos outbox processados |
| `circuit_breaker_state` | gauge | Estado do circuit breaker |
| `nodejs_heap_size_used_bytes` | gauge | Uso de heap Node.js |

### py-payments-ledger (prometheus-client)

| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `http_request_duration_seconds` | histogram | Latência HTTP |
| `http_requests_total` | counter | Total de requisições |
| `payment_intents_total` | counter | PaymentIntents criados |
| `ledger_entries_total` | counter | Entradas no ledger |
| `gateway_requests_total` | counter | Chamadas ao gateway por provedor e status |
| `circuit_breaker_state` | gauge | Estado do circuit breaker |
| `process_resident_memory_bytes` | gauge | Uso de memória RSS |

EOF

# ---------------------------------------------------------------------------
# Health Checks
# ---------------------------------------------------------------------------
cat >> "$OUTPUT" << 'EOF'
---

## Referência de Health Checks

| Serviço | Liveness | Readiness | Métricas |
|---------|----------|-----------|----------|
| spring-saas-core | `GET /healthz` | `GET /readyz` | `GET /actuator/prometheus` |
| node-b2b-orders | `GET /v1/healthz` | `GET /v1/readyz` | `GET /v1/metrics` |
| py-payments-ledger | `GET /healthz` | `GET /readyz` | `GET /metrics` |

### Critérios de Readiness

| Serviço | Componentes verificados |
|---------|------------------------|
| spring-saas-core | PostgreSQL, Redis, RabbitMQ |
| node-b2b-orders | PostgreSQL (Prisma), Redis, RabbitMQ |
| py-payments-ledger | PostgreSQL (SQLAlchemy), Redis, RabbitMQ |

EOF

# ---------------------------------------------------------------------------
# Mudanças recentes
# ---------------------------------------------------------------------------
if [[ -n "$GIT_LOG" ]]; then
    cat >> "$OUTPUT" << 'EOF'
---

## Mudanças Recentes

EOF
    echo "$GIT_LOG" >> "$OUTPUT"
fi

# ---------------------------------------------------------------------------
# Rodapé
# ---------------------------------------------------------------------------
cat >> "$OUTPUT" << EOF
---

*Documentação gerada automaticamente em $NOW por \`docs/scripts/generate-docs.sh\`*
EOF

echo ""
echo "Documentação gerada com sucesso: $OUTPUT"
echo "Tamanho: $(wc -l < "$OUTPUT") linhas"
