# Deploy manual (sem GitHub Actions) — Opção B

Use quando o billing do GitHub Actions estiver bloqueado ou quiser subir a versão a partir da sua máquina.

## Pré-requisitos

- `docker`, `rsync`, `ssh`
- Acesso ao VPS (chave SSH ou `VPS_SSH_KEY`)
- No VPS: ficheiro `~/fluxe-b2b-suite/.env` preenchido (como no deploy automático)
- Para publicar a imagem **spring-saas-core**: `docker login ghcr.io` (token com `write:packages`)

---

## Passo a passo (Opção B — publicar tudo manualmente)

### 1. Publicar imagem spring-saas-core no GHCR

No repo **spring-saas-core** (branch `develop` já atualizada):

```bash
cd /caminho/para/spring-saas-core
docker login ghcr.io -u ricartefelipe
# (password = Personal Access Token com write:packages)

chmod +x scripts/build-push-image.sh
./scripts/build-push-image.sh
```

Isto faz: `mvn package`, `docker build`, `docker push` para `ghcr.io/ricartefelipe/spring-saas-core:latest`.

O script usa `docker/app.Dockerfile.hostbuild` (JAR construído no host, sem Maven dentro do container). Se preferir à mão:

```bash
./mvnw -B package -DskipTests
docker build -f docker/app.Dockerfile.hostbuild -t ghcr.io/ricartefelipe/spring-saas-core:latest .
docker push ghcr.io/ricartefelipe/spring-saas-core:latest
```

### 2. Configurar variáveis do deploy

Na raiz do repo **fluxe-b2b-suite**, crie `.env.deploy` (não versionado). Pode copiar o exemplo:

```bash
cp .env.deploy.example .env.deploy
# Edite .env.deploy e preencha VPS_HOST e VPS_USER
```

Conteúdo mínimo:

```bash
VPS_HOST=seu-servidor.exemplo.com
VPS_USER=deploy
GHCR_ORG=ricartefelipe
# Opcional: se não usar chave SSH default
# VPS_SSH_KEY="-----BEGIN OPENSSH PRIVATE KEY-----
# ..."
```

### 3. Fazer deploy no VPS

No repo **fluxe-b2b-suite** (branch `develop` já atualizada):

```bash
cd /caminho/para/fluxe-b2b-suite
chmod +x scripts/deploy-manual.sh
./scripts/deploy-manual.sh
```

O script envia `docker-compose.prod.yml`, `deploy/` e `scripts/` para o VPS, corre `./scripts/deploy.sh` no servidor (pull das imagens, migrations, `docker compose up`) e faz smoke test.

---

## Variáveis (referência)

| Variável    | Obrigatória | Descrição                          |
|------------|-------------|------------------------------------|
| `VPS_HOST` | Sim         | Hostname ou IP do servidor         |
| `VPS_USER` | Sim         | Utilizador SSH                     |
| `GHCR_ORG` | Não         | Org GHCR (default: ricartefelipe)  |
| `VPS_SSH_KEY` | Não      | Chave SSH (se não usar a default)  |

---

## Deploy só do core (build local + push)

Se quiser que o script de deploy construa e faça push da imagem antes de ligar ao VPS (ex.: os dois repos estão na mesma máquina):

```bash
BUILD_CORE=1 CORE_REPO_PATH=/caminho/para/spring-saas-core ./scripts/deploy-manual.sh
```

Requer `docker login ghcr.io` feito antes.
