# Cache Redis para respostas consumidas pelo front

Objetivo: reduzir carga nos backends e melhorar tempo de resposta para o front (Shop, Admin, Ops) usando o **Redis já existente** em cada backend. Sem novo banco; apenas cache de resposta com TTL.

## Endpoints candidatos (prioridade)

| Backend | Endpoint | Uso no front | TTL sugerido |
|---------|----------|--------------|--------------|
| spring-saas-core | `GET /v1/tenants` (lista) | Admin: lista de tenants | 60–120 s |
| spring-saas-core | `GET /v1/products` (lista) | Shop / Admin: listagem de produtos | 30–60 s |
| spring-saas-core | `GET /v1/billing/plans` | Admin / assinaturas | 300 s |
| node-b2b-orders | `GET /v1/orders` (lista com filtros leves) | Ops: listagem | 30 s |
| node-b2b-orders | Dashboard KPIs (ex.: totais por status/dia) | Ops: dashboard | 60 s |
| py-payments-ledger | Listagem de transações / resumo | Admin/Ops | 60 s |

Regra: **cache por tenant** quando a resposta depender de `tenantId` (ex.: `GET /v1/orders?tenantId=...`). Chave Redis deve incluir `tenantId` para não vazar dados entre tenants.

---

## Padrão da chave Redis

```
front:cache:{backend}:{method}:{path}:{queryHash}:{tenantId?}
```

- `backend`: `core` | `orders` | `payments`
- `path`: caminho normalizado (ex.: `v1/tenants`, `v1/orders`)
- `queryHash`: hash curto dos query params relevantes (ex.: `page=1&size=20` → `p1s20`) para não misturar páginas
- `tenantId`: quando a resposta for por tenant; omitir em endpoints globais (ex.: planos)

Exemplo: `front:cache:core:v1/products:p1s20:tenant-123` com TTL 60 s.

---

## Implementação por stack

### Spring (spring-saas-core)

Já usa Redis. Opções:

1. **Cache abstrato com `@Cacheable`**  
   - Habilitar cache com `CacheManager` que use Redis (ex.: `RedisCacheConfiguration` + `RedisCacheManager`).  
   - No controller ou serviço:  
     `@Cacheable(cacheNames = "front:products", key = "#tenantId + '-' + #page + '-' + #size")`  
   - TTL por cache name: em `RedisCacheManager` ao registrar os caches.

2. **Interceptor ou Filter**  
   - Interceptor que, para `GET` em paths configurados (ex.: `/v1/products`, `/v1/tenants`), monte a chave `front:cache:core:...`, leia do Redis e, se existir, devolva a resposta; senão, siga a cadeia, serialize a resposta e grave no Redis com TTL.

Exemplo mínimo de chave e TTL (pseudo):

```java
String key = "front:cache:core:v1/products:" + tenantId + ":" + page + ":" + size;
// GET key → se existir, return body
// Após controller: SETEX key 60 body
```

### Node (node-b2b-orders)

Redis já usado (rate limit, idempotência). Opções:

1. **Middleware de cache**  
   - Para rotas `GET /v1/orders` (e eventualmente um `GET /v1/dashboard/kpis`), middleware que:  
     - Monta a chave com tenantId + query (ex.: `front:cache:orders:v1/orders:${tenantId}:${hash(query)}`).  
     - `await redis.get(key)`; se existir, `return res.json(JSON.parse(val))`.  
     - `next()` e, no res.send, interceptar o body (ex.: `res.json = (data) => { redis.setex(key, 60, JSON.stringify(data)); res.send(data); }`).  
   - Ou usar um helper que envolva o handler e faça get/set.

2. **Exemplo de chave**  
   - `front:cache:orders:v1/orders:tenant-123:p1s20`  
   - TTL: 30–60 s.

### Python (py-payments-ledger)

Redis já usado. Opções:

1. **Decorator ou middleware**  
   - Decorator em rotas GET que monta a chave (`front:cache:payments:v1/...:tenantId:queryHash`), verifica Redis e, em hit, retorna a resposta; em miss, chama a view, serializa a resposta (ex.: JSON), grava no Redis com `setex(key, ttl_seconds, body)` e retorna.

2. **Exemplo**  
   - Chave: `front:cache:payments:v1/transactions:tenant-123:p1s20`  
   - TTL: 60 s.

---

## Invalidação

- **TTL apenas:** na maioria dos casos basta TTL curto (30–120 s). Dados levemente atrasados são aceitáveis para listagens e KPIs.
- **Invalidação explícita:** em writes (ex.: criar/atualizar produto, criar pedido), apagar chaves que incluam aquele recurso/tenant. Ex.: ao criar produto no Core, deletar `front:cache:core:v1/products:*` (ou por tenant). No Redis: `KEYS front:cache:core:v1/products:tenant-123*` e depois `DEL ...` (ou usar SCAN em produção).

---

## Checklist de implementação

- [ ] Definir 1–2 endpoints por backend para cache (ex.: listagem produtos, listagem tenants, dashboard KPIs).
- [ ] Implementar chave com tenant quando aplicável.
- [ ] Definir TTL por endpoint (30–300 s).
- [ ] Em writes que afetem os dados cacheados, invalidar as chaves correspondentes (ou confiar só no TTL).
- [ ] Medir latência antes/depois e uso de Redis (memória).

Os arquivos de configuração do Prometheus/Grafana e desta doc ficam no repositório `fluxe-b2b-suite`; a implementação do cache fica em cada repositório de backend.

---

## Implementação aplicada

- **spring-saas-core:** `RedisCacheConfig` (cache `frontTenants`, TTL 120s), `@Cacheable` em `TenantUseCase.searchCursor`, `@CacheEvict` em create/update/softDelete. Listagem GET /v1/tenants.
- **node-b2b-orders:** cache em `OrdersService.listOrders` com chave `front:cache:orders:v1/orders:{tenantId}:{queryHash}`, TTL 30s.
- **py-payments-ledger:** cache em `list_all` (GET /v1/payment-intents) com chave `front:cache:payments:v1/payment-intents:{tenant_id}:{query_hash}`, TTL 60s.
