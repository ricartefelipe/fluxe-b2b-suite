# Termos de Uso e Política de Privacidade

Este documento é uma **referência para o time**: onde publicar e como manter os textos legais do Fluxe B2B Suite. Os conteúdos em si (texto jurídico) devem ser redigidos por advogado ou equipe legal.

---

## O que preparar para go-live / venda

| Documento | Uso | Onde publicar |
|-----------|-----|----------------|
| **Termos de uso** | Contrato de uso da plataforma (aceite no signup ou no primeiro acesso) | Página pública no frontend (ex.: `/termos`) e link no rodapé ou na tela de login/signup |
| **Política de privacidade** | Tratamento de dados pessoais (LGPD/GDPR) | Página pública (ex.: `/privacidade`), link no rodapé e, se aplicável, no signup |
| **Contrato de assinatura** | Condições comerciais dos planos (Starter, Pro, Enterprise) | Pode ser incorporado aos Termos ou mantido no Stripe (Customer Portal); alinhar com jurídico |

---

## Checklist

- [ ] Termos de uso redigidos e revisados (jurídico)
- [ ] Política de privacidade redigida e revisada (jurídico)
- [ ] URLs definidas (ex.: `https://app.seudominio.com.br/termos`, `https://app.seudominio.com.br/privacidade`)
- [ ] Rotas e páginas criadas no frontend (ou conteúdo estático servido pelo mesmo domínio)
- [ ] Links no rodapé do Shop, Ops Portal e Admin Console
- [ ] Link na tela de login/signup ("Ao criar conta, você aceita os Termos e a Política de Privacidade")
- [ ] Contrato de assinatura alinhado ao Stripe e aos planos do sistema

---

## Dados tratados pela plataforma (para referência da privacidade)

A plataforma coleta e processa, entre outros:

- **Identidade:** e-mail, nome, senha (hash), tenant (organização)
- **Uso:** logs de auditoria (ações, recurso, resultado, correlation ID)
- **Comercial:** dados de assinatura e pagamento (Stripe); dados de pedidos e ledger

Todos os serviços aplicam isolamento por tenant; auditoria e retenção estão documentados em [REGRAS-NEGOCIO.md](REGRAS-NEGOCIO.md) e [GUIA-DO-SISTEMA.md](GUIA-DO-SISTEMA.md).

---

## Referências

- [GO-LIVE-VENDA.md](GO-LIVE-VENDA.md) — checklist completo de go-live (incl. itens legais)
- [GUIA-DO-SISTEMA.md](GUIA-DO-SISTEMA.md) — modelo de segurança e governança
