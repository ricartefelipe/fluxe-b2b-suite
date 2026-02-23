# ADR-002: Estratégia de Autenticação

## Status

Aceito

## Contexto

As aplicações precisam autenticar usuários contra um Identity Provider corporativo em produção, mas também permitir desenvolvimento local sem dependência de infraestrutura externa.

## Decisão

- **Produção**: OIDC com PKCE flow via `angular-auth-oidc-client`. O token JWT é obtido do IdP e anexado a todas as requisições via `HttpInterceptor`.
- **Desenvolvimento local**: fallback para um token estático configurável via `environment.ts` ou `config.json`, permitindo desenvolvimento sem IdP rodando.
- A lib `shared/auth` encapsula ambas as estratégias atrás de uma interface `AuthService`, selecionada por configuração em runtime.

## Consequências

- Desenvolvedores podem trabalhar offline sem IdP.
- A troca entre estratégias é transparente para os consumers da `AuthService`.
- O token dev nunca deve ser usado fora de `development` — enforced via guards de configuração.
