# Oracle Cloud — Terraform (Fluxe B2B Suite)

Configuração mínima de Terraform para provisionar uma instância Ampere A1 (Always Free) na Oracle Cloud com toda a infraestrutura de rede necessária.

## O que é criado

- **VCN** com subnet pública
- **Internet Gateway** + Route Table
- **Security List** com portas 22 (SSH), 80 (HTTP), 443 (HTTPS)
- **Instância Ampere A1** — 4 OCPU, 24GB RAM, 200GB boot volume, Ubuntu 22.04 ARM64

## Pré-requisitos

1. [Terraform](https://developer.hashicorp.com/terraform/downloads) >= 1.5
2. Conta Oracle Cloud com Free Tier ativo
3. API Key configurada no OCI Console

### Gerar API Key

1. Acesse **OCI Console → Identity → Users → seu usuário → API Keys**
2. Clique em **Add API Key** → **Generate API Key Pair**
3. Baixe a chave privada e salve em `~/.oci/oci_api_key.pem`
4. Copie o **fingerprint** e o **Configuration File Preview**

### Dados necessários

| Variável           | Onde encontrar                                              |
|--------------------|-------------------------------------------------------------|
| `tenancy_ocid`     | OCI Console → Profile → Tenancy                            |
| `user_ocid`        | OCI Console → Profile → User Settings                      |
| `compartment_ocid` | OCI Console → Identity → Compartments (use root ou crie um)|
| `fingerprint`      | Gerado ao criar a API Key                                  |
| `region`           | Ex: `sa-saopaulo-1`, `us-ashburn-1`                        |

## Uso

```bash
cd deploy/oracle-cloud

# Criar arquivo de variáveis
cat > terraform.tfvars << 'EOF'
tenancy_ocid     = "ocid1.tenancy.oc1..aaa..."
user_ocid        = "ocid1.user.oc1..aaa..."
compartment_ocid = "ocid1.compartment.oc1..aaa..."
fingerprint      = "aa:bb:cc:dd:..."
private_key_path = "~/.oci/oci_api_key.pem"
region           = "sa-saopaulo-1"
ssh_public_key_path = "~/.ssh/id_rsa.pub"
EOF

# Inicializar e aplicar
terraform init
terraform plan
terraform apply
```

## Outputs

Após `terraform apply`:

```
instance_public_ip = "129.xxx.xxx.xxx"
ssh_command        = "ssh ubuntu@129.xxx.xxx.xxx"
```

## Próximos passos

Após a instância estar rodando:

```bash
# 1. Copiar o script de setup
scp ../../deploy/server-setup.sh ubuntu@<ip>:/tmp/

# 2. Conectar e rodar o setup
ssh ubuntu@<ip>
sudo bash /tmp/server-setup.sh

# 3. Login como fluxe e configurar
ssh fluxe@<ip>
cd /opt/fluxe
git clone https://github.com/<org>/fluxe-b2b-suite.git .
cp .env.example .env
nano .env

# 4. Deploy
./scripts/deploy.sh
```

## Destruir

Para remover toda a infraestrutura:

```bash
terraform destroy
```

## Notas

- O shape `VM.Standard.A1.Flex` é **Always Free** (até 4 OCPUs + 24GB no total por tenancy).
- Se `terraform apply` falhar com "Out of capacity", tente novamente em alguns minutos — a Oracle Cloud Free Tier tem capacidade limitada por região.
- O arquivo `terraform.tfvars` contém credenciais sensíveis — **não commitar no git**. Já está no `.gitignore`.
