# D2 - Faturas SaaS Read-Only

## Objetivo

Expor no Admin Console uma visão read-only das faturas da assinatura SaaS, preservando o portal de faturamento como canal de ações sensíveis e mantendo a release para produção agrupada com o restante do Item D.

## Escopo

- Adicionar no `spring-saas-core` um endpoint `GET /v1/billing/invoices`.
- Resolver invoices a partir do tenant autenticado e da assinatura corrente persistida, sem aceitar IDs Stripe enviados pelo cliente.
- Retornar projeção mínima: id, status, moeda, valor, datas e links hosted/PDF quando disponíveis.
- No adapter `noop`, retornar lista vazia para ambientes locais sem Stripe.
- No Admin Console, carregar as faturas de forma parcial: erro de invoices não derruba planos, assinatura ou uso.
- Renderizar a seção "Faturas" somente quando existe assinatura ativa/corrente no contexto da página.

## Fora de Escopo

- Criar ou alterar faturas pelo Admin Console.
- Sincronizar/cachear invoices em banco local.
- Promover mudanças do Item D para `master` antes do fechamento de D1, D2 e D3 em `develop`.

## Validação

- Testes unitários do Core para o contrato do endpoint e comportamento do adapter `noop`.
- Testes unitários do Admin Console para listagem read-only e erro parcial de invoices.
- Verificações finais antes de PR: testes focados, Spotless/Maven no Core e build/testes relevantes no frontend.
