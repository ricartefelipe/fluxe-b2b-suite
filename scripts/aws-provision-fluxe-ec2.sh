#!/usr/bin/env bash
# Provisiona EC2 dedicada para Fluxe B2B (Docker Compose prod).
# Requer: AWS CLI configurado, região sa-east-1 (ou AWS_REGION).
#
# Uso:
#   ./scripts/aws-provision-fluxe-ec2.sh
#   INSTANCE_TYPE=t3.large ./scripts/aws-provision-fluxe-ec2.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

AWS_REGION="${AWS_REGION:-sa-east-1}"
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.large}"
KEY_NAME="${KEY_NAME:-fluxe-b2b-deploy}"
SG_NAME="${SG_NAME:-fluxe-b2b-prod-sg}"
INSTANCE_NAME="${INSTANCE_NAME:-fluxe-b2b-prod}"
KEY_FILE="${KEY_FILE:-$HOME/.ssh/${KEY_NAME}.pem}"

MY_IP="$(curl -sf --max-time 5 https://checkip.amazonaws.com 2>/dev/null | tr -d '\n' || true)"
if [[ -z "$MY_IP" ]]; then
  echo "Não foi possível detectar IP público para regra SSH." >&2
  exit 1
fi

echo "▸ Região: $AWS_REGION | Tipo: $INSTANCE_TYPE | SSH de: $MY_IP/32"

VPC_ID="$(aws ec2 describe-vpcs --region "$AWS_REGION" \
  --filters Name=isDefault,Values=true \
  --query 'Vpcs[0].VpcId' --output text)"

if [[ -z "$VPC_ID" || "$VPC_ID" == "None" ]]; then
  echo "VPC default não encontrada em $AWS_REGION" >&2
  exit 1
fi

# --- Key pair ---
if ! aws ec2 describe-key-pairs --region "$AWS_REGION" --key-names "$KEY_NAME" &>/dev/null; then
  echo "▸ Criando key pair $KEY_NAME → $KEY_FILE"
  aws ec2 create-key-pair --region "$AWS_REGION" --key-name "$KEY_NAME" \
    --query 'KeyMaterial' --output text > "$KEY_FILE"
  chmod 600 "$KEY_FILE"
else
  echo "▸ Key pair $KEY_NAME já existe (usando $KEY_FILE se existir)"
fi

# --- Security group ---
SG_ID="$(aws ec2 describe-security-groups --region "$AWS_REGION" \
  --filters "Name=group-name,Values=$SG_NAME" "Name=vpc-id,Values=$VPC_ID" \
  --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || true)"

if [[ -z "$SG_ID" || "$SG_ID" == "None" ]]; then
  echo "▸ Criando security group $SG_NAME"
  SG_ID="$(aws ec2 create-security-group --region "$AWS_REGION" \
    --group-name "$SG_NAME" \
    --description "Fluxe B2B prod - HTTP/HTTPS/SSH" \
    --vpc-id "$VPC_ID" \
    --query 'GroupId' --output text)"
  aws ec2 authorize-security-group-ingress --region "$AWS_REGION" --group-id "$SG_ID" \
    --ip-permissions \
    "IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges=[{CidrIp=${MY_IP}/32,Description=SSH}]" \
    "IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges=[{CidrIp=0.0.0.0/0,Description=HTTP}]" \
    "IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges=[{CidrIp=0.0.0.0/0,Description=HTTPS}]"
else
  echo "▸ Security group existente: $SG_ID"
fi

# --- AMI Amazon Linux 2023 x86_64 ---
AMI_ID="$(aws ec2 describe-images --region "$AWS_REGION" \
  --owners amazon \
  --filters "Name=name,Values=al2023-ami-2023*" "Name=architecture,Values=x86_64" "Name=state,Values=available" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' --output text)"

echo "▸ AMI: $AMI_ID"

USER_DATA="#!/bin/bash
set -euxo pipefail
dnf update -y
dnf install -y docker git
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user
curl -SL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
mkdir -p /opt/fluxe
chown ec2-user:ec2-user /opt/fluxe
echo 'Docker ready' > /opt/fluxe/bootstrap.ok
"

USER_DATA_B64="$(printf '%s' "$USER_DATA" | base64 -w0)"

echo "▸ Lançando instância..."
INSTANCE_ID="$(aws ec2 run-instances --region "$AWS_REGION" \
  --image-id "$AMI_ID" \
  --instance-type "$INSTANCE_TYPE" \
  --key-name "$KEY_NAME" \
  --security-group-ids "$SG_ID" \
  --user-data "$USER_DATA" \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":80,"VolumeType":"gp3","DeleteOnTermination":true}}]' \
  --query 'Instances[0].InstanceId' --output text)"

echo "▸ Aguardando instância $INSTANCE_ID..."
aws ec2 wait instance-running --region "$AWS_REGION" --instance-ids "$INSTANCE_ID"

PUBLIC_IP="$(aws ec2 describe-instances --region "$AWS_REGION" \
  --instance-ids "$INSTANCE_ID" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)"

echo ""
echo "✔ EC2 pronta"
echo "  InstanceId: $INSTANCE_ID"
echo "  IP público: $PUBLIC_IP"
echo "  SSH: ssh -i $KEY_FILE ec2-user@$PUBLIC_IP"
echo ""
echo "Próximo passo:"
echo "  FLUXE_HOST=$PUBLIC_IP FLUXE_KEY=$KEY_FILE ./scripts/aws-deploy-fluxe-ec2.sh"

# Guardar metadata local (não commitar)
mkdir -p "$SUITE_ROOT/.aws-deploy"
cat > "$SUITE_ROOT/.aws-deploy/last-ec2.env" <<EOF
AWS_REGION=$AWS_REGION
INSTANCE_ID=$INSTANCE_ID
PUBLIC_IP=$PUBLIC_IP
KEY_FILE=$KEY_FILE
EOF
