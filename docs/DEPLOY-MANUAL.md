# Deploy manual (fora do GitHub Actions)

Use quando precisar publicar **sem** depender dos runners do GitHub (ex.: billing bloqueado) ou para testar o pipeline de produção a partir da sua máquina.

O fluxo **oficial** quando o Actions está ativo está em [DEPLOY-GITHUB.md](DEPLOY-GITHUB.md). Este documento é o **caminho paralelo** com os mesmos artefactos (imagem GHCR + `deploy.sh` no VPS).

## Pré-requisitos

- `docker`, `rsync`, `ssh`
- VPS com `~/fluxe-b2b-suite/.env` configurado
- `docker login ghcr.io` (token com `write:packages`) para publicar a imagem do core

---

## 1. Publicar imagem spring-saas-core (GHCR)

No repositório **spring-saas-core** (branch desejada, ex. `develop`):

```bash
docker login ghcr.io -u ricartefelipe
chmod +x scripts/build-push-image.sh
./scripts/build-push-image.sh
```

O script faz `mvn package`, `docker build` com `docker/app.Dockerfile.hostbuild` (JAR no host) e `docker push`.

---

## 2. Configurar acesso ao VPS

Na raiz do **fluxe-b2b-suite**:

```bash
cp .env.deploy.example .env.deploy
# Editar: VPS_HOST, VPS_USER, GHCR_ORG; opcionalmente VPS_SSH_KEY
```

`.env.deploy` está no `.gitignore` e não deve ser commitado.

---

## 3. Deploy no VPS

```bash
chmod +x scripts/deploy-manual.sh
./scripts/deploy-manual.sh
```

Ou **num só passo** (build do core + deploy), com os dois repos no mesmo nível de pastas:

```bash
BUILD_CORE=1 CORE_REPO_PATH="../spring-saas-core" ./scripts/deploy-manual.sh
```

(Exige `docker login ghcr.io` antes.)

---

## Variáveis

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VPS_HOST` | Sim | Hostname ou IP do servidor |
| `VPS_USER` | Sim | Utilizador SSH |
| `GHCR_ORG` | Não | Default `ricartefelipe` |
| `VPS_SSH_KEY` | Não | Chave privada (se não usar a default do `ssh`) |

---

## Relação com o GitHub

- **Manual**: você controla quando faz push da imagem e quando corre o sync para o VPS.
- **GitHub**: ver [DEPLOY-GITHUB.md](DEPLOY-GITHUB.md) — workflows `build-push.yml` (core) e `deploy-frontend.yml` / `deploy-prod.yml` (suite).

Ambos podem coexistir; evite sobrescrever tags no GHCR sem coordenação entre equipa.
