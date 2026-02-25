# Publicar a aplicação — guia para quem não é de TI

Este guia é para **quem não sabe fazer deploy**. Só siga os passos na ordem. Se travar, veja a seção **“Se ainda assim for difícil”** no final.

---

## O que você pode publicar

| Opção | O que fica no ar | Dificuldade | Custo |
|-------|-------------------|-------------|--------|
| **A) Só o frontend** | Site (telas da aplicação). Os botões e links existem, mas ao clicar em “pedidos” ou “pagamentos” não vai carregar dados de verdade, porque os servidores (backends) não estão na nuvem. | Fácil (poucos cliques) | Grátis |
| **B) Aplicação completa** | Site + servidores (Core, Orders, Payments). Tudo funcionando na nuvem. | Médio (vários passos, mas tudo explicado) | Grátis no início; depois alguns dólares por mês |

Recomendação: comece pela **Opção A**. Quando estiver confortável, siga a **Opção B**.

---

# Opção A — Publicar só o frontend (GitHub Pages)

Você vai ter um link público tipo: `https://SEU-USUARIO.github.io/fluxe-b2b-suite/`

## Passo 1 — Abrir o repositório no GitHub

1. Abra o navegador e vá em: **https://github.com**
2. Faça login na sua conta.
3. Abra o repositório **fluxe-b2b-suite** (se ainda não tiver no GitHub, crie o repositório e envie o código).

## Passo 2 — Ativar o GitHub Pages

**Forma mais fácil (eu preparei um script que faz isso por você):**

1. Abra o terminal na pasta do projeto **fluxe-b2b-suite**.
2. Rode: **`./scripts/abrir-config-pages.sh`**
3. O navegador vai abrir na página certa. Siga o que o script imprimir na tela (escolher "GitHub Actions" no dropdown e depois dar push na main).

**Se preferir fazer manualmente:**

1. Dentro do repositório, clique em **Settings** (Configurações).
2. No menu da esquerda, clique em **Pages**.
3. Em **Build and deployment**:
   - Em **Source**, escolha: **GitHub Actions**.
4. Não precisa mudar mais nada. Deixe assim.

## Passo 3 — Fazer o primeiro deploy

1. O deploy acontece **sozinho** quando o código é enviado na branch **main** (ou **master**).
2. Se você usa Git no computador:
   - Abra o terminal na pasta do projeto.
   - Rode: `git push origin main` (ou `git push origin master`).
3. Se você não usa Git: faça um pequeno ajuste em qualquer arquivo pelo site do GitHub (edite um arquivo e salve). Isso dispara o deploy.

## Passo 4 — Ver o site no ar

1. Depois de alguns minutos (2–5 min), vá em:
   - **https://SEU-USUARIO.github.io/fluxe-b2b-suite/**
   - Troque **SEU-USUARIO** pelo seu usuário do GitHub.
2. Você deve ver a página inicial com links para **Ops Portal**, **Admin Console** e **Shop**.

**Pronto.** O frontend está publicado. Os links vão abrir as telas; como os backends não estão na nuvem, dados (pedidos, pagamentos) não vão carregar — isso é normal. Para ter tudo funcionando, use a Opção B.

---

# Opção B — Aplicação completa na nuvem (Railway)

Aqui você vai colocar no ar: **Spring (Core)**, **Node (Orders)**, **Python (Payments)** e o **frontend**. Tudo com conta grátis no início.

**Antes de começar:**  
Você vai precisar criar contas grátis em:

- **GitHub** (já deve ter)
- **Railway** — https://railway.app (login com GitHub)
- **CloudAMQP** — https://www.cloudamqp.com (conta grátis para RabbitMQ)

Se em algum passo aparecer “cartão de crédito”, no Railway você pode seguir sem colocar cartão no plano free; eles avisam o limite de uso.

---

## Parte 1 — RabbitMQ (filas de mensagens)

