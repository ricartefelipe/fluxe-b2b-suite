# Levantar a suite completa e rodar smoke

Um comando sobe **tudo**: Spring (Core), Node (Orders), Python (Payments), bancos, Redis, RabbitMQ e frontend. Depois você roda o teste de fumaça em outro terminal.

---

## 1. Liberar Docker (só uma vez)

Se `docker info` der **permission denied**:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

(Ou faça logout e login. O `newgrp docker` vale só na sessão atual.)

Confirme:

```bash
docker info
```

---

## 2. Subir a suite inteira

Na pasta **fluxe-b2b-suite**:

```bash
cd /home/frm/Documentos/wks/fluxe-b2b-suite
./scripts/rodar-local.sh
```

O script:

1. Cria a rede Docker `fluxe_shared`
2. Ajusta JWT nos `.env` de Node e Python (E2E)
3. Sobe **spring-saas-core** (Postgres, Redis, RabbitMQ, app na 8080)
4. Sobe **node-b2b-orders** (Postgres, Redis, API 3000 + worker, migrate + seed)
5. Sobe **py-payments-ledger** (Postgres, Redis, API 8000 + worker, migrate + seed)
6. Inicia o **frontend** (Ops Portal em http://localhost:4200)

Aguarde até aparecer algo como *"URL: http://localhost:4200"* e o servidor do frontend estar rodando (pode levar 3–5 minutos na primeira vez).

---

## 3. Teste de fumaça (outro terminal)

Com a suite no ar, em **outro terminal**:

```bash
cd /home/frm/Documentos/wks/fluxe-b2b-suite
./scripts/smoke-suite.sh
```

O smoke verifica:

- Core: http://localhost:8080/actuator/health/liveness  
- Orders: http://localhost:3000/v1/healthz  
- Payments: http://localhost:8000/healthz  

Se os três responderem, está OK. O script ainda lembra do frontend e do RabbitMQ UI.

---

## 4. Teste manual rápido

- **Frontend:** http://localhost:4200 → login com perfil **Ops User** (tenant_demo)  
- **RabbitMQ:** http://localhost:15672 (guest/guest)  
- **Swagger Core:** http://localhost:8080/docs  
- **Swagger Orders:** http://localhost:3000/docs  
- **Swagger Payments:** http://localhost:8000/docs  

---

## Só o frontend (sem Docker)

Se quiser **apenas** o Ops Portal na sua máquina:

```bash
cd fluxe-b2b-suite/saas-suite-ui
pnpm install
pnpm nx serve ops-portal
```

Acesse **http://localhost:4200**. Se aparecer **"Port 4200 is already in use"**:

- Feche o outro processo que está na 4200, ou
- Use outra porta: `pnpm nx serve ops-portal --port 4201` e abra **http://localhost:4201**

---

## Se algo falhar

- **Docker inacessível:** repita o passo 1 e use `newgrp docker` ou novo login.
- **Porta em uso:** verifique o que está usando 8080, 3000, 8000, 5432, 5672, etc.
- **Container não sobe:** `cd ../spring-saas-core && docker compose logs -f` (e o mesmo para node-b2b-orders e py-payments-ledger).
- **Smoke falha:** espere mais um pouco (migrações e seeds) e rode `./scripts/smoke-suite.sh` de novo.

- **Front não levanta (ops-portal / admin-console / shop):**
  - **"Port 4200 is already in use"** — Feche o outro processo ou use `pnpm nx serve ops-portal --port 4201` e abra http://localhost:4201
  - **Build trava ou erro de tsconfig** — `pnpm nx reset` e depois `pnpm nx serve ops-portal`
  - **Erro em node_modules** — `rm -rf node_modules && pnpm install`
  - **Ver erro completo** — `pnpm nx serve ops-portal --verbose`
