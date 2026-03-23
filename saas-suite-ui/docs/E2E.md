# Testes E2E (Playwright + Nx)

Os projetos `*-e2e` levantam o dev server da app correspondente e correm Playwright. **Não é obrigatório** ter spring-saas-core (`:8080`), node-b2b-orders (`:3000`) ou py-payments (`:8000`) a correr: os mocks em `install-core-mocks.ts` (e no shop, `shop-orders-api-mock.ts`) interceptam `POST /v1/dev/token` e os GETs necessários.

## Comandos

Na raiz `saas-suite-ui`:

```bash
# Admin + Ops (porta 4200 — executar em sequência se usar a mesma porta)
CI=true pnpm nx run-many -t e2e --projects=admin-console-e2e,ops-portal-e2e --parallel=1

# Shop
CI=true pnpm nx run shop-e2e:e2e
```

## Fixtures

Cada suite exporta `test`/`expect` a partir de `./fixtures`, que instala os mocks antes de cada teste. Importar sempre `from './fixtures'` em vez de `@playwright/test` diretamente nos `.spec.ts`.

## Integração real (opcional)

Para validar contra APIs reais, arranque os serviços nas portas do `proxy.conf.json` e, se necessário, desative ou reduza os mocks nos ficheiros acima.
