# Runbook de rollback por servico

Objetivo: reduzir tempo de recuperacao em regressao pos-deploy.

## Gatilhos de rollback

- Erro 5xx acima do baseline por 10 minutos
- Fluxo critico indisponivel (checkout, autenticacao, criacao de pedido, settle de pagamento)
- Integracao de eventos rompida entre servicos

## Estrategia geral

1. Congelar novas promocoes
2. Identificar ultimo artefato/tag estavel
3. Reverter servico afetado primeiro (rollback cirurgico)
4. Executar smoke minimo
5. Reabrir trafego normal

## spring-saas-core

- **Rollback alvo:** ultimo commit/tag estavel em `master`
- **Acoes:**
  1. Reverter deploy para imagem/tag anterior
  2. Validar `/actuator/health`
  3. Validar endpoint de auth/tenant
  4. Confirmar publicacao de eventos tenant/policy/flag

## node-b2b-orders

- **Rollback alvo:** imagem/tag estavel anterior de API/worker
- **Acoes:**
  1. Reverter API e worker em conjunto
  2. Validar `/health`
  3. Rodar fluxo minimo de pedido
  4. Confirmar consumo/publicacao de eventos de pagamento

## py-payments-ledger

- **Rollback alvo:** imagem/tag estavel anterior de API/worker
- **Acoes:**
  1. Reverter API e worker em conjunto
  2. Validar `/health`
  3. Rodar fluxo minimo de autorizacao/settle
  4. Confirmar evento `payment.settled` no barramento

## fluxe-b2b-suite (frontend)

- **Rollback alvo:** ultimo build estavel publicado
- **Acoes:**
  1. Reverter deploy do frontend para build anterior
  2. Validar login e operacao principal por app (shop, ops, admin)
  3. Confirmar comunicacao com APIs sem erro de CORS/config

## Validacao pos-rollback

- [ ] Health checks 200 em todos os servicos impactados
- [ ] Smoke funcional minimo executado
- [ ] Filas RabbitMQ em comportamento normal
- [ ] Incidente atualizado com causa, impacto e acao preventiva
