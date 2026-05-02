# Primeiros passos — do login ao primeiro pedido

Guia curto para **time-to-value**: um administrador ou operador consegue percorrer o fluxo mínimo em staging (ou demo) em cerca de **30 minutos**, com as URLs e credenciais corretas.

Meta de aceite (plano comercial): **login → primeiro pedido `CONFIRMED` ou `PAID`** (o nível exato depende do gateway e workers no ambiente).

---

## 1. O que preparar antes

| Item | Onde ver |
|------|----------|
| URLs de **Admin**, **Ops**, **Shop** e APIs | [URLS-AMBIENTES.md](URLS-AMBIENTES.md) |
| Utilizador inicial / demo | O mesmo documento ou credenciais fornecidas pela equipa |
| Smoke automatizado do pedido | [CHECKLIST-PEDIDO-STAGING.md](CHECKLIST-PEDIDO-STAGING.md) |

---

## 2. Trilha recomendada (admin / dono do tenant)

1. **Abrir o Admin Console** na URL de staging e fazer **login** (OIDC ou modo configurado).
2. Se ainda não existe organização: usar **Criar conta** / onboarding (organização, plano, revisão) até existir um **tenant** ativo.
3. Em **Faturamento**, confirmar que o plano/trial está coerente (evita surpresas ao testar limites).
4. **Convidar um utilizador** operacional (menu Usuários) se quiser separar admin de operações — validar e-mail de convite e primeiro acesso.
5. Abrir o **Ops Portal** com o mesmo tenant (menus de contexto de organização devem estar alinhados ao `X-Tenant-Id`).
6. Ver **Painel**: pedidos recentes, estoque e alertas — confirma que APIs de pedidos e inventário respondem.
7. Opcional mas forte para demo: abrir o **Shop** (mesmo tenant, se aplicável), montar carrinho e **finalizar checkout** até criar pedido.

Para fechar o ciclo **CONFIRMED** / **PAID**, seguir o checklist de pedido em staging (workers, RabbitMQ, gateway de teste).

---

## 3. Trilha só operacional (Ops)

1. Login no **Ops Portal**.
2. Confirmar **contexto de tenant** (lista ou sessão) — sem tenant correto o painel pode parecer vazio.
3. Revisar pedidos em **Criado** / **Reservado** e executar ações permitidas (confirmar, registar envio, etc.) conforme [GUIA-DO-SISTEMA.md](GUIA-DO-SISTEMA.md) e [REGRAS-NEGOCIO.md](REGRAS-NEGOCIO.md).

---

## 4. Depois do primeiro pedido

- **Relatórios e exportação:** Admin → relatórios / dados (conforme produto); export JSON em **Faturamento** está descrito na página **Ajuda** do Admin.
- **Produção:** não uses seed de demo; segue [GO-LIVE-VENDA.md](GO-LIVE-VENDA.md) e [EXECUCAO-VENDA-MONITORIZACAO.md](EXECUCAO-VENDA-MONITORIZACAO.md).

---

## 5. Documentação no Admin Console

Na página **Ajuda** do Admin Console pode existir link para **documentação da plataforma** (`platformDocsUrl` no `config.json`). Para equipa interna, este ficheiro e o índice em [README.md](README.md) são a fonte canónica no repositório.

---

## Referências cruzadas

- [O-QUE-FALTA-100-VENDAVEL.md](O-QUE-FALTA-100-VENDAVEL.md) — checklist produto vendável (legal, billing, suporte).
- [PLANO-COMERCIAL-30-DIAS.md](PLANO-COMERCIAL-30-DIAS.md) — prioridades trial, demo e time-to-value.
