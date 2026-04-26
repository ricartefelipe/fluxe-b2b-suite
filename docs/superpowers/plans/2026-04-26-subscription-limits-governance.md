# D3 - Limites e Governança de Assinatura

## Objetivo

Fechar o Item D com governança mínima de limites de assinatura: o Core passa a aplicar a quota de usuários do plano no convite, e o Admin Console passa a comunicar claramente quando o tenant está perto do limite ou já bloqueado.

## Escopo

- No `spring-saas-core`, bloquear `POST /v1/users/invite` quando usuários ativos do tenant já alcançaram `PlanDefinition.maxUsers`.
- Usar o plano persistido no tenant como fonte de verdade para a quota, evitando depender somente do claim de plano no JWT.
- Preservar comportamento existente quando o tenant não tem plano ou quando o slug não existe no catálogo local.
- No Admin Console, destacar o `UsageWidget` em 90%+ de uso e em 100% de uso, com mensagens acessíveis.

## Fora de Escopo

- Enforce de `maxProjects` ou `storageGb`, pois o Core ainda não possui agregados runtime para esses recursos.
- Rate limit distribuído por Redis/gateway.
- Release do Item D para `master`; isso permanece bloqueado até D1, D2 e D3 estarem fechados em `develop`.

## Validação

- Testes unitários do Core para bloqueio de convite sem salvar usuário, publicar outbox ou enviar email.
- Testes unitários do Admin Console para estados visual/informativo de near-limit e limit-reached.
- Verificações finais antes de PR: Maven/Spotless no Core e testes/build relevantes do Admin Console.
