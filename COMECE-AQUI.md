# Comece aqui

Se queres **ver o B2B a funcionar na tua máquina** e não queres perder tempo a ler dez guias, segue só isto.

## 1. Pastas no disco

Ao lado de `fluxe-b2b-suite` precisas dos três backends (clone se ainda não tens):

- `spring-saas-core`
- `node-b2b-orders`
- `py-payments-ledger`

Exemplo: tudo dentro da mesma pasta `wks/`.

## 2. Uma vez: ferramentas

- **Docker** a correr (Docker Desktop ou Engine)
- **Java 21** + **Maven** (`mvn`)
- **Node.js 20+** e **pnpm**
- **Python 3.12+** com módulo **venv** (em Ubuntu/Debian costuma ser o pacote `python3.12-venv`)

## 3. Comando único

Na raiz de **fluxe-b2b-suite**:

```bash
./scripts/up-local.sh
```

Isto sobe bases (Docker), os três backends, migrations, seed de demo (onde aplicável), Keycloak opcional, três frontends em `http://localhost:4200`, `4300`, `4400`.

- Só infra (rápido, para testar Docker): `./scripts/up-local.sh --only-infra`
- Parar tudo: `./scripts/up-local.sh --down`
- Ver o que responde: `./scripts/up-local.sh --status`

## 4. Se algo falhar

- Logs: pasta `.local-logs/` dentro de `fluxe-b2b-suite`
- Guia de produto (login, primeiro pedido): [docs/PRIMEIROS-PASSOS.md](docs/PRIMEIROS-PASSOS.md)
- Produção real (domínio, Stripe, etc.): [docs/GO-LIVE-VENDA.md](docs/GO-LIVE-VENDA.md)
- **Vender a clientes** (backup, incidentes, preflight de env): [docs/PRODUCAO-OPERACAO.md](docs/PRODUCAO-OPERACAO.md)
