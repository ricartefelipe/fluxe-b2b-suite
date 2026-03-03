# Deploy Frontend — Cloudflare Pages

Guia para deploy das 3 aplicações Angular do Fluxe B2B Suite no Cloudflare Pages (free tier com CDN global).

## Arquitetura

Cada app Angular é um **projeto separado** no Cloudflare Pages, com domínio próprio:

| App | Cloudflare Project | Domínio sugerido | Build output |
|---|---|---|---|
| shop | `fluxe-shop` | `shop.fluxe.com.br` | `dist/apps/shop/browser` |
| ops-portal | `fluxe-ops-portal` | `ops.fluxe.com.br` | `dist/apps/ops-portal/browser` |
| admin-console | `fluxe-admin-console` | `admin.fluxe.com.br` | `dist/apps/admin-console/browser` |

## 1. Criar projetos no Cloudflare Pages

### Via Dashboard

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create**
2. Selecione **Pages** → **Connect to Git**
3. Selecione o repositório `fluxe-b2b-suite`
4. Configure o build:

**fluxe-shop:**
```
Build command:   cd saas-suite-ui && pnpm install --frozen-lockfile && pnpm nx build shop --configuration=production
Build output:    saas-suite-ui/dist/apps/shop/browser
Root directory:  /
```

**fluxe-ops-portal:**
```
Build command:   cd saas-suite-ui && pnpm install --frozen-lockfile && pnpm nx build ops-portal --configuration=production
Build output:    saas-suite-ui/dist/apps/ops-portal/browser
Root directory:  /
```

**fluxe-admin-console:**
```
Build command:   cd saas-suite-ui && pnpm install --frozen-lockfile && pnpm nx build admin-console --configuration=production
Build output:    saas-suite-ui/dist/apps/admin-console/browser
Root directory:  /
```

### Via Wrangler CLI (alternativa)

```bash
# Instalar wrangler
npm i -g wrangler
wrangler login

# Criar projetos
wrangler pages project create fluxe-shop --production-branch main
wrangler pages project create fluxe-ops-portal --production-branch main
wrangler pages project create fluxe-admin-console --production-branch main
```

## 2. Variáveis de ambiente

Configurar em **Settings → Environment Variables** de cada projeto:

| Variável | Descrição | Exemplo |
|---|---|---|
| `NODE_VERSION` | Versão do Node.js | `20` |
| `PNPM_VERSION` | Versão do pnpm | `9` |

> As variáveis de runtime da aplicação (API URLs, Keycloak) são injetadas via `config.json`
> no build output — veja `scripts/inject-frontend-config.sh`.

## 3. Custom domains

Para cada projeto no Cloudflare Pages:

1. **Custom domains** → **Set up a domain**
2. Inserir o domínio (ex: `shop.fluxe.com.br`)
3. Cloudflare cria automaticamente o registro CNAME
4. SSL/TLS é provisionado automaticamente (Full strict)

Se o domínio já está no Cloudflare DNS:
```
shop.fluxe.com.br    CNAME  fluxe-shop.pages.dev
ops.fluxe.com.br     CNAME  fluxe-ops-portal.pages.dev
admin.fluxe.com.br   CNAME  fluxe-admin-console.pages.dev
```

## 4. SPA routing

Cada app inclui um `_redirects` na pasta `public/` que garante SPA routing:

```
/* /index.html 200
```

Isso redireciona todas as rotas para `index.html`, permitindo que o Angular Router funcione.

## 5. Security headers

Cada app inclui um `_headers` na pasta `public/` com:

- **Content-Security-Policy** — restringe origens de scripts/estilos
- **X-Frame-Options: DENY** — previne clickjacking
- **X-Content-Type-Options: nosniff** — previne MIME sniffing
- **Referrer-Policy** — limita dados no referer
- **Permissions-Policy** — desabilita APIs desnecessárias
- **Strict-Transport-Security** — força HTTPS

## 6. Deploy via GitHub Actions

O workflow `.github/workflows/deploy-frontend.yml` faz deploy automático:

- **Push em `main`** → deploy para produção
- **Push em `develop`** → deploy para preview

O deploy usa `cloudflare/wrangler-action` com os secrets:
- `CLOUDFLARE_API_TOKEN` — token com permissão Pages
- `CLOUDFLARE_ACCOUNT_ID` — ID da conta Cloudflare

### Criar o API Token

1. [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. **Create Token** → **Custom token**
3. Permissões:
   - `Account` → `Cloudflare Pages` → `Edit`
4. Copiar o token e adicionar como secret no GitHub:
   - Repo → **Settings** → **Secrets** → **Actions** → `CLOUDFLARE_API_TOKEN`
   - Adicionar também `CLOUDFLARE_ACCOUNT_ID`

## 7. Preview deployments

Cloudflare Pages cria automaticamente um preview para cada PR.
URL no formato: `<commit-hash>.fluxe-shop.pages.dev`

Para desabilitar previews de apps específicos, configure em
**Settings → Builds & Deployments → Branch control**.

## 8. Limites do free tier

| Recurso | Limite |
|---|---|
| Builds/mês | 500 |
| Requests/dia | Ilimitado |
| Bandwidth/mês | Ilimitado |
| Sites | Ilimitado |
| Preview deploys | Ilimitado |
| Build timeout | 20 min |
