#!/usr/bin/env bash
# Initial server setup for Fluxe B2B Suite on Oracle Cloud Free Tier (Ampere A1).
# Also supports Hetzner/generic Ubuntu VPS.
# Run ONCE as root on a fresh server:
#   scp server-setup.sh root@<ip>:/tmp/ && ssh root@<ip> bash /tmp/server-setup.sh
set -euo pipefail

FLUXE_USER="fluxe"
PROJECT_DIR="/opt/fluxe"
SWAP_SIZE_GB=4

echo "============================================"
echo " Fluxe B2B Suite — Server Initial Setup"
echo "============================================"
echo ""

if [ "$(id -u)" -ne 0 ]; then
  echo "ERRO: execute como root."
  exit 1
fi

# ─── Detect OS and architecture ──────────────────────────────────────────────
ARCH=$(uname -m)
echo "Arquitetura detectada: ${ARCH}"

if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS_ID="${ID}"
  OS_VERSION="${VERSION_ID}"
  echo "Sistema operacional: ${PRETTY_NAME}"
else
  echo "ERRO: não foi possível detectar o SO."
  exit 1
fi

IS_ORACLE_LINUX=false
IS_UBUNTU=false
IS_ARM=false

case "${OS_ID}" in
  ubuntu)   IS_UBUNTU=true ;;
  ol|oraclelinux) IS_ORACLE_LINUX=true ;;
  *)
    echo "AVISO: SO '${OS_ID}' não testado. Tentando continuar como Ubuntu-like..."
    IS_UBUNTU=true
    ;;
esac

case "${ARCH}" in
  aarch64|arm64) IS_ARM=true; echo "  → ARM64 detectado (Oracle Ampere A1 / similar)" ;;
  x86_64)        echo "  → x86_64 detectado" ;;
  *)             echo "AVISO: arquitetura '${ARCH}' não testada." ;;
esac

TOTAL_STEPS=9

# ─── 1. System update ───────────────────────────────────────────────────────
echo ""
echo "[1/${TOTAL_STEPS}] Atualizando sistema..."

if $IS_UBUNTU; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get upgrade -y -qq
  apt-get install -y -qq \
    curl wget git unzip htop ncdu jq \
    ca-certificates gnupg lsb-release \
    software-properties-common apt-transport-https \
    iptables-persistent
elif $IS_ORACLE_LINUX; then
  dnf update -y -q
  dnf install -y -q \
    curl wget git unzip htop jq \
    ca-certificates gnupg2 \
    iptables-services
fi

# ─── 2. Docker + Docker Compose ─────────────────────────────────────────────
echo ""
echo "[2/${TOTAL_STEPS}] Instalando Docker..."

if ! command -v docker &>/dev/null; then
  if $IS_UBUNTU; then
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

  elif $IS_ORACLE_LINUX; then
    dnf install -y -q dnf-utils
    dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    dnf install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  fi

  systemctl enable docker
  systemctl start docker
  echo "  Docker $(docker --version) instalado."
else
  echo "  Docker já instalado: $(docker --version)"
fi

if $IS_ARM; then
  echo "  ℹ  ARM64: todas as imagens Docker devem suportar linux/arm64."
fi

# ─── 3. fail2ban ─────────────────────────────────────────────────────────────
echo ""
echo "[3/${TOTAL_STEPS}] Instalando fail2ban..."

if $IS_UBUNTU; then
  apt-get install -y -qq fail2ban
  F2B_LOGPATH="/var/log/auth.log"
elif $IS_ORACLE_LINUX; then
  dnf install -y -q epel-release || true
  dnf install -y -q fail2ban
  F2B_LOGPATH="/var/log/secure"
fi

cat > /etc/fail2ban/jail.local << EOF
[sshd]
enabled  = true
port     = ssh
filter   = sshd
logpath  = ${F2B_LOGPATH}
maxretry = 5
bantime  = 3600
findtime = 600
EOF
systemctl enable fail2ban
systemctl restart fail2ban
echo "  fail2ban ativo (ban 1h após 5 tentativas)."

# ─── 4. Firewall (iptables — compatible with Oracle Cloud VCN) ──────────────
echo ""
echo "[4/${TOTAL_STEPS}] Configurando firewall (iptables)..."
echo ""
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║  ORACLE CLOUD: O firewall principal é o VCN Security List. ║"
echo "  ║  Abra as portas 22, 80, 443 na Security List da sua VCN!  ║"
echo "  ║  As regras abaixo são apenas proteção adicional no SO.     ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo ""

iptables -F INPUT 2>/dev/null || true
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -p icmp -j ACCEPT
iptables -P INPUT DROP

if $IS_UBUNTU; then
  netfilter-persistent save 2>/dev/null || iptables-save > /etc/iptables/rules.v4
elif $IS_ORACLE_LINUX; then
  iptables-save > /etc/sysconfig/iptables
  systemctl enable iptables
  systemctl restart iptables
fi

echo "  iptables configurado: SSH(22), HTTP(80), HTTPS(443)."

# ─── 5. Create non-root user ────────────────────────────────────────────────
echo ""
echo "[5/${TOTAL_STEPS}] Criando usuário '${FLUXE_USER}'..."

if id "${FLUXE_USER}" &>/dev/null; then
  echo "  Usuário '${FLUXE_USER}' já existe."
