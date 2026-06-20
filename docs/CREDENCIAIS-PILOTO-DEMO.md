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

| Serviço | Dados (tenant demo `...002`) |
|---------|------------------------------|
| **Core** | 7 tenants, 11 users, 23 políticas ABAC, 8 feature flags, audit log |
| **Orders** | 25 produtos, 15+ pedidos (vários status), inventário, 2 tenants |
| **Payments** | 20 payment intents, 13+ ledger entries, invoices, refunds |
| **Shop** | Catálogo completo com imagens e estoque |

### Recarregar massa de dados

```bash
source .aws-deploy/last-ec2.env
./scripts/aws-pilot-seed.sh
```

O script aplica o seed realistic do Payments na EC2 e roda `demo-seed.sh` contra as URLs HTTPS do piloto.

## Signup (novo tenant)

Shop ou Admin → **Criar conta** → cria tenant + admin automaticamente.

## Comandos úteis

```bash
source .aws-deploy/last-ec2.env
./scripts/aws-pilot-smoke.sh
./scripts/aws-pilot-status.sh
./scripts/aws-pilot-seed.sh   # recarrega massa de dados em Core/Orders/Payments
```
