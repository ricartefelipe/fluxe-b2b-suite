# Reports And Exports Design

## Objetivo

Implementar o primeiro pacote de relatórios do Ops Portal com foco em valor operacional imediato: pedidos, pagamentos e ledger com filtros básicos, resumo agregado e exportação CSV.

## Escopo Do A1

- Nova rota `/reports` no Ops Portal.
- Item de menu `Relatórios`.
- Relatório de pedidos com filtro por status, cliente e período.
- Relatório de pagamentos com filtro por status, cliente e período.
- Relatório de ledger com filtro por período e moeda.
- Exportação CSV para cada relatório.
- Resumo de registros e valores no topo de cada relatório.

## Fora Do Escopo Neste Corte

- PDF.
- Relatórios agendados.
- Exportação assíncrona no backend.
- Motor de BI ou dashboards executivos, que serão tratados no pacote B.

## Arquitetura

O A1 usa as APIs e facades já existentes no frontend para reduzir risco e entregar rápido. A página de relatórios consome `OrdersFacade`, `PaymentsFacade` e `LedgerFacade`, aplica filtros complementares no cliente quando a API ainda não possui o filtro, e centraliza geração/escape CSV em um utilitário testado.

Essa decisão mantém a entrega pequena e reversível. Quando volume alto ou auditoria formal exigirem, o mesmo contrato de tela poderá chamar endpoints backend de exportação.

Como a página combina pedidos, pagamentos e ledger, a rota exige as três permissões de leitura e aplica os mesmos checks ABAC dos módulos individuais. Totais são agrupados por moeda para evitar soma incorreta entre moedas diferentes.

## Validação

- Testes unitários cobrem escape CSV, neutralização de fórmulas em planilhas, filtros de período, resumo por moeda e mapeamento de linhas de pedidos, pagamentos e ledger.
- Build de produção do Ops Portal valida templates Angular e tipos.