1. Acesse **https://www.cloudamqp.com** e crie uma conta (ou entre com GitHub).
2. Clique em **Create New Instance**.
3. Escolha o plano **Little Lemur** (free).
4. Dê um nome (ex.: `fluxe-b2b`) e escolha uma região perto de você.
5. Clique em **Create**.
6. Na tela do instance, abra **Details** e copie a URL que aparece em **AMQP URL** (algo como `amqps://xxxxx:yyyy@jackal.rmq.cloudamqp.com/zzzz`).  
   **Guarde essa URL** — você vai colar nos serviços Node e Python no Railway.

---

## Parte 2 — Criar o projeto no Railway

1. Acesse **https://railway.app** e entre com **GitHub**.
2. Clique em **New Project**.
3. Escolha **Empty Project** (projeto vazio).

Dentro desse projeto você vai adicionar vários “services”. Cada service é um banco ou uma aplicação.

---

## Parte 3 — Bancos de dados e Redis no Railway

No mesmo projeto:

1. Clique em **+ New** (ou **Add Service**).
2. Escolha **Database** → **PostgreSQL**. Crie. Anote a URL que aparecer em **Variables** (ex.: `DATABASE_URL`).
3. Repita e crie **mais dois PostgreSQL** (um para Orders, um para Payments) — ou use um único PostgreSQL com 3 bancos diferentes, se preferir. O importante é ter:
   - Um para o **Core** (Spring).
   - Um para o **Orders** (Node).
   - Um para o **Payments** (Python).
4. Clique em **+ New** de novo → **Database** → **Redis**. Crie. Anote a URL (ex.: `REDIS_URL`).

Se o Railway der só uma Redis, pode usar a mesma URL para os três backends (em produção às vezes se usa uma por serviço; para começar, uma só serve).

---

## Parte 4 — Serviço 1: Spring (Core)

1. No projeto Railway, clique em **+ New** → **Empty Service** (ou **Deploy from GitHub** se quiser ligar ao repo).
2. Se tiver escolhido “Deploy from image”:
   - Em **Image**, coloque: `ghcr.io/SEU-OWNER/spring-saas-core:latest`  
     (troque **SEU-OWNER** pelo dono do repositório no GitHub, ex.: sua org ou seu usuário).
3. Abra **Variables** (Variáveis) desse serviço e adicione (troque os valores pelos que o Railway mostrou nos bancos):

   - `SPRING_PROFILES_ACTIVE` = `prod`
   - `DB_URL` = `jdbc:postgresql://host:5432/railway`  
     (pegue o host e a porta do PostgreSQL do **Core** que você criou; o Railway mostra isso nas variáveis do banco).
   - `DB_USER` = usuário do PostgreSQL do Core
   - `DB_PASS` = senha do PostgreSQL do Core

   Para desenvolvimento simples (sem OIDC):

   - `AUTH_MODE` = `jwt`
   - `JWT_HS256_SECRET` = `local-dev-secret-min-32-chars-for-hs256-signing`
   - `JWT_ISSUER` = `spring-saas-core`

4. Depois de salvar, o Railway vai fazer o deploy. Quando terminar, ele gera uma URL pública (ex.: `https://spring-saas-core-xxxx.up.railway.app`). **Copie essa URL** — é a do Core.

---

## Parte 5 — Serviço 2: Node (Orders)

1. **+ New** → **Empty Service** (ou imagem).
2. Se for por imagem: `ghcr.io/SEU-OWNER/node-b2b-orders:latest`.
3. Em **Variables** desse serviço:

   - `DATABASE_URL` = URL do PostgreSQL que você reservou para **Orders** (Railway mostra nas variáveis do banco).
   - `REDIS_URL` = URL do Redis que você criou.
   - `RABBITMQ_URL` = a **AMQP URL** que você copiou do CloudAMQP (Passo 1).
   - `JWT_SECRET` = **o mesmo** que no Core: `local-dev-secret-min-32-chars-for-hs256-signing`
   - `JWT_ISSUER` = `spring-saas-core`

