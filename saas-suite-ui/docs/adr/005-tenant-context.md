# ADR-005: Multi-Tenancy no Frontend

## Status

Aceito

## Contexto

O SaaS Suite é multi-tenant. Toda requisição ao backend precisa identificar o tenant corrente, e a UI precisa adaptar-se ao contexto do tenant (branding, permissões, dados).

## Decisão

- O `TenantContextStore` (signal-based) mantém o tenant ativo, resolvido no login ou via subdomínio.
- Um `HttpInterceptor` injeta o header `X-Tenant-Id` em todas as requisições HTTP automaticamente.
- Guards de rota validam que o tenant está resolvido antes de permitir navegação.
- A lib `domains/tenancy` encapsula toda a lógica de resolução e contexto de tenant.

## Consequências

- Nenhum componente ou serviço precisa se preocupar com o tenant — o interceptor resolve transparentemente.
- Mudança de tenant em runtime é suportada via atualização do `TenantContextStore`.
- O header `X-Tenant-Id` é o contrato com todos os backends — qualquer backend novo precisa respeitá-lo.
