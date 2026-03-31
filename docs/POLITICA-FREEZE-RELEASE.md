# Política de freeze por risco (release)

## Objetivo

Impedir promoção `develop` → `master` (produção) enquanto existirem bloqueadores de risco **P0** ou **P1** não resolvidos no âmbito da release.

## Classificação (sugestão)

| Nível | Exemplos | Bloqueia release? |
|-------|----------|-------------------|
| **P0** | Segurança (credenciais expostas, bypass de auth), perda de dados, indisponibilidade total de API crítica em staging | **Sim** |
| **P1** | Regressão funcional grave em staging, drift de contrato, CI vermelho no repo que entra na release, migração destrutiva sem plano | **Sim** |
| **P2** | Débito técnico, UX, performance não crítica | Não (agendar) |

## Regra

- **Nenhum merge** `develop` → `master` enquanto a lista de itens P0/P1 da release estiver aberta.
- Responsável pela release (ou arquiteto) **explicita** “clear para produção” após validação em staging.

## Onde registar

- Issues / board do projeto (ex.: Linear, GitHub Projects) com etiqueta `release-blocker`.
- Referência cruzada no PR de release `develop` → `master`.

## Congelamento de código (opcional)

- Antes de janela crítica (demo, black friday): **code freeze** em `master` (apenas hotfix); `develop` continua para a sprint seguinte.

## Relação com CI

- CI vermelho em `develop` = **bloqueio automático moral**: não abrir PR de release até verde.
