# Deploy manual (sem GitHub Actions)

Use quando o billing do GitHub Actions estiver bloqueado ou quiser subir a versão a partir da sua máquina.

## Pré-requisitos

- `docker`, `rsync`, `ssh`
- Acesso ao VPS (chave SSH ou `VPS_SSH_KEY`)
- No VPS: ficheiro `~/fluxe-b2b-suite/.env` preenchido (como no deploy automático)
- Para publicar nova imagem do **spring-saas-core**: `docker login ghcr.io` (token com `write:packages`)

## 1. Variáveis

Crie na raiz do repo **fluxe-b2b-suite** um ficheiro `.env.deploy` (não versionado):

```bash
VPS_HOST=seu-servidor.exemplo.com
VPS_USER=deploy
GHCR_ORG=ricartefelipe
# Opcional: chave SSH em base64 ou texto (se não usar chave default)
# VPS_SSH_KEY="-----BEGIN OPENSSH PRIVATE KEY-----
# ..."
```

Ou exporte antes de correr o script:

```bash
export VPS_HOST=...
export VPS_USER=...
export GHCR_ORG=ricartefelipe
```

## 2. Nova imagem do spring-saas-core (opcional)

Se alterou o **spring-saas-core** e quer que o VPS use essa versão:

1. No repo **spring-saas-core**: `./mvnw -B package -DskipTests`
2. Build e push da imagem (a partir do repo spring-saas-core):

   ```bash
   docker build -f docker/app.Dockerfile -t ghcr.io/ricartefelipe/spring-saas-core:latest .
   docker push ghcr.io/ricartefelipe/spring-saas-core:latest
   ```

Ou, a partir do **fluxe-b2b-suite**, com o caminho do outro repo:

```bash
BUILD_CORE=1 CORE_REPO_PATH=/caminho/para/spring-saas-core ./scripts/deploy-manual.sh
```

## 3. Executar deploy

Na raiz do **fluxe-b2b-suite**:

```bash
chmod +x scripts/deploy-manual.sh
./scripts/deploy-manual.sh
```

Para construir e publicar o core antes de fazer deploy:

```bash
BUILD_CORE=1 ./scripts/deploy-manual.sh
```

O script envia `docker-compose.prod.yml`, `deploy/` e `scripts/` para o VPS e corre `./scripts/deploy.sh` no servidor (pull das imagens, migrations, compose up).
