# Configurar envio de email (convite ao cadastrar usuário)

Hoje, ao cadastrar/convidar um usuário, o email **não é enviado** até você configurar o Resend no ambiente onde o **spring-saas-core** roda.

## O que fazer (cerca de 5 minutos)

### 1. Conta e API key no Resend

1. Acesse [resend.com](https://resend.com) e crie uma conta (ou faça login).
2. No dashboard: **API Keys** → **Create API Key** → dê um nome (ex.: `fluxe-staging`) → **Add**.
3. **Copie a chave** (começa com `re_`). Ela só aparece uma vez; guarde em lugar seguro.

### 2. Remetente do email

- **Para testar rápido:** use o domínio de teste do Resend: remetente = `onboarding@resend.dev` (não precisa verificar domínio).
- **Para produção:** em **Domains** no Resend, adicione seu domínio (ex.: `fluxe.com.br`), configure os registros DNS que o Resend indicar e use algo como `noreply@fluxe.com.br` em `EMAIL_FROM`.

### 3. Variáveis no Railway

1. Abra o [Railway](https://railway.app) → projeto onde está o **spring-saas-core** (Staging ou Produção).
2. Clique no **serviço spring-saas-core** → **Variables** (ou **Settings** → **Variables**).
3. Adicione ou edite estas variáveis:

| Nome | Valor |
|------|--------|
| `EMAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` | a chave que você copiou (ex.: `re_xxxxxxxx`) |
| `FRONTEND_URL` | URL do admin-console onde o usuário faz login. Ex.: `https://SEU-ADMIN-CONSOLE.up.railway.app` (pegue a URL real do seu serviço admin-console no Railway Dashboard → Settings → Networking). |
| `EMAIL_FROM` | `onboarding@resend.dev` (teste) ou `noreply@seudominio.com.br` (produção, com domínio verificado no Resend) |

4. Salve e faça **redeploy** do serviço spring-saas-core (Deploy → Redeploy, ou um novo commit no repositório).

### 4. Testar

Cadastre/convide um usuário pelo Admin Console usando um email que você acesse. O convite deve chegar na caixa de entrada (ou em spam nas primeiras vezes).

---

## Resumo (copy-paste no Railway)

Depois de ter a API key e a URL do admin-console, no Railway (serviço **spring-saas-core** → Variables) use:

```
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_COLE_SUA_CHAVE_AQUI
FRONTEND_URL=https://SEU-ADMIN-CONSOLE.up.railway.app
EMAIL_FROM=onboarding@resend.dev
```

Substitua `re_COLE_SUA_CHAVE_AQUI` e `https://SEU-ADMIN-CONSOLE.up.railway.app` pelos seus valores.

---

**Referência técnica:** [REFERENCIA-CONFIGURACAO.md](REFERENCIA-CONFIGURACAO.md) (seção Email) e `spring-saas-core/railway.prod.env.example`.
