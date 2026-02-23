# ADR-004: Integração API via Clientes Manuais

## Status

Aceito

## Contexto

O frontend se integra com três backends (spring-saas-core, node-b2b-orders, py-payments-ledger) que expõem APIs REST com specs OpenAPI. Codegen automático seria ideal, mas as specs ainda estão em estabilização.

## Decisão

- **Fase atual**: clientes HTTP manuais em cada lib `data-access/*`, usando `HttpClient` do Angular com tipagem TypeScript explícita.
- **Preparação para codegen**: o script `scripts/generate-api-clients.sh` já existe e gera clientes via `openapi-generator-cli` quando as specs estiverem estáveis.
- Os clientes manuais seguem a mesma interface que o codegen produziria, facilitando a migração futura.

## Consequências

- Flexibilidade total durante a estabilização das APIs.
- Risco de drift entre frontend e backend — mitigado por testes de contrato planejados.
- Migração para codegen será incremental, lib por lib.
