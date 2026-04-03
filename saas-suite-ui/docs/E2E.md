# Testes E2E (Playwright + Nx)

## Onde é o “ambiente” oficial (sem a tua máquina)

O gate de merge **não** exige correr Playwright localmente. No repositório **fluxe-b2b-suite**, o workflow **[`.github/workflows/deploy.yml`](https://github.com/ricartefelipe/fluxe-b2b-suite/blob/develop/.github/workflows/deploy.yml)** (nome **CI** no GitHub Actions) instala Chromium, corre lint/test/typecheck/build e **em seguida** `nx run-many -t e2e` para `shop-e2e`, `ops-portal-e2e` e `admin-console-e2e` no runner **ubuntu-latest**. O Playwright sobe cada app com `nx …:serve` (ver `playwright.config.ts` de cada projeto); usa mocks, por isso **não** precisa dos backends na CI.

Dispara em **push/PR** para `develop` ou `master` quando mudam `saas-suite-ui/**`, `scripts/**`, `docs/**` ou o próprio workflow; também podes usar **Actions → CI → Run workflow**. Badge no README do monorepo.

**Nota:** `saas-suite-ui/.github/workflows/ci.yml` **não** é executado pelo GitHub (só workflows na raiz do repo); o pipeline válido é o da raiz.

---

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