else
  if $IS_UBUNTU; then
    adduser --disabled-password --gecos "Fluxe Deploy" "${FLUXE_USER}"
  elif $IS_ORACLE_LINUX; then
    useradd -m -c "Fluxe Deploy" "${FLUXE_USER}"
  fi

  usermod -aG docker "${FLUXE_USER}"

  ORIGINAL_USER=""
  if [ -d /home/ubuntu/.ssh ]; then
    ORIGINAL_USER="ubuntu"
  elif [ -d /home/opc/.ssh ]; then
    ORIGINAL_USER="opc"
  fi

  mkdir -p /home/${FLUXE_USER}/.ssh
  if [ -n "${ORIGINAL_USER}" ] && [ -f /home/${ORIGINAL_USER}/.ssh/authorized_keys ]; then
    cp /home/${ORIGINAL_USER}/.ssh/authorized_keys /home/${FLUXE_USER}/.ssh/
  elif [ -f /root/.ssh/authorized_keys ]; then
    cp /root/.ssh/authorized_keys /home/${FLUXE_USER}/.ssh/
  fi

  chown -R ${FLUXE_USER}:${FLUXE_USER} /home/${FLUXE_USER}/.ssh
  chmod 700 /home/${FLUXE_USER}/.ssh
  chmod 600 /home/${FLUXE_USER}/.ssh/authorized_keys 2>/dev/null || true

  echo "  Usuário '${FLUXE_USER}' criado e adicionado ao grupo docker."
fi

# ─── 6. Docker log rotation ─────────────────────────────────────────────────
echo ""
echo "[6/${TOTAL_STEPS}] Configurando rotação de logs Docker..."

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
echo ""
echo "[7/${TOTAL_STEPS}] Criando estrutura de diretórios..."

mkdir -p ${PROJECT_DIR}/{backups/{daily,monthly},logs,ssl,envs}
chown -R ${FLUXE_USER}:${FLUXE_USER} ${PROJECT_DIR}
echo "  Diretórios criados em ${PROJECT_DIR}"

# ─── 8. Configure swap ──────────────────────────────────────────────────────
echo ""
echo "[8/${TOTAL_STEPS}] Configurando swap (${SWAP_SIZE_GB}GB)..."

if [ -f /swapfile ]; then
  echo "  Swap já existe:"
  swapon --show
else
  fallocate -l ${SWAP_SIZE_GB}G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile

  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi

  sysctl vm.swappiness=10
  sysctl vm.vfs_cache_pressure=50
  cat >> /etc/sysctl.conf << 'SYSCTL'
vm.swappiness=10
vm.vfs_cache_pressure=50
SYSCTL

  echo "  Swap de ${SWAP_SIZE_GB}GB configurado."
fi

# ─── 9. Certbot ─────────────────────────────────────────────────────────────
echo ""
echo "[9/${TOTAL_STEPS}] Instalando Certbot..."

if ! command -v certbot &>/dev/null; then
  if $IS_UBUNTU; then
    apt-get install -y -qq certbot
  elif $IS_ORACLE_LINUX; then
    dnf install -y -q certbot
  fi
  echo "  Certbot instalado."
else
  echo "  Certbot já instalado."
fi

# ─── Done ────────────────────────────────────────────────────────────────────
IP_ADDR=$(hostname -I | awk '{print $1}')

echo ""
echo "============================================"
echo " Setup concluído!"
echo "============================================"
echo ""
echo "Arquitetura: ${ARCH}"
echo "SO: ${PRETTY_NAME:-unknown}"
echo "Swap: ${SWAP_SIZE_GB}GB"
echo ""

if $IS_ARM; then
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║  ARM64 DETECTADO — Imagens Docker devem ser linux/arm64    ║"
  echo "║  As imagens do GHCR já são multi-arch (amd64 + arm64).     ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
fi

echo "┌──────────────────────────────────────────────────────────────┐"
echo "│  ORACLE CLOUD — Configurar VCN Security List:               │"
echo "│                                                              │"
echo "│  1. Acesse: cloud.oracle.com → Networking → VCN             │"
echo "│  2. Selecione sua VCN → Security Lists                      │"
echo "│  3. Adicione Ingress Rules:                                  │"
echo "│     • Source: 0.0.0.0/0  Port: 22   (SSH)                   │"
echo "│     • Source: 0.0.0.0/0  Port: 80   (HTTP)                  │"
echo "│     • Source: 0.0.0.0/0  Port: 443  (HTTPS)                 │"
echo "│                                                              │"
echo "│  Sem essas regras, o tráfego externo NÃO chega à VM!        │"
echo "└──────────────────────────────────────────────────────────────┘"
echo ""
echo "Próximos passos:"
echo ""
echo "  1. Fazer login como '${FLUXE_USER}':"
echo "     ssh ${FLUXE_USER}@${IP_ADDR}"
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
echo "     ./scripts/deploy.sh"
echo ""
echo "  5. Configurar DNS no Cloudflare apontando para ${IP_ADDR}:"
echo "     api.fluxe.com.br   A  ${IP_ADDR}  (proxied)"
echo "     auth.fluxe.com.br  A  ${IP_ADDR}  (proxied)"
echo ""
echo "  6. (Opcional) Configurar backup cron:"
echo "     crontab -e"
echo "     0 3 * * * ${PROJECT_DIR}/scripts/backup.sh >> ${PROJECT_DIR}/logs/backup.log 2>&1"
echo ""
