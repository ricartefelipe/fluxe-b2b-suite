#!/usr/bin/env bash
# Initial VPS setup for Fluxe B2B Suite on Hetzner (Ubuntu 22.04+).
# Run ONCE as root on a fresh server: curl -sSL <url> | bash
# or: scp server-setup.sh root@<ip>:/tmp/ && ssh root@<ip> bash /tmp/server-setup.sh
set -euo pipefail

FLUXE_USER="fluxe"
PROJECT_DIR="/opt/fluxe"

echo "============================================"
echo " Fluxe B2B Suite — VPS Initial Setup"
echo "============================================"
echo ""

if [ "$(id -u)" -ne 0 ]; then
  echo "ERRO: execute como root."
  exit 1
fi

# ─── 1. System update ───────────────────────────────────────────────────────
echo "[1/8] Atualizando sistema..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget git unzip htop ncdu jq \
  ca-certificates gnupg lsb-release \
  software-properties-common apt-transport-https

# ─── 2. Docker + Docker Compose ─────────────────────────────────────────────
echo "[2/8] Instalando Docker..."
if ! command -v docker &>/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list

  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  echo "  Docker $(docker --version) instalado."
else
  echo "  Docker já instalado: $(docker --version)"
fi

# ─── 3. fail2ban (SSH brute-force protection) ───────────────────────────────
echo "[3/8] Instalando fail2ban..."
apt-get install -y -qq fail2ban
cat > /etc/fail2ban/jail.local << 'F2B'
[sshd]
enabled  = true
port     = ssh
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 5
bantime  = 3600
findtime = 600
F2B
systemctl enable fail2ban
systemctl restart fail2ban
echo "  fail2ban ativo (ban 1h após 5 tentativas)."

# ─── 4. UFW firewall ────────────────────────────────────────────────────────
echo "[4/8] Configurando UFW..."
apt-get install -y -qq ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment "SSH"
ufw allow 80/tcp   comment "HTTP"
ufw allow 443/tcp  comment "HTTPS"
echo "y" | ufw enable
ufw status verbose
echo "  UFW ativo: 22, 80, 443."

# ─── 5. Create non-root user ────────────────────────────────────────────────
echo "[5/8] Criando usuário '${FLUXE_USER}'..."
if id "${FLUXE_USER}" &>/dev/null; then
  echo "  Usuário '${FLUXE_USER}' já existe."
else
  adduser --disabled-password --gecos "Fluxe Deploy" "${FLUXE_USER}"
  usermod -aG docker "${FLUXE_USER}"
  usermod -aG sudo "${FLUXE_USER}"

  # Copy SSH authorized_keys from root
  mkdir -p /home/${FLUXE_USER}/.ssh
  if [ -f /root/.ssh/authorized_keys ]; then
    cp /root/.ssh/authorized_keys /home/${FLUXE_USER}/.ssh/
    chown -R ${FLUXE_USER}:${FLUXE_USER} /home/${FLUXE_USER}/.ssh
    chmod 700 /home/${FLUXE_USER}/.ssh
    chmod 600 /home/${FLUXE_USER}/.ssh/authorized_keys
  fi
  echo "  Usuário '${FLUXE_USER}' criado e adicionado ao grupo docker."
fi

# ─── 6. Docker log rotation ─────────────────────────────────────────────────
echo "[6/8] Configurando rotação de logs Docker..."
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'DAEMON'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
DAEMON
systemctl restart docker
echo "  Logs limitados a 10MB x 3 arquivos por container."

# ─── 7. Project directory structure ─────────────────────────────────────────
echo "[7/8] Criando estrutura de diretórios..."
mkdir -p ${PROJECT_DIR}/{backups/{daily,monthly},logs,ssl,envs}
chown -R ${FLUXE_USER}:${FLUXE_USER} ${PROJECT_DIR}
cat > ${PROJECT_DIR}/.env.example << 'ENVEX'
# --- Fluxe B2B Suite — Production Environment ---
# Copy to .env and fill in real values.

# Domain
DOMAIN=fluxe.com.br
GHCR_ORG=your-github-org

# Database
DB_USER=fluxe
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD
REDIS_PASSWORD=CHANGE_ME_REDIS

# RabbitMQ
RABBITMQ_USER=fluxe
RABBITMQ_PASSWORD=CHANGE_ME_RABBIT

# Auth
JWT_SECRET=CHANGE_ME_MIN_32_CHARS
JWT_ISSUER=spring-saas-core
OIDC_ISSUER_URI=https://auth.fluxe.com.br/realms/fluxe
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=CHANGE_ME_KC
KEYCLOAK_HOSTNAME=auth.fluxe.com.br

# CORS
CORS_ALLOWED_ORIGINS=https://shop.fluxe.com.br,https://ops.fluxe.com.br,https://admin.fluxe.com.br

# Image tags
SAAS_CORE_TAG=latest
ORDERS_TAG=latest
PAYMENTS_TAG=latest

# Observability
GRAFANA_USER=admin
GRAFANA_PASSWORD=CHANGE_ME_GRAFANA
SENTRY_DSN_CORE=
SENTRY_DSN_ORDERS=
SENTRY_DSN_PAYMENTS=

# Payments
GATEWAY_PROVIDER=fake
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=

# Backup (optional — Backblaze B2 / S3)
B2_KEY_ID=
B2_APP_KEY=
B2_BUCKET=
ENVEX
echo "  Diretórios criados em ${PROJECT_DIR}"

# ─── 8. Certbot (for API/Keycloak SSL if not using Cloudflare proxy) ───────
echo "[8/8] Instalando Certbot..."
if ! command -v certbot &>/dev/null; then
  apt-get install -y -qq certbot
  echo "  Certbot instalado."
  echo "  Para gerar certificados: certbot certonly --standalone -d api.fluxe.com.br"
else
  echo "  Certbot já instalado."
fi

# ─── Done ────────────────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo " Setup concluído!"
echo "============================================"
echo ""
echo "Próximos passos:"
echo ""
echo "  1. Fazer login como '${FLUXE_USER}':"
echo "     ssh ${FLUXE_USER}@$(hostname -I | awk '{print $1}')"
echo ""
echo "  2. Clonar o repositório em ${PROJECT_DIR}:"
echo "     cd ${PROJECT_DIR}"
echo "     git clone https://github.com/<org>/fluxe-b2b-suite.git ."
echo ""
echo "  3. Configurar o .env:"
echo "     cp .env.example .env"
echo "     nano .env   # preencher senhas reais"
echo ""
echo "  4. Subir tudo:"
echo "     docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "  5. (Opcional) Configurar DNS no Cloudflare apontando para $(hostname -I | awk '{print $1}')"
echo "     api.fluxe.com.br   A  $(hostname -I | awk '{print $1}')  (proxied)"
echo "     auth.fluxe.com.br  A  $(hostname -I | awk '{print $1}')  (proxied)"
echo ""
echo "  6. (Opcional) Configurar backup cron:"
echo "     crontab -e"
echo "     0 3 * * * ${PROJECT_DIR}/scripts/backup.sh >> ${PROJECT_DIR}/logs/backup.log 2>&1"
echo ""
echo "  7. (Opcional) Configurar health check cron:"
echo "     */5 * * * * ${PROJECT_DIR}/scripts/health-monitor.sh >> ${PROJECT_DIR}/logs/health.log 2>&1"
echo ""
