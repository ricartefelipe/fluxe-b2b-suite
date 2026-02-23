# ADR-003: Gerenciamento de Estado com Signals

## Status

Aceito

## Contexto

O projeto precisa de uma estratégia de gerenciamento de estado que seja simples, performática e alinhada com a direção do Angular. Soluções como NgRx adicionam boilerplate significativo para aplicações deste porte.

## Decisão

- Utilizamos **Angular Signals** como primitiva principal de estado reativo.
- Cada domínio expõe um **facade baseado em signals** (ex: `TenantStore`, `OrderStore`) que encapsula estado, computed values e side effects.
- `computed()` para derivações, `effect()` para side effects como logging e sincronização.
- Sem biblioteca externa de state management — signals nativos são suficientes para o escopo atual.

## Consequências

- Menos dependências externas e menor boilerplate.
- Performance otimizada via granular change detection do Angular com signals.
- Se a complexidade crescer significativamente, migração para `@ngrx/signals` é incremental e compatível.