4. Salve. Anote a URL que o Railway der para esse serviço (ex.: `https://node-b2b-orders-xxxx.up.railway.app`). Essa é a do **Orders**.

---

## Parte 6 — Serviço 3: Python (Payments)

1. **+ New** → **Empty Service** (ou imagem).
2. Se for por imagem: `ghcr.io/SEU-OWNER/py-payments-ledger:latest`.
3. Em **Variables**:

   - `DATABASE_URL` = URL do PostgreSQL do **Payments** (formato: `postgresql+psycopg://user:pass@host:5432/railway`).
   - `REDIS_URL` = mesma do Redis.
   - `RABBITMQ_URL` = **a mesma** do CloudAMQP (mesma que você usou no Node).
   - `JWT_SECRET` = o mesmo do Core e do Node.
   - `JWT_ISSUER` = `spring-saas-core`
   - `ORDERS_INTEGRATION_ENABLED` = `true`

4. Salve e anote a URL do serviço (ex.: `https://py-payments-ledger-xxxx.up.railway.app`). Essa é a do **Payments**.

---

## Parte 7 — Frontend apontando para os backends

O frontend precisa saber as URLs do Core, Orders e Payments. Duas formas:

**Se você publicou o frontend no GitHub Pages (Opção A):**  
O site estático já está em `https://SEU-USUARIO.github.io/fluxe-b2b-suite/`. Para ele usar os backends do Railway, é preciso que o `config.json` (ou o que o frontend lê) tenha as URLs corretas. Isso normalmente é definido no **build** do frontend. No repositório existe documentação em `docs/documento-implantacao.md` (seção “Frontend build-time ou runtime”). Em resumo: você precisa fazer um build do frontend onde:

- `coreApiBaseUrl` = URL do Core no Railway
- `ordersApiBaseUrl` = URL do Orders no Railway  
- `paymentsApiBaseUrl` = URL do Payments no Railway  
- `authMode` = `dev` (para usar JWT simples) ou `oidc` quando tiver Keycloak/OIDC

Depois desse build, você pode subir os arquivos de novo para o GitHub Pages (ou para outro lugar que estiver usando).

**Se quiser subir o frontend também no Railway:**  
Crie outro service no mesmo projeto, use o build do Nx (ex.: `nx build ops-portal`) e faça deploy (por GitHub ou por imagem). Nas variáveis ou no config, use as mesmas URLs do Core, Orders e Payments.

---

## Resumo das URLs que você precisa anotar

- **CloudAMQP:** AMQP URL (uma só para Node e Python).
- **Railway – Core:** URL pública do serviço Spring.
- **Railway – Orders:** URL pública do serviço Node.
- **Railway – Payments:** URL pública do serviço Python.

Com essas três URLs você configura o frontend (config/build) para falar com a aplicação completa na nuvem.

---

# Se ainda assim for difícil

- **Frontend só (Opção A):** Se travar no Passo 2 ou 3, peça para alguém com acesso ao repositório: “Ativa o GitHub Pages em Source = GitHub Actions e dá um push na main”.
- **Aplicação completa (Opção B):** Você pode:
  - Enviar este arquivo (`docs/PUBLICAR-PASSO-A-PASSO.md`) para um amigo que entenda de deploy e pedir para seguir o guia; ou
  - Contratar alguém (ex.: Fiverr, Workana) para “fazer o deploy da aplicação Fluxe B2B na Railway usando este guia”. O guia já tem a ordem e as variáveis; a pessoa só precisa criar as contas e repetir os passos.

---

# Referências no próprio projeto

- **Ordem e variáveis de cada serviço:** `docs/documento-implantacao.md`
- **Deploy automático (imagens, GitHub Pages):** `docs/ci-cd-e-deploy.md`
- **Rodar tudo no seu computador:** `./scripts/rodar-local.sh` (veja `docs/E2E-RUN.md`)
