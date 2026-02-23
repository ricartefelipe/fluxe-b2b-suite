# ADR-001: Arquitetura Monorepo Angular com Nx

## Status

Aceito

## Contexto

O SaaS Suite UI precisa suportar múltiplas aplicações frontend (Admin Console, Ops Portal) que compartilham lógica de negócio, componentes visuais e integrações com APIs. Manter repositórios separados por app resultaria em duplicação de código, divergência de versões e dificuldade de refatoração transversal.

## Decisão

Adotamos um monorepo gerenciado pelo Nx com Angular 19+ contendo:

- **2 aplicações**: `admin-console` (gestão do tenant) e `ops-portal` (operações internas).
- **Bibliotecas compartilhadas** organizadas por camada: `shared/ui`, `shared/util`, `shared/config`, `shared/auth`, `shared/http`, `shared/telemetry`, `shared/i18n`, `shared/models`.
- **Bibliotecas de data-access** por domínio de backend: `data-access/core`, `data-access/orders`, `data-access/payments`.
- **Bibliotecas de domínio**: `domains/tenancy`, `domains/admin`, `domains/ops`.
- **Tags de projeto** (`scope:*`, `type:*`) com `@nx/enforce-module-boundaries` para impedir dependências indevidas.
- **Build incremental** via cache do Nx e affected commands no CI.

## Consequências

- **Positivas**: código compartilhado sem duplicação, refatorações atômicas, CI incremental mais rápido, boundary enforcement automático.
- **Negativas**: curva de aprendizado do Nx, builds completos mais longos se o cache for invalidado, configuração inicial mais complexa.
- **Riscos mitigados**: a separação por tags garante que apps não importem domínios de outros apps; o cache distribuído do Nx compensa builds grandes.
