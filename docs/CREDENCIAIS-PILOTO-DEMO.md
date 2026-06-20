# Credenciais e massa de dados — piloto AWS

Base: **https://54-94-52-89.sslip.io**

## Logins (Core → shop / ops / admin)

| Perfil | E-mail | Senha | Tenant | Uso |
|--------|--------|-------|--------|-----|
| Plataforma | `admin@local` | `admin123` | Fluxe B2B Suite | Admin global, vê todos os tenants |
| Cliente demo | `ops@demo.example.com` | `ops123` | Demo Corp | Ops do tenant demo (pedidos seed) |
| Acme admin | `admin@acme.com.br` | `admin123` | Acme Distribuidora | Segundo tenant — admin |
| Acme compras | `compras@acme.com.br` | `admin123` | Acme Distribuidora | Ops/compras B2B |
| TechParts | `gerente@techparts.com.br` | `admin123` | TechParts Ltda | Terceiro tenant |

## Massa de dados (piloto)

| Serviço | Dados |
|---------|--------|
| **Core** | Tenants Acme/TechParts/Global + flags, subscriptions, audit (Liquibase seed) |
| **Orders** | ~50 produtos, ~20 pedidos, 2 tenants (Demo + Acme) |
| **Payments** | Ledger + intents (seed staging) |

## Signup (novo tenant)

Shop ou Admin → **Criar conta** → cria tenant + admin automaticamente.

## Comandos úteis

```bash
source .aws-deploy/last-ec2.env
./scripts/aws-pilot-smoke.sh
./scripts/aws-pilot-status.sh
```
