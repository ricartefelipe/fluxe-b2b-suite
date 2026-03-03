# GUIA COMPLETO: Do Zero ao Deploy em Produção

> **Fluxe B2B Suite** — Oracle Cloud Free Tier + Cloudflare
>
> Tempo total estimado: ~2 horas (com calma)
>
> Última atualização: Março 2026

---

## Índice

1. [Pré-requisitos](#parte-0-pré-requisitos)
2. [Criar Conta na Oracle Cloud](#parte-1-criar-conta-na-oracle-cloud-15-min)
3. [Criar o Servidor](#parte-2-criar-o-servidor-na-oracle-cloud-20-min)
4. [Configurar o Servidor](#parte-3-configurar-o-servidor-15-min)
5. [Configurar o Projeto](#parte-4-configurar-o-projeto-no-servidor-15-min)
6. [Subir Tudo](#parte-5-subir-tudo-10-min)
7. [Configurar o Cloudflare](#parte-6-configurar-o-cloudflare-20-min)
8. [Configurar o Keycloak](#parte-7-configurar-o-keycloak-15-min)
9. [Migrations e Seed](#parte-8-rodar-as-migrations-dos-bancos-5-min)
10. [Testar Tudo](#parte-9-testar-tudo-10-min)
11. [Manutenção Diária](#parte-10-manutenção-diária)
12. [Backups Automáticos](#parte-11-backups-automáticos)
13. [Monitoramento](#parte-12-monitoramento-grafana--prometheus)
14. [Troubleshooting](#parte-13-troubleshooting)
15. [Custos](#custos-finais)

---

## Parte 0: Pré-requisitos

Antes de começar, você vai precisar de:

| O que | Por quê | Onde conseguir |
|-------|---------|----------------|
| Um computador com terminal | Para rodar os comandos | Linux e Mac já têm. Windows: instale o [WSL](https://learn.microsoft.com/pt-br/windows/wsl/install) |
| Um email válido | Para criar as contas | Qualquer email que você acesse |
| Um cartão de crédito ou débito | Oracle pede para verificar identidade — **NÃO cobra nada** | Qualquer cartão, pode ser virtual |
| Um domínio (opcional) | Para ter URLs bonitas tipo `api.seudominio.com.br` | [Registro.br](https://registro.br) (~R$40/ano para `.com.br`) |

### O que é um terminal?

Terminal (ou "linha de comando") é um programa onde você digita comandos de texto para controlar o computador. É como conversar com o computador escrevendo em vez de clicando.

**Como abrir o terminal:**

- **Linux (Ubuntu):** pressione `Ctrl + Alt + T`
- **Mac:** abra o aplicativo "Terminal" (está em Aplicativos → Utilitários)
- **Windows:** instale o WSL primeiro:
  1. Abra o PowerShell como Administrador (clique direito no menu Iniciar → "Terminal (Admin)")
  2. Digite: `wsl --install`
  3. Reinicie o computador
  4. Abra o app "Ubuntu" que apareceu no menu Iniciar

Quando o terminal abrir, você vai ver algo assim:

```
usuario@computador:~$
```

O símbolo `$` significa que o terminal está pronto para receber comandos. Você digita o comando e pressiona `Enter` para executar.

### O que é SSH?

SSH é uma forma segura de se conectar a outro computador pela internet. Você vai usar SSH para acessar o servidor na Oracle Cloud como se estivesse sentado na frente dele.

### Verificar se você tem uma chave SSH

No terminal, digite:

```bash
ls ~/.ssh/id_rsa.pub
```

- Se aparecer o caminho do arquivo: **você já tem uma chave SSH**. Ótimo!
- Se aparecer `No such file or directory`: **você precisa criar uma**. Faça isso:

```bash
ssh-keygen -t rsa -b 4096
```

O terminal vai perguntar:

```
Enter file in which to save the key (/home/SEU_USUARIO/.ssh/id_rsa):
```

Apenas pressione `Enter` (aceita o local padrão).

```
Enter passphrase (empty for no passphrase):
```

Pressione `Enter` novamente (sem senha, para simplificar).

```
Enter same passphrase again:
```

Pressione `Enter` mais uma vez.

Pronto! Sua chave SSH foi criada. Ela está em dois arquivos:

- `~/.ssh/id_rsa` — chave **privada** (NUNCA compartilhe esta!)
- `~/.ssh/id_rsa.pub` — chave **pública** (esta você vai enviar para a Oracle)

---

## Parte 1: Criar Conta na Oracle Cloud (15 min)

A Oracle oferece um tier "Always Free" com recursos generosos que **nunca expiram** e **nunca cobram**. Vamos usar isso.

### Passo 1.1 — Acessar o site

1. Abra o navegador (Chrome, Firefox, etc.)
2. Acesse: **https://cloud.oracle.com**
3. Clique no botão **"Sign Up for Free"** (é um botão grande, geralmente azul, no meio da página)

### Passo 1.2 — Preencher o formulário de cadastro

Você verá um formulário. Preencha assim:

1. **Country/Territory:** selecione **Brazil**
2. **First Name:** seu primeiro nome
3. **Last Name:** seu sobrenome
4. **Email:** seu email (você vai receber um código de verificação)
5. Clique **"Verify my email"**
6. Vá até seu email, copie o código de 6 dígitos que chegou, e cole no campo
7. Clique **"Verify"**

### Passo 1.3 — Definir a senha

1. **Password:** crie uma senha forte (mínimo 12 caracteres, com maiúsculas, minúsculas, números e símbolos)
2. **Confirm Password:** repita a mesma senha
3. **Cloud Account Name:** escolha um nome para seu "inquilino" (tenant). Exemplo: `fluxe-prod`
   - ⚠️ **Anote este nome!** Você vai precisar dele para fazer login depois.
   - Use só letras minúsculas, números e hifens

### Passo 1.4 — Escolher a região

Esta é uma das escolhas mais importantes:

1. **Home Region:** selecione **Brazil East (São Paulo)**
   - Por que São Paulo? Porque é a região mais próxima dos seus usuários brasileiros, o que significa menor latência (o site carrega mais rápido)
   - ⚠️ **ATENÇÃO:** Depois de escolher a região, **não é possível mudar**. Escolha com cuidado.

### Passo 1.5 — Preencher o endereço

1. Preencha seu endereço completo (rua, número, cidade, estado, CEP)
2. O endereço precisa ser válido (Oracle pode verificar)

### Passo 1.6 — Verificação do cartão

1. **Payment Method:** selecione "Credit Card" ou "Debit Card"
2. Preencha os dados do cartão
3. ⚠️ **Oracle NÃO vai cobrar nada.** Ela faz uma pré-autorização de US$1 que é cancelada automaticamente. É apenas para provar que você é uma pessoa real.
4. Se usar cartão virtual (como Nubank, Inter), funciona normalmente

### Passo 1.7 — Concordar com os termos

1. Marque a caixa "I have read and agree..."
2. Clique **"Start my free trial"**

### Passo 1.8 — Aguardar a ativação

- Na maioria dos casos, a conta é ativada **em segundos**
- Em alguns casos, pode levar até **24 horas** (raro)
- Você receberá um email com o assunto "Get Started Now with Oracle Cloud"
- Quando receber, clique no link e faça login com o email e senha que criou

### Passo 1.9 — Primeiro login

1. Acesse: **https://cloud.oracle.com**
2. Em **"Cloud Account Name"**, digite o nome que você escolheu (ex: `fluxe-prod`)
3. Clique **"Next"**
4. Na próxima tela, clique **"Continue"** (no quadro "Oracle Cloud Infrastructure Direct Sign-In")
5. Digite seu email e senha
6. Clique **"Sign In"**

Você está agora no **Oracle Cloud Console** — é um painel de controle onde você gerencia tudo.

> 📝 **Anote e guarde em local seguro:**
> - Cloud Account Name: _______________
> - Email: _______________
> - Senha: _______________
> - Região: Brazil East (São Paulo)

---

## Parte 2: Criar o Servidor na Oracle Cloud (20 min)

Agora vamos criar o servidor que vai rodar toda a Fluxe B2B Suite. Temos 4 etapas: criar a rede, abrir as portas, criar a máquina, e acessar via SSH.

### 2.1 — Criar a VCN (Rede Virtual)

**O que é VCN?** VCN (Virtual Cloud Network) é uma rede virtual privada. Pense nela como o "cabeamento de rede" do seu servidor na nuvem. Sem ela, o servidor não consegue se comunicar com a internet.

1. No canto superior esquerdo do Oracle Console, clique no ícone **☰** (três barrinhas horizontais — é o menu de navegação)
2. Uma barra lateral vai abrir. Procure e clique em **"Networking"**
3. No submenu que aparece, clique em **"Virtual Cloud Networks"**
4. Verifique se o **compartimento** (Compartment) está correto no lado esquerdo. Se você acabou de criar a conta, deve estar no compartimento "root" — está ok.
5. Clique no botão azul **"Start VCN Wizard"**
6. Na janela que aparece, selecione **"Create VCN with Internet Connectivity"**
7. Clique **"Start VCN Wizard"**
8. Preencha:
   - **VCN Name:** `fluxe-vcn`
   - Os demais campos podem ficar no padrão (os blocos CIDR 10.0.0.0/16 etc.)
9. Clique **"Next"**
10. Revise o resumo e clique **"Create"**
11. Aguarde cerca de 30 segundos. Vai aparecer "Virtual Cloud Network creation complete"
12. Clique **"View Virtual Cloud Network"** para ver a VCN que você criou

### 2.2 — Abrir Portas no Firewall (Security List)

**O que é Security List?** É o firewall da Oracle Cloud. Por padrão, só a porta 22 (SSH) está aberta. Precisamos abrir as portas 80 (HTTP) e 443 (HTTPS) para que as pessoas acessem o site.

1. Você deve estar na tela da VCN `fluxe-vcn`. Se não estiver, volte em: Menu ☰ → Networking → Virtual Cloud Networks → clique em `fluxe-vcn`
2. Na seção **"Subnets"** (mais embaixo na página), clique em **"Public Subnet-fluxe-vcn"**
3. Na tela da subnet, na seção **"Security Lists"**, clique no nome **"Default Security List for fluxe-vcn"**
4. Agora você vai ver as regras de firewall. Deve ter uma regra já existente para a porta 22 (SSH)

**Adicionar a Regra 1 — HTTP (porta 80):**

5. Clique no botão **"Add Ingress Rules"**
6. Preencha assim:
   - **Source Type:** CIDR (já vem selecionado)
   - **Source CIDR:** `0.0.0.0/0`
     - Isso significa "qualquer endereço IP do mundo pode acessar"
   - **IP Protocol:** TCP (já vem selecionado)
   - **Source Port Range:** deixe em branco (All)
   - **Destination Port Range:** `80`
   - **Description:** `HTTP`
7. Clique **"Add Ingress Rules"**

**Adicionar a Regra 2 — HTTPS (porta 443):**

8. Clique novamente em **"Add Ingress Rules"**
9. Preencha assim:
   - **Source Type:** CIDR
   - **Source CIDR:** `0.0.0.0/0`
   - **IP Protocol:** TCP
   - **Source Port Range:** deixe em branco
   - **Destination Port Range:** `443`
   - **Description:** `HTTPS`
10. Clique **"Add Ingress Rules"**

Agora você deve ter 3 regras de entrada (Ingress Rules):
- Porta 22 (SSH) — já existia
- Porta 80 (HTTP) — acabou de criar
- Porta 443 (HTTPS) — acabou de criar

### 2.3 — Criar a Instância (Servidor)

**O que é uma instância?** É um computador virtual na nuvem. A Oracle oferece uma máquina ARM com 4 CPUs e 24 GB de RAM **gratuitamente para sempre**. É mais do que muita gente paga R$200/mês para ter.

1. Clique no menu ☰ (canto superior esquerdo)
2. Clique em **"Compute"**
3. Clique em **"Instances"**
4. Clique no botão azul **"Create Instance"**

Agora vamos configurar cada seção:

**Nome:**

5. No campo **"Name"**, digite: `fluxe-server`

**Imagem e Shape (o "hardware" da máquina):**

6. Na seção **"Image and shape"**, clique em **"Edit"**
7. Clique em **"Change image"**
8. Na lista, procure e selecione **"Ubuntu"**
9. Na lista de versões, selecione **"Canonical Ubuntu 22.04"**
10. ⚠️ **IMPORTANTE:** certifique-se de selecionar a imagem que diz **aarch64** (ARM). O Free Tier ARM oferece muito mais recursos do que o x86
11. Clique **"Select image"**
12. Agora clique em **"Change shape"**
13. Na seção "Shape series", selecione **"Ampere"** (é o processador ARM da Oracle)
14. Selecione o shape **"VM.Standard.A1.Flex"**
15. Em **"Number of OCPUs"**, arraste o slider ou digite: **4** (é o máximo gratuito)
16. Em **"Amount of memory (GB)"**, arraste ou digite: **24** (é o máximo gratuito)
17. Clique **"Select shape"**

> ℹ️ Está aparecendo "Out of capacity"? Isso acontece quando a Oracle está sem servidores disponíveis na região. Tente novamente a cada poucas horas — geralmente libera de madrugada ou início da manhã.

**Rede:**

18. Na seção **"Networking"**, clique em **"Edit"**
19. Em **"Virtual cloud network"**, selecione **"fluxe-vcn"**
20. Em **"Subnet"**, selecione **"Public Subnet-fluxe-vcn"**
21. Em **"Public IPv4 address"**, certifique-se de que **"Assign a public IPv4 address"** está selecionado

**Chave SSH (para acessar o servidor):**

22. Na seção **"Add SSH keys"**, você tem duas opções:

**Opção A — Se você já tem uma chave SSH** (verificou no Passo 0):
- Selecione **"Upload public key files"**
- Clique **"Browse"** e navegue até o arquivo `~/.ssh/id_rsa.pub`
  - No Linux/Mac: geralmente fica em `/home/SEU_USUARIO/.ssh/id_rsa.pub`
  - No Windows (WSL): fica em `\\wsl$\Ubuntu\home\SEU_USUARIO\.ssh\id_rsa.pub`

**Opção B — Se você NÃO tem uma chave SSH:**
- Selecione **"Generate a key pair"**
- Clique **"Save private key"** — o navegador vai baixar um arquivo chamado `ssh-key-YYYY-MM-DD.key`
- ⚠️ **GUARDE ESTE ARQUIVO EM LOCAL SEGURO!** Sem ele, você não consegue acessar o servidor
- Clique também em **"Save public key"** (é bom ter os dois)

**Tamanho do disco (Boot Volume):**

23. Na seção **"Boot volume"**, clique em **"Specify a custom boot volume size"**
24. Digite: **200** GB (é o máximo gratuito)
25. O "VPU" pode ficar no padrão (10)

**Criar:**

26. Revise tudo e clique no botão azul **"Create"**
27. Aguarde o status mudar de "PROVISIONING" para **"RUNNING"** (leva 2-3 minutos)
28. Quando estiver "RUNNING", copie o **"Public IP Address"** que aparece na página

Exemplo: `129.151.42.137`

> 📝 **Anote o IP público:** _______________

### 2.4 — Primeiro Acesso SSH

Agora vamos conectar no servidor pela primeira vez!

Abra o terminal no seu computador e digite:

**Se você gerou a chave pela Oracle (Opção B acima):**

```bash
chmod 600 ~/Downloads/ssh-key-*.key
ssh -i ~/Downloads/ssh-key-*.key ubuntu@SEU_IP_AQUI
```

Substitua `SEU_IP_AQUI` pelo IP que você copiou. Exemplo:

```bash
ssh -i ~/Downloads/ssh-key-2026-03-03.key ubuntu@129.151.42.137
```

**Se você usou sua própria chave SSH (Opção A):**

```bash
ssh ubuntu@SEU_IP_AQUI
```

Exemplo:

```bash
ssh ubuntu@129.151.42.137
```

**O que vai acontecer:**

Na primeira vez, o terminal vai perguntar:

```
The authenticity of host '129.151.42.137' can't be established.
ED25519 key fingerprint is SHA256:xxxxxxxxxxxxx.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

Digite **`yes`** e pressione Enter.

Se tudo deu certo, você vai ver algo como:

```
Welcome to Ubuntu 22.04.x LTS (GNU/Linux 5.15.0-xxx-generic aarch64)

  System information as of ...

ubuntu@fluxe-server:~$
```

**Você está dentro do servidor!** Tudo o que digitar agora será executado lá, não no seu computador.

Para sair do servidor e voltar ao seu computador, digite:

```bash
exit
```

> 💡 **Dica:** A partir daqui, vou indicar quando o comando deve ser executado no **seu computador (local)** ou no **servidor (remoto)**. Preste atenção!

---

## Parte 3: Configurar o Servidor (15 min)

Agora vamos instalar tudo que o servidor precisa: Docker, firewall, swap, etc. Já temos um script pronto que faz tudo isso automaticamente.

### 3.1 — Copiar o script de setup para o servidor

**No seu computador (local)**, abra o terminal e rode:

```bash
cd /caminho/para/fluxe-b2b-suite
```

Substitua `/caminho/para/fluxe-b2b-suite` pelo caminho real onde está o projeto. Exemplo:

```bash
cd ~/projetos/fluxe-b2b-suite
```

Agora copie o script para o servidor:

```bash
scp deploy/server-setup.sh ubuntu@SEU_IP:/home/ubuntu/
```

**O que é `scp`?** É como um "copiar e colar" entre o seu computador e o servidor, via SSH.

Se você usou a chave gerada pela Oracle, inclua o `-i`:

```bash
scp -i ~/Downloads/ssh-key-*.key deploy/server-setup.sh ubuntu@SEU_IP:/home/ubuntu/
```

### 3.2 — Rodar o script no servidor

Agora conecte no servidor:

```bash
ssh ubuntu@SEU_IP
```

E rode o script:

```bash
chmod +x server-setup.sh
sudo ./server-setup.sh
```

**O que é `chmod +x`?** Dá permissão para o arquivo ser executado como programa.

**O que é `sudo`?** Executa o comando como administrador (root). É necessário porque o script instala programas e muda configurações do sistema.

O script vai mostrar o progresso na tela:

```
============================================
 Fluxe B2B Suite — Server Initial Setup
============================================

Arquitetura detectada: aarch64
Sistema operacional: Ubuntu 22.04.x LTS
  → ARM64 detectado (Oracle Ampere A1 / similar)

[1/9] Atualizando sistema...
[2/9] Instalando Docker...
[3/9] Instalando fail2ban...
[4/9] Configurando firewall (iptables)...
[5/9] Criando usuário 'fluxe'...
[6/9] Configurando rotação de logs Docker...
[7/9] Criando estrutura de diretórios...
[8/9] Configurando swap (4GB)...
[9/9] Instalando Certbot...

============================================
 Setup concluído!
============================================
```

**O que o script fez:**

| Etapa | O que fez | Por que |
|-------|-----------|---------|
| 1 | Atualizou o Ubuntu | Segurança — corrigir vulnerabilidades |
| 2 | Instalou Docker e Docker Compose | Para rodar os containers da aplicação |
| 3 | Instalou fail2ban | Bloqueia IPs que tentam invadir via SSH |
| 4 | Configurou iptables | Firewall local (camada extra além do Oracle) |
| 5 | Criou o usuário `fluxe` | Melhor segurança que usar `ubuntu` ou `root` |
| 6 | Configurou rotação de logs | Evita que logs encham o disco |
| 7 | Criou `/opt/fluxe/` | Diretório onde vai ficar toda a aplicação |
| 8 | Configurou 4GB de swap | Memória extra em disco, para não travar |
| 9 | Instalou Certbot | Para certificados SSL (opcional, usaremos Cloudflare) |

### 3.3 — Verificar se tudo foi instalado

Ainda no servidor, rode:

```bash
docker --version
```

Deve mostrar algo como: `Docker version 27.x.x, build xxxxxx`

```bash
docker compose version
```

Deve mostrar algo como: `Docker Compose version v2.x.x`

Se ambos funcionaram, está tudo certo!

### 3.4 — Trocar para o usuário fluxe

A partir de agora, vamos usar o usuário `fluxe` (que o script criou) em vez de `ubuntu`:

```bash
sudo su - fluxe
```

**O que é `su`?** Significa "switch user" (trocar de usuário). O `-` carrega o ambiente completo do novo usuário.

Verifique que você está no lugar certo:

```bash
whoami
```

Deve mostrar: `fluxe`

```bash
pwd
```

Deve mostrar: `/home/fluxe`

Agora vá para o diretório do projeto:

```bash
cd /opt/fluxe
ls
```

Deve mostrar as pastas criadas pelo script:

```
backups  envs  logs  ssl
```

---

## Parte 4: Configurar o Projeto no Servidor (15 min)

Agora vamos copiar os arquivos do projeto para o servidor e configurar as variáveis de ambiente.

### 4.1 — Copiar os arquivos de deploy

**No seu computador (local)**, abra um **novo terminal** (o outro está conectado no servidor) e rode:

```bash
cd /caminho/para/fluxe-b2b-suite
```

Agora copie todos os arquivos necessários. Se usa chave da Oracle, adicione `-i ~/Downloads/ssh-key-*.key` em cada comando.

```bash
# docker-compose de produção
scp docker-compose.prod.yml ubuntu@SEU_IP:/opt/fluxe/

# arquivo de variáveis (vamos preencher depois)
scp .env.example ubuntu@SEU_IP:/opt/fluxe/.env

# configurações do nginx
scp -r deploy/nginx ubuntu@SEU_IP:/opt/fluxe/deploy/

# configurações do prometheus
scp -r deploy/prometheus ubuntu@SEU_IP:/opt/fluxe/deploy/

# scripts utilitários (deploy, backup, health, etc.)
scp -r scripts/ ubuntu@SEU_IP:/opt/fluxe/

# script de inicialização dos bancos de dados
scp scripts/init-databases.sh ubuntu@SEU_IP:/opt/fluxe/scripts/
```

> ℹ️ O `scp -r` copia uma pasta inteira (o `-r` significa "recursivo").

Se der erro de permissão, pode ser que o diretório `/opt/fluxe` não pertença ao `ubuntu`. Nesse caso, conecte no servidor e rode:

```bash
ssh ubuntu@SEU_IP
sudo chown -R ubuntu:ubuntu /opt/fluxe
```

E tente o `scp` novamente. Depois, no servidor, restaure a propriedade para o `fluxe`:

```bash
sudo chown -R fluxe:fluxe /opt/fluxe
```

### 4.2 — Verificar que os arquivos chegaram

No servidor (se saiu, conecte de novo: `ssh ubuntu@SEU_IP` e depois `sudo su - fluxe`):

```bash
cd /opt/fluxe
ls -la
```

Você deve ver:

```
docker-compose.prod.yml
.env
deploy/
scripts/
backups/
logs/
ssl/
envs/
```

### 4.3 — Gerar senhas seguras

Antes de preencher o `.env`, vamos gerar senhas fortes. No servidor, rode este comando **várias vezes** (uma vez para cada senha que precisar):

```bash
openssl rand -base64 24
```

Cada vez que rodar, ele gera uma senha aleatória diferente, tipo: `xR3kT8jK5bH6nM1vC9pQ4wL7yF2`

**Gere pelo menos 6 senhas** (uma para cada serviço) e anote todas:

```
Senha 1 (Banco de Dados):  ___________________________
Senha 2 (Redis):           ___________________________
Senha 3 (RabbitMQ):        ___________________________
Senha 4 (Keycloak Admin):  ___________________________
Senha 5 (JWT Secret):      ___________________________
Senha 6 (Grafana):         ___________________________
```

### 4.4 — Editar o .env com suas credenciais

Agora vamos abrir o arquivo de configuração e preencher com suas senhas e dados reais:

```bash
nano /opt/fluxe/.env
```

**O que é `nano`?** É um editor de texto simples que roda no terminal. Vou explicar como usar:

- Use as **setas do teclado** (↑ ↓ ← →) para se mover pelo arquivo
- Digite normalmente para escrever
- **Ctrl+O** depois **Enter** para salvar
- **Ctrl+X** para sair
- **Ctrl+K** para cortar uma linha inteira
- **Ctrl+W** para buscar texto

O arquivo vai se parecer com isso. Substitua cada valor:

```env
# =============================================================================
# Fluxe B2B Suite — Production Environment Variables
# =============================================================================

# --- Domínio & Rede ---
# Se você TEM um domínio: coloque ele aqui (ex: fluxe.seudominio.com.br)
# Se NÃO tem domínio: coloque o IP do servidor (ex: 129.151.42.137)
DOMAIN=fluxe.seudominio.com.br

# --- GHCR (GitHub Container Registry) ---
# O nome do seu usuário ou organização no GitHub
# É de onde o Docker vai baixar as imagens dos serviços
GHCR_ORG=ricartefelipe

# --- Versões das Imagens ---
# "latest" = sempre pega a mais recente. Pode trocar por uma tag específica.
SAAS_CORE_TAG=latest
ORDERS_TAG=latest
PAYMENTS_TAG=latest

# --- PostgreSQL (banco de dados) ---
# O usuário principal do banco
DB_USER=fluxe
# COLE AQUI A SENHA 1 que você gerou:
DB_PASSWORD=SUA_SENHA_DO_BANCO_AQUI

# --- Redis (cache) ---
# COLE AQUI A SENHA 2:
REDIS_PASSWORD=SUA_SENHA_DO_REDIS_AQUI

# --- RabbitMQ (fila de mensagens) ---
RABBITMQ_USER=fluxe
# COLE AQUI A SENHA 3:
RABBITMQ_PASSWORD=SUA_SENHA_DO_RABBITMQ_AQUI

# --- Keycloak (autenticação) ---
# Se tem domínio: auth.seudominio.com.br
# Se não tem domínio: SEU_IP:8180
KEYCLOAK_HOSTNAME=auth.seudominio.com.br
KEYCLOAK_ADMIN=admin
# COLE AQUI A SENHA 4:
KEYCLOAK_ADMIN_PASSWORD=SUA_SENHA_DO_KEYCLOAK_AQUI

# --- OIDC / JWT (tokens de autenticação) ---
# URL do Keycloak com o realm
OIDC_ISSUER_URI=https://auth.seudominio.com.br/realms/fluxe-b2b
# COLE AQUI A SENHA 5 (precisa ter pelo menos 32 caracteres):
JWT_SECRET=SUA_CHAVE_JWT_SUPER_SECRETA_AQUI_MIN_32_CHARS
JWT_ISSUER=spring-saas-core

# --- CORS (domínios que podem acessar a API) ---
# Liste aqui TODOS os domínios dos seus frontends, separados por vírgula
# Se não tem domínio, troque por: http://SEU_IP
CORS_ALLOWED_ORIGINS=https://shop.seudominio.com.br,https://ops.seudominio.com.br,https://admin.seudominio.com.br

# --- Pagamentos (Stripe) ---
# Por enquanto deixe "fake" — muda para "stripe" quando for usar de verdade
GATEWAY_PROVIDER=fake
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=

# --- Grafana (painel de monitoramento) ---
GRAFANA_USER=admin
# COLE AQUI A SENHA 6:
GRAFANA_PASSWORD=SUA_SENHA_DO_GRAFANA_AQUI

# --- Sentry (monitoramento de erros — opcional) ---
# Se não tem conta no Sentry, deixe vazio
SENTRY_DSN_CORE=
SENTRY_DSN_ORDERS=
SENTRY_DSN_PAYMENTS=

# --- Deploy ---
DEPLOY_HOST=SEU_IP_AQUI
DEPLOY_SSH_USER=fluxe
DEPLOY_PATH=/opt/fluxe
```

**Explicação de cada variável:**

| Variável | O que é | Exemplo |
|----------|---------|---------|
| `DOMAIN` | O endereço que as pessoas vão digitar no navegador | `fluxe.meusite.com.br` |
| `GHCR_ORG` | Seu usuário/organização no GitHub (de onde vêm as imagens Docker) | `ricartefelipe` |
| `DB_PASSWORD` | Senha do banco de dados PostgreSQL | `xR3kT8jK5bH6nM1vC9` |
| `REDIS_PASSWORD` | Senha do Redis (cache em memória) | `yU7pL2mN8qW4eR6tA3` |
| `RABBITMQ_PASSWORD` | Senha do RabbitMQ (fila de mensagens entre serviços) | `bH6nM1vC9pQ4wL7yF2` |
| `KEYCLOAK_ADMIN_PASSWORD` | Senha do admin do Keycloak (sistema de login) | `sD5gJ3kL9mN2pQ4wX8` |
| `JWT_SECRET` | Chave secreta para gerar tokens de autenticação (min. 32 caracteres) | `minha-chave-jwt-2026-prod-segura-minimo` |
| `GRAFANA_PASSWORD` | Senha para acessar os dashboards de monitoramento | `fH4jK8lN2pR6tV0wY3` |

Depois de preencher tudo, salve e saia:
1. Pressione **Ctrl+O** (a letra O, não zero)
2. Pressione **Enter** (confirma o nome do arquivo)
3. Pressione **Ctrl+X** (sai do editor)

### 4.5 — Verificar que o .env está correto

Rode este comando para ver se todas as variáveis obrigatórias estão preenchidas:

```bash
source /opt/fluxe/.env && echo "DOMAIN=$DOMAIN | DB_PASSWORD=$( [ -n \"$DB_PASSWORD\" ] && echo OK || echo FALTANDO ) | REDIS=$( [ -n \"$REDIS_PASSWORD\" ] && echo OK || echo FALTANDO ) | RABBIT=$( [ -n \"$RABBITMQ_PASSWORD\" ] && echo OK || echo FALTANDO ) | KC=$( [ -n \"$KEYCLOAK_ADMIN_PASSWORD\" ] && echo OK || echo FALTANDO ) | JWT=$( [ -n \"$JWT_SECRET\" ] && echo OK || echo FALTANDO ) | GRAFANA=$( [ -n \"$GRAFANA_PASSWORD\" ] && echo OK || echo FALTANDO )"
```

Todas devem mostrar **OK**. Se alguma mostrar **FALTANDO**, edite o `.env` novamente.

### 4.6 — Proteger o arquivo .env

O `.env` contém senhas. Vamos restringir quem pode lê-lo:

```bash
chmod 600 /opt/fluxe/.env
```

Isso faz com que **apenas o dono do arquivo** (fluxe) possa ler e editar.

---

## Parte 5: Subir Tudo (10 min)

Agora é hora de ligar os serviços! Vamos subir em etapas para garantir que cada camada está saudável antes de subir a próxima.

### Opção A: Deploy Automatizado (recomendado)

O script `deploy.sh` faz tudo automaticamente: valida o `.env`, baixa as imagens, sobe a infraestrutura, roda migrations e verifica a saúde de cada serviço.

```bash
cd /opt/fluxe
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

O script vai mostrar o progresso:

```
[deploy] Validating environment...
[deploy] Environment OK.
[deploy] Pulling latest images from GHCR...
[deploy] Starting infrastructure services...
[deploy] Waiting for infrastructure health checks...
[deploy] Infrastructure ready.
[deploy] Running database migrations...
[deploy] Starting all services...
[deploy] Waiting for services to become healthy...
[deploy] =========================================
[deploy]   DEPLOY SUCCESSFUL
[deploy] =========================================
```

Se mostrar "DEPLOY SUCCESSFUL", pule para a [Parte 6](#parte-6-configurar-o-cloudflare-20-min).

Se deu erro, use a Opção B abaixo para subir manualmente e identificar o problema.

### Opção B: Deploy Manual (passo a passo)

Se preferir subir serviço por serviço (ou se o deploy automático falhou), siga estes passos:

#### 5.1 — Login no GitHub Container Registry

Para baixar as imagens Docker do GitHub, faça login:

```bash
echo "SEU_TOKEN_GITHUB" | docker login ghcr.io -u SEU_USUARIO --password-stdin
```

> 💡 **Como criar um token GitHub:**
> 1. Acesse: https://github.com/settings/tokens
> 2. Clique **"Generate new token (classic)"**
> 3. Em "Note", escreva: `fluxe-server`
> 4. Em "Expiration": escolha 90 dias (ou mais)
> 5. Marque o scope: **`read:packages`**
> 6. Clique **"Generate token"**
> 7. Copie o token (começa com `ghp_...`)

#### 5.2 — Subir a infraestrutura (banco, cache, fila)

```bash
cd /opt/fluxe
docker compose -f docker-compose.prod.yml up -d postgres redis rabbitmq
```

**O que este comando faz:**
- `docker compose` — ferramenta para gerenciar vários containers
- `-f docker-compose.prod.yml` — usa o arquivo de configuração de produção
- `up` — cria e inicia os containers
- `-d` — roda em "background" (você não fica preso na tela de logs)
- `postgres redis rabbitmq` — apenas esses 3 serviços por enquanto

Aguarde **30 segundos** e verifique se estão saudáveis:

```bash
docker compose -f docker-compose.prod.yml ps
```

Você deve ver algo como:

```
NAME        STATUS                  PORTS
postgres    Up 30 seconds (healthy) 127.0.0.1:5432->5432/tcp
redis       Up 30 seconds (healthy) 127.0.0.1:6379->6379/tcp
rabbitmq    Up 28 seconds (healthy) 127.0.0.1:5672->5672/tcp, 127.0.0.1:15672->15672/tcp
```

⚠️ O importante é que o STATUS mostre **(healthy)**. Se mostrar **(health: starting)**, aguarde mais 30 segundos e rode `docker compose -f docker-compose.prod.yml ps` de novo.

#### 5.3 — Subir o Keycloak (autenticação)

```bash
docker compose -f docker-compose.prod.yml up -d keycloak
```

O Keycloak demora mais para iniciar (1-2 minutos). Acompanhe:

```bash
docker compose -f docker-compose.prod.yml logs -f keycloak
```

Quando aparecer algo como `Listening on: http://0.0.0.0:8080`, está pronto. Pressione **Ctrl+C** para sair dos logs.

#### 5.4 — Subir os backends (APIs)

```bash
docker compose -f docker-compose.prod.yml up -d saas-core orders-api payments-api
```

Aguarde **1 minuto** (o `saas-core` em Java é o mais lento para iniciar). Acompanhe:

```bash
docker compose -f docker-compose.prod.yml logs -f saas-core
```

Quando aparecer `Started SaasCoreApplication`, pressione **Ctrl+C**.

#### 5.5 — Subir os workers (processadores de filas)

```bash
docker compose -f docker-compose.prod.yml up -d orders-worker payments-worker
```

#### 5.6 — Subir o Nginx (proxy reverso) e observabilidade

```bash
docker compose -f docker-compose.prod.yml up -d nginx prometheus grafana
```

#### 5.7 — Verificar todos os serviços

```bash
docker compose -f docker-compose.prod.yml ps
```

Todos os **11 serviços** devem estar "Up":

| Serviço | Porta | Função |
|---------|-------|--------|
| postgres | 5432 | Banco de dados |
| redis | 6379 | Cache |
| rabbitmq | 5672, 15672 | Fila de mensagens |
| keycloak | 8180 | Autenticação (login/signup) |
| saas-core | 8080 | API principal (Java/Spring) |
| orders-api | 3000 | API de pedidos (Node.js) |
| orders-worker | — | Processador de filas de pedidos |
| payments-api | 8000 | API de pagamentos (Python) |
| payments-worker | — | Processador de filas de pagamentos |
| nginx | 80 | Proxy reverso (direciona tráfego) |
| prometheus | 9090 | Coleta métricas |
| grafana | 3030 | Dashboards de monitoramento |

#### 5.8 — Testar os health checks

```bash
curl http://localhost/health
```

Deve retornar: `ok`

```bash
curl http://localhost/api/core/actuator/health/liveness
```

Deve retornar algo como: `{"status":"UP"}`

```bash
curl http://localhost/api/orders/v1/healthz
```

Deve retornar resposta de health do orders.

```bash
curl http://localhost/api/payments/healthz
```

Deve retornar resposta de health do payments.

Se todos responderam, **parabéns!** O backend está rodando!

---

## Parte 6: Configurar o Cloudflare (20 min)

**O que é Cloudflare?** É um serviço que fica entre os seus usuários e o seu servidor. Ele oferece:

- **DNS** — traduz nomes como `api.seusite.com.br` para o IP do servidor
- **CDN** — cache global que faz o site carregar mais rápido
- **SSL/TLS** — o cadeado verde (HTTPS) de graça
- **Proteção DDoS** — protege contra ataques
- **Cloudflare Pages** — hospeda seus frontends React de graça

Tudo isso no plano **gratuito**.

### 6.1 — Criar conta no Cloudflare

1. Abra o navegador e acesse: **https://dash.cloudflare.com/sign-up**
2. Preencha:
   - **Email:** seu email
   - **Password:** crie uma senha forte
3. Clique **"Sign Up"**
4. Vá ao seu email e clique no link de verificação

### 6.2 — Adicionar seu domínio

> ⚠️ Se você **não tem domínio**, pule para a seção 6.5 (Cloudflare Pages). Você pode usar o IP diretamente para acessar as APIs e configurar um domínio depois.

1. No painel do Cloudflare, clique em **"Add a site"** (ou "Adicionar um site")
2. Digite seu domínio (ex: `seudominio.com.br`)
3. Clique **"Continue"**
4. Na tela de planos, selecione **"Free"** (gratuito)
5. Clique **"Continue"**

### 6.3 — Configurar nameservers

O Cloudflare vai mostrar dois nameservers, algo como:

```
arya.ns.cloudflare.com
ivan.ns.cloudflare.com
```

Você precisa trocar os nameservers do seu domínio para estes. Onde fazer isso depende de onde você registrou o domínio:

**Se registrou no Registro.br:**

1. Acesse: https://registro.br
2. Faça login
3. Clique no seu domínio
4. Vá em **"DNS"** ou **"Alterar servidores DNS"**
5. Apague os nameservers atuais
6. Adicione os dois nameservers do Cloudflare
7. Salve

**Se registrou em outro lugar (GoDaddy, Hostgator, etc.):**

O processo é similar — procure a configuração de nameservers/DNS no painel do registrador.

> ⚠️ A propagação dos nameservers pode levar até **48 horas**, mas geralmente leva **5-30 minutos**.

De volta no Cloudflare, clique **"Done, check nameservers"**. O Cloudflare vai verificar periodicamente. Quando os nameservers forem detectados, você receberá um email.

### 6.4 — Configurar os registros DNS

No painel do Cloudflare, clique em **"DNS"** no menu lateral.

Vamos adicionar os registros que apontam para o seu servidor Oracle. Clique em **"Add record"** para cada um:

**Registro 1 — API e backend principal:**

| Campo | Valor |
|-------|-------|
| Type | `A` |
| Name | `api` |
| IPv4 address | `SEU_IP_ORACLE` (ex: `129.151.42.137`) |
| Proxy status | **Proxied** (nuvem laranja ligada) |
| TTL | Auto |

Clique **"Save"**.

**Registro 2 — Keycloak (autenticação):**

| Campo | Valor |
|-------|-------|
| Type | `A` |
| Name | `auth` |
| IPv4 address | `SEU_IP_ORACLE` |
| Proxy status | **Proxied** (nuvem laranja) |
| TTL | Auto |

Clique **"Save"**.

> ℹ️ **O que é "Proxied"?** Quando a nuvem laranja está ativa, o tráfego passa pelo Cloudflare antes de chegar no seu servidor. Isso ativa CDN, SSL automático e proteção DDoS. Quando está "DNS only" (nuvem cinza), o Cloudflare só resolve o nome para o IP.

### 6.5 — Configurar SSL/TLS

1. No menu lateral do Cloudflare, clique em **"SSL/TLS"**
2. Clique em **"Overview"**
3. Mude o modo de criptografia para **"Full (strict)"**
   - **Off** = sem HTTPS
   - **Flexible** = HTTPS só entre o usuário e o Cloudflare (o Cloudflare fala HTTP com o servidor — NÃO recomendado)
   - **Full** = HTTPS em tudo, mas aceita certificado auto-assinado no servidor
   - **Full (strict)** = HTTPS em tudo, e o servidor precisa de um certificado válido

### 6.6 — Criar Certificado de Origem

O Cloudflare gera um certificado gratuito para colocar no seu servidor:

1. No menu SSL/TLS, clique em **"Origin Server"**
2. Clique **"Create Certificate"**
3. Na janela que abre:
   - **Private key type:** RSA (2048) (padrão)
   - **Hostnames:** deve listar `*.seudominio.com.br` e `seudominio.com.br`
   - **Certificate Validity:** 15 years (padrão — está ok)
4. Clique **"Create"**
5. **IMPORTANTE:** Você verá duas caixas de texto:
   - **Origin Certificate:** contém o certificado (começa com `-----BEGIN CERTIFICATE-----`)
   - **Private Key:** contém a chave privada (começa com `-----BEGIN PRIVATE KEY-----`)
6. **Copie ambos agora!** A chave privada **não será mostrada novamente**.

Agora salve-os no servidor. Conecte via SSH e rode:

```bash
sudo nano /opt/fluxe/ssl/cert.pem
```

Cole o **Origin Certificate** (todo o texto, incluindo as linhas BEGIN e END). Salve: Ctrl+O, Enter, Ctrl+X.

```bash
sudo nano /opt/fluxe/ssl/key.pem
```

Cole a **Private Key**. Salve: Ctrl+O, Enter, Ctrl+X.

Proteja os arquivos:

```bash
sudo chmod 600 /opt/fluxe/ssl/key.pem
sudo chmod 644 /opt/fluxe/ssl/cert.pem
```

### 6.7 — Configurar Cloudflare Pages (Frontends)

O Cloudflare Pages hospeda sites estáticos (como os frontends Angular/React) de graça, com deploy automático a cada push no GitHub.

Vamos configurar **3 projetos** — um para cada frontend: Shop, Ops Portal e Admin Console.

#### Frontend 1: Shop (loja para compradores)

1. No painel do Cloudflare, clique em **"Workers & Pages"** no menu lateral
2. Clique no botão **"Create"**
3. Clique na aba **"Pages"**
4. Clique em **"Connect to Git"**
5. Clique **"Connect GitHub"** e autorize o Cloudflare a acessar seus repositórios
6. Selecione o repositório **`fluxe-b2b-suite`**
7. Clique **"Begin setup"**
8. Configure:
   - **Project name:** `fluxe-shop`
   - **Production branch:** `main` (ou `develop`, dependendo do seu workflow)
   - **Framework preset:** selecione **"None"** (vamos configurar manualmente)
   - **Build command:**
     ```
     cd saas-suite-ui && npm ci && npx nx build shop --configuration=production
     ```
   - **Build output directory:**
     ```
     saas-suite-ui/dist/apps/shop/browser
     ```
9. Clique em **"Environment variables (advanced)"** e adicione:
   - **Variable name:** `NODE_VERSION` → **Value:** `20`
10. Clique **"Save and Deploy"**
11. Aguarde o build (3-5 minutos). Quando terminar, você verá a URL: `https://fluxe-shop.pages.dev`

Agora adicione o domínio personalizado:

12. Clique na aba **"Custom domains"**
13. Clique **"Set up a custom domain"**
14. Digite: `shop.seudominio.com.br`
15. Clique **"Continue"** — o Cloudflare vai adicionar o registro CNAME automaticamente
16. Clique **"Activate domain"**

#### Frontend 2: Ops Portal (portal de operações)

Repita os passos acima com estas diferenças:

- **Project name:** `fluxe-ops`
- **Build command:**
  ```
  cd saas-suite-ui && npm ci && npx nx build ops-portal --configuration=production
  ```
- **Build output directory:**
  ```
  saas-suite-ui/dist/apps/ops-portal/browser
  ```
- **Custom domain:** `ops.seudominio.com.br`

#### Frontend 3: Admin Console (painel administrativo)

Repita mais uma vez com:

- **Project name:** `fluxe-admin`
- **Build command:**
  ```
  cd saas-suite-ui && npm ci && npx nx build admin-console --configuration=production
  ```
- **Build output directory:**
  ```
  saas-suite-ui/dist/apps/admin-console/browser
  ```
- **Custom domain:** `admin.seudominio.com.br`

### 6.8 — Configurações adicionais do Cloudflare (opcionais mas recomendadas)

**Forçar HTTPS:**

1. Menu lateral → **"SSL/TLS"** → **"Edge Certificates"**
2. Ative **"Always Use HTTPS"** (liga o toggle)

**Redirecionamentos automáticos:**

1. Menu lateral → **"Rules"** → **"Page Rules"**
2. Crie uma regra: `http://*seudominio.com.br/*` → **"Always Use HTTPS"**

**Segurança básica:**

1. Menu lateral → **"Security"** → **"Settings"**
2. **Security Level:** Medium
3. **Challenge Passage:** 30 minutes

---

## Parte 7: Configurar o Keycloak (15 min)

**O que é Keycloak?** É o sistema de autenticação. Ele gerencia o login, logout, cadastro de usuários, permissões, e gera os tokens JWT que os backends usam.

### 7.1 — Acessar o painel admin do Keycloak

Abra o navegador e acesse:

- Se tem domínio: `https://auth.seudominio.com.br`
- Se não tem domínio: `http://SEU_IP:8180`

> ⚠️ Se não conseguir acessar pelo domínio, pode ser que o DNS ainda não propagou. Use o IP enquanto isso.

Você verá a tela de login do Keycloak. Faça login com:

- **Username or email:** `admin`
- **Password:** a senha que você colocou em `KEYCLOAK_ADMIN_PASSWORD` no `.env`

### 7.2 — Criar o Realm

**O que é Realm?** No Keycloak, um Realm é um espaço isolado com seus próprios usuários, clients e configurações. Vamos criar o realm `fluxe-b2b` para a nossa aplicação.

**Se você tem o arquivo `realm-export.json` no projeto:**

1. No menu lateral esquerdo, clique no dropdown que diz **"master"** (no topo)
2. Clique em **"Create realm"**
3. Clique no botão **"Browse..."**
4. Navegue até o arquivo `docker/keycloak/realm-export.json` do seu projeto
   - Se não sabe onde está, no seu computador local rode: `find . -name "realm-export.json"`
5. O formulário vai preencher automaticamente
6. Clique **"Create"**

**Se NÃO tem o arquivo de export (criando do zero):**

1. No dropdown "master", clique **"Create realm"**
2. Em **Realm name**, digite: `fluxe-b2b`
3. Mantenha **Enabled** como ON
4. Clique **"Create"**

Agora crie os clients:

5. No menu lateral, clique em **"Clients"**
6. Clique **"Create client"**
7. Preencha:
   - **Client type:** OpenID Connect
   - **Client ID:** `fluxe-shop`
   - Clique **"Next"**
   - **Client authentication:** OFF (é uma SPA pública)
   - Clique **"Next"**
   - **Valid redirect URIs:** `https://shop.seudominio.com.br/*`
   - **Web origins:** `https://shop.seudominio.com.br`
   - **Valid post logout redirect URIs:** `https://shop.seudominio.com.br/*`
   - Clique **"Save"**

Repita para `fluxe-ops` e `fluxe-admin`, trocando as URLs correspondentes.

### 7.3 — Atualizar URLs dos Clients (se importou o realm)

Se você importou o `realm-export.json`, os clients provavelmente estão com URLs de `localhost`. Vamos atualizar:

1. No menu lateral, clique em **"Clients"**
2. Clique no client **"fluxe-shop"**
3. Na aba **"Settings"**:
   - **Valid redirect URIs:** troque `http://localhost:*` por `https://shop.seudominio.com.br/*`
   - **Web origins:** troque `http://localhost:4200` por `https://shop.seudominio.com.br`
   - **Valid post logout redirect URIs:** `https://shop.seudominio.com.br/*`
4. Clique **"Save"**
5. Repita para **"fluxe-ops"** (com `ops.seudominio.com.br`) e **"fluxe-admin"** (com `admin.seudominio.com.br`)

### 7.4 — Criar o primeiro usuário

1. No menu lateral, clique em **"Users"**
2. Clique **"Add user"**
3. Preencha:
   - **Username:** o nome de login do usuário (ex: `joao.silva`)
   - **Email:** email do usuário
   - **First name:** primeiro nome
   - **Last name:** sobrenome
   - **Email verified:** ON
4. Clique **"Create"**

**Definir a senha:**

5. Na página do usuário criado, clique na aba **"Credentials"**
6. Clique **"Set password"**
7. Digite a senha nos dois campos
8. **Temporary:** OFF (se ligado, o usuário vai precisar trocar a senha no primeiro login)
9. Clique **"Save"** e confirme clicando **"Save password"**

**Adicionar atributos personalizados (para multi-tenancy):**

10. Clique na aba **"Attributes"**
11. Adicione os atributos que o sistema espera:

| Key | Value (exemplo) |
|-----|-----------------|
| `tenantId` | `tenant-001` |
| `permissions` | `MANAGE_ORDERS,VIEW_PAYMENTS` |
| `plan` | `professional` |
| `region` | `BR_SE` |

12. Clique **"Save"** após adicionar cada atributo

---

## Parte 8: Rodar as Migrations dos Bancos (5 min)

**O que são migrations?** São scripts que criam as tabelas e estrutura no banco de dados. Cada serviço tem suas próprias tabelas.

> ℹ️ Se você usou o `scripts/deploy.sh`, ele já rodou as migrations automaticamente. Rode novamente apenas se precisar.

No servidor, conecte como `fluxe`:

```bash
ssh ubuntu@SEU_IP
sudo su - fluxe
cd /opt/fluxe
```

### 8.1 — spring-saas-core (Liquibase)

As migrations do saas-core rodam **automaticamente** quando o serviço inicia. Não precisa fazer nada! Verifique nos logs se rodaram:

```bash
docker compose -f docker-compose.prod.yml logs saas-core | grep -i "liquibase"
```

Deve mostrar algo como: `Successfully acquired change log lock` e `Successfully released change log lock`.

### 8.2 — node-b2b-orders (Prisma)

```bash
docker compose -f docker-compose.prod.yml exec orders-api npx prisma migrate deploy
```

**O que é Prisma?** É o ORM (mapeador de banco de dados) usado pelo serviço de pedidos. `migrate deploy` aplica todas as migrations pendentes.

Deve mostrar:

```
X migrations found in prisma/migrations
X migrations applied
```

### 8.3 — py-payments-ledger (Alembic)

```bash
docker compose -f docker-compose.prod.yml exec payments-api alembic upgrade head
```

**O que é Alembic?** É o sistema de migrations usado pelo serviço de pagamentos (Python).

Deve mostrar algo como: `Running upgrade -> xxxx, description` para cada migration.

### 8.4 — Seed (dados iniciais — opcional)

Se quiser popular o banco com dados iniciais para testes:

```bash
docker compose -f docker-compose.prod.yml exec orders-api npx prisma db seed
```

---

## Parte 9: Testar Tudo (10 min)

Agora vamos verificar que **todos os componentes** estão funcionando.

### 9.1 — Testar os health checks das APIs

No servidor:

```bash
echo "=== Nginx ===" && curl -s http://localhost/health && echo ""
echo "=== Saas Core ===" && curl -s http://localhost/api/core/actuator/health/liveness && echo ""
echo "=== Orders API ===" && curl -s http://localhost/api/orders/v1/healthz && echo ""
echo "=== Payments API ===" && curl -s http://localhost/api/payments/healthz && echo ""
```

Todos devem retornar respostas de sucesso (status UP ou ok).

### 9.2 — Testar via domínio (se configurou Cloudflare)

Do seu computador local ou de qualquer navegador:

```bash
curl https://api.seudominio.com.br/api/core/actuator/health/liveness
curl https://api.seudominio.com.br/api/orders/v1/healthz
curl https://api.seudominio.com.br/api/payments/healthz
```

### 9.3 — Testar os frontends

Abra no navegador:

| Frontend | URL |
|----------|-----|
| Shop | `https://shop.seudominio.com.br` |
| Ops Portal | `https://ops.seudominio.com.br` |
| Admin Console | `https://admin.seudominio.com.br` |

Se cada um mostra a tela de login ou a página inicial, está funcionando!

### 9.4 — Testar o Keycloak

Abra no navegador: `https://auth.seudominio.com.br`

Deve mostrar a página de login do Keycloak.

### 9.5 — Testar login completo

1. Abra o Shop (`https://shop.seudominio.com.br`)
2. Clique em "Login" ou "Entrar"
3. Será redirecionado para o Keycloak
4. Digite as credenciais do usuário que você criou na Parte 7
5. Se redirecionar de volta para o Shop com sessão ativa, **o fluxo completo está funcionando!**

### 9.6 — Ver status de todos os containers

```bash
docker compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

---

## Parte 10: Manutenção Diária

Guia rápido para o dia a dia.

### Ver logs de um serviço

```bash
cd /opt/fluxe

# Logs do saas-core (últimas 100 linhas + acompanhar novos)
docker compose -f docker-compose.prod.yml logs --tail=100 -f saas-core

# Logs do orders-api
docker compose -f docker-compose.prod.yml logs --tail=100 -f orders-api

# Logs do payments-api
docker compose -f docker-compose.prod.yml logs --tail=100 -f payments-api

# Logs de TODOS os serviços
docker compose -f docker-compose.prod.yml logs --tail=50 -f
```

Pressione **Ctrl+C** para parar de acompanhar os logs.

### Reiniciar um serviço específico

```bash
docker compose -f docker-compose.prod.yml restart saas-core
```

### Parar tudo

```bash
docker compose -f docker-compose.prod.yml down
```

> ⚠️ `down` para e **remove** os containers (mas os dados nos volumes são preservados).

### Subir tudo novamente

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Atualizar para uma nova versão

Quando houver uma nova versão do código:

```bash
cd /opt/fluxe

# 1. Baixar as novas imagens
docker compose -f docker-compose.prod.yml pull

# 2. Reiniciar com as novas imagens
docker compose -f docker-compose.prod.yml up -d

# 3. Verificar se está tudo ok
docker compose -f docker-compose.prod.yml ps
```

Ou use o script de deploy:

```bash
./scripts/deploy.sh
```

### Ver uso de recursos

```bash
docker stats
```

Mostra CPU, memória e rede de cada container em tempo real. Pressione **Ctrl+C** para sair.

### Ver espaço em disco

```bash
df -h /
```

Se estiver enchendo, limpe imagens Docker antigas:

```bash
docker system prune -a --volumes
```

> ⚠️ Cuidado: isso remove imagens, containers parados e volumes não usados. Certifique-se de que tudo que importa está rodando.

---

## Parte 11: Backups Automáticos

### 11.1 — Executar backup manual

```bash
cd /opt/fluxe
./scripts/backup.sh
```

O script faz dump de todos os 4 bancos de dados (saascore, orders, payments, keycloak) em formato comprimido (`.sql.gz`) e salva em `/opt/fluxe/backups/daily/`.

### 11.2 — Configurar backup automático diário

Vamos configurar o sistema para rodar o backup todo dia às 3 da manhã:

```bash
crontab -e
```

Se é a primeira vez, vai perguntar qual editor usar. Escolha **`1`** (nano).

Adicione esta linha no final do arquivo:

```
0 3 * * * /opt/fluxe/scripts/backup.sh >> /opt/fluxe/logs/backup.log 2>&1
```

**O que isso significa:**
- `0 3 * * *` = às 03:00, todo dia, todo mês, todo dia da semana
- `/opt/fluxe/scripts/backup.sh` = o script de backup
- `>> /opt/fluxe/logs/backup.log` = salva o resultado num log
- `2>&1` = inclui erros no mesmo log

Salve e saia: Ctrl+O, Enter, Ctrl+X.

### 11.3 — Política de retenção

O script já gerencia a retenção automaticamente:

| Tipo | Retenção | Quando |
|------|----------|--------|
| Diário | 30 backups | Todo dia |
| Mensal | 12 backups | Todo dia 1 do mês |

### 11.4 — Verificar se o backup está funcionando

No dia seguinte, verifique:

```bash
ls -la /opt/fluxe/backups/daily/
cat /opt/fluxe/logs/backup.log | tail -20
```

### 11.5 — Restaurar um backup (em caso de emergência)

```bash
# Descomprimir o backup
gunzip /opt/fluxe/backups/daily/saascore_2026-03-03_030000.sql.gz

# Restaurar no banco
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_restore -U fluxe -d saascore --clean --if-exists \
  < /opt/fluxe/backups/daily/saascore_2026-03-03_030000.sql
```

---

## Parte 12: Monitoramento (Grafana + Prometheus)

### 12.1 — Acessar o Grafana

Abra no navegador:

- Se tem domínio: `https://api.seudominio.com.br/grafana/`
- Se não tem: `http://SEU_IP:3030`

Faça login com:

- **Username:** `admin`
- **Password:** a senha que você colocou em `GRAFANA_PASSWORD` no `.env`

### 12.2 — Adicionar o Prometheus como fonte de dados

1. No menu lateral do Grafana, clique em **"Connections"** (ícone de plug)
2. Clique em **"Data sources"**
3. Clique **"Add data source"**
4. Selecione **"Prometheus"**
5. Em **"URL"**, digite: `http://prometheus:9090`
6. Clique **"Save & Test"**
7. Deve aparecer: "Data source is working"

### 12.3 — Configurar o health monitor

Para ter verificações automáticas de saúde a cada 5 minutos:

```bash
crontab -e
```

Adicione esta linha (abaixo da linha do backup):

```
*/5 * * * * /opt/fluxe/scripts/health-monitor.sh >> /opt/fluxe/logs/health.log 2>&1
```

**O que faz:** A cada 5 minutos, verifica se todos os serviços estão respondendo. Se algum estiver fora do ar, tenta reiniciar automaticamente e envia um alerta (se configurado).

### 12.4 — Configurar alertas (opcional)

Se quiser receber alertas no Slack/Discord quando um serviço cair, edite o `health-monitor.sh`:

```bash
nano /opt/fluxe/scripts/health-monitor.sh
```

Procure a variável `ALERT_WEBHOOK_URL` e adicione a URL do webhook do seu Slack ou Discord.

---

## Parte 13: Troubleshooting

### Problema: "Serviço não inicia"

**Diagnóstico:**

```bash
# Ver os logs do serviço com problema
docker compose -f docker-compose.prod.yml logs --tail=50 NOME_DO_SERVICO
```

Substitua `NOME_DO_SERVICO` por: `saas-core`, `orders-api`, `payments-api`, etc.

**Causas comuns:**

| Erro no log | Causa | Solução |
|------------|-------|---------|
| `Connection refused` para postgres | Banco não está pronto | Aguarde ou reinicie: `docker compose ... restart postgres` |
| `ECONNREFUSED 127.0.0.1:5432` | Serviço tenta conectar no localhost | Verifique se o `.env` usa `postgres` (não `localhost`) |
| `password authentication failed` | Senha incorreta | Verifique `DB_PASSWORD` no `.env` |
| `OCI runtime create failed` | Imagem não encontrada | Verifique `GHCR_ORG` e faça login: `docker login ghcr.io` |
| `no matching manifest for linux/arm64` | Imagem não suporta ARM | A imagem precisa ser buildada para `linux/arm64` |

### Problema: "Banco não conecta"

```bash
# Verificar se o postgres está rodando
docker compose -f docker-compose.prod.yml ps postgres

# Testar conexão direto
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U fluxe

# Ver logs do postgres
docker compose -f docker-compose.prod.yml logs postgres
```

### Problema: "Não consigo acessar pelo navegador"

Checklist:

1. **O container nginx está rodando?**
   ```bash
   docker compose -f docker-compose.prod.yml ps nginx
   ```

2. **A porta 80 está respondendo?**
   ```bash
   curl http://localhost/health
   ```

3. **O firewall do servidor está aberto?** (dentro do servidor)
   ```bash
   sudo iptables -L INPUT -n | grep -E "80|443"
   ```

4. **A Security List da Oracle está configurada?**
   - Acesse o Oracle Cloud Console → Networking → VCN → Security Lists
   - Verifique se as portas 80 e 443 estão abertas (Parte 2.2)

5. **O DNS está apontando para o IP correto?**
   ```bash
   dig api.seudominio.com.br
   ```
   O resultado deve mostrar o IP da Oracle.

### Problema: "Imagem Docker não encontrada"

```bash
# Verificar se está logado no GitHub Container Registry
docker login ghcr.io

# Verificar o nome correto da imagem
source /opt/fluxe/.env
echo "ghcr.io/${GHCR_ORG}/spring-saas-core:${SAAS_CORE_TAG:-latest}"

# Tentar baixar manualmente
docker pull ghcr.io/${GHCR_ORG}/spring-saas-core:${SAAS_CORE_TAG:-latest}
```

### Problema: "Keycloak não inicia"

O Keycloak precisa do PostgreSQL e é mais pesado (pode levar 2 minutos para iniciar):

```bash
# Verificar se o postgres está healthy
docker compose -f docker-compose.prod.yml ps postgres

# Ver logs do Keycloak
docker compose -f docker-compose.prod.yml logs --tail=100 keycloak
```

Se o log mostra `ERROR: relation "..." already exists`, o banco de dados do Keycloak pode estar corrompido. Recrie:

```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U fluxe -c "DROP DATABASE keycloak;"
docker compose -f docker-compose.prod.yml exec postgres psql -U fluxe -c "CREATE DATABASE keycloak;"
docker compose -f docker-compose.prod.yml restart keycloak
```

### Problema: "Out of capacity" na Oracle

Isso significa que a Oracle não tem servidores disponíveis na região. Soluções:

1. **Tente novamente mais tarde** — de madrugada ou início da manhã costuma ter disponibilidade
2. **Tente shape menor** — 2 OCPUs / 12 GB (e depois aumente)
3. **Tente outra região** — mas você perderá latência para usuários brasileiros

### Problema: "Disco cheio"

```bash
# Ver uso de disco
df -h /

# Ver quem está usando mais espaço
sudo du -sh /* | sort -rh | head -10

# Limpar imagens Docker não usadas
docker system prune -a

# Limpar logs antigos
docker compose -f docker-compose.prod.yml logs --tail=0  # não faz nada, só para ver

# Limpar logs de container individualmente
docker compose -f docker-compose.prod.yml exec SERVICO sh -c 'echo "" > /proc/1/fd/1'
```

### Problema: "Memória insuficiente"

```bash
# Ver uso de memória
free -h

# Ver quem está usando mais memória
docker stats --no-stream
```

O `docker-compose.prod.yml` já tem limites de memória configurados:

| Serviço | Limite |
|---------|--------|
| postgres | 4 GB |
| saas-core | 2 GB |
| redis | 512 MB |
| rabbitmq | 1 GB |
| keycloak | 1 GB |
| orders-api | 512 MB |
| orders-worker | 256 MB |
| payments-api | 512 MB |
| payments-worker | 256 MB |
| prometheus | 512 MB |
| grafana | 512 MB |
| nginx | 128 MB |
| **Total** | **~10.7 GB** |

Com 24 GB de RAM + 4 GB de swap, você tem margem de sobra.

---

## Custos Finais

| Item | Custo Mensal | Custo Anual |
|------|-------------|-------------|
| Oracle Cloud (4 OCPU, 24GB RAM, 200GB disco) | **R$0** (Free Tier permanente) |  **R$0** |
| Cloudflare (DNS + CDN + SSL + DDoS) | **R$0** (plano Free) | **R$0** |
| Cloudflare Pages (3 frontends) | **R$0** (plano Free — 500 builds/mês) | **R$0** |
| Domínio `.com.br` | ~R$3,30/mês | **~R$40/ano** |
| **TOTAL** | **~R$3,30/mês** | **~R$40/ano** |

> 💡 Sem domínio, o custo é **literalmente R$0/mês**. Você pode usar os domínios `.pages.dev` do Cloudflare para os frontends e acessar as APIs pelo IP.

---

## Resumo: Checklist Final

Marque cada item conforme completar:

- [ ] Conta Oracle Cloud criada e ativada
- [ ] VCN criada com portas 22, 80, 443 abertas
- [ ] Instância ARM criada (4 OCPU, 24GB, 200GB) e rodando
- [ ] Primeiro acesso SSH funcionando
- [ ] Script `server-setup.sh` executado com sucesso
- [ ] Arquivos do projeto copiados para `/opt/fluxe/`
- [ ] Arquivo `.env` preenchido com todas as senhas
- [ ] Todos os 11 containers rodando (`docker compose ps`)
- [ ] Health checks respondendo OK
- [ ] Conta Cloudflare criada
- [ ] DNS configurado e propagado
- [ ] SSL Full (strict) ativado
- [ ] Certificado de origem instalado no servidor
- [ ] Cloudflare Pages configurado (shop, ops, admin)
- [ ] Keycloak realm importado/criado
- [ ] Clients do Keycloak com URLs corretas
- [ ] Pelo menos 1 usuário criado no Keycloak
- [ ] Migrations rodadas com sucesso
- [ ] Frontends acessíveis no navegador
- [ ] Login completo funcionando (frontend → Keycloak → API)
- [ ] Backup automático configurado (cron)
- [ ] Health monitor configurado (cron)
- [ ] Prometheus + Grafana acessíveis

---

## Glossário

| Termo | O que é |
|-------|---------|
| **SSH** | Protocolo para acessar um computador remoto com segurança |
| **Docker** | Ferramenta que empacota aplicações em "containers" isolados |
| **Container** | Uma instância de uma aplicação rodando isolada, como uma mini máquina virtual |
| **Docker Compose** | Ferramenta para gerenciar vários containers juntos |
| **VCN** | Virtual Cloud Network — rede virtual privada na Oracle Cloud |
| **Security List** | Firewall da Oracle Cloud que controla quais portas estão abertas |
| **OCPU** | Oracle CPU — unidade de processamento. 4 OCPUs ≈ 4 vCPUs de outros provedores |
| **ARM / aarch64** | Tipo de processador (como o dos celulares). A Oracle oferece mais recursos gratuitos em ARM |
| **Nginx** | Servidor web que atua como "recepcionista" — direciona o tráfego para o serviço correto |
| **PostgreSQL** | Banco de dados relacional (onde ficam os dados) |
| **Redis** | Banco de dados em memória usado como cache (rápido, temporário) |
| **RabbitMQ** | Fila de mensagens — permite que serviços se comuniquem de forma assíncrona |
| **Keycloak** | Servidor de autenticação (gerencia login, logout, tokens) |
| **JWT** | JSON Web Token — "crachá digital" que prova que o usuário está autenticado |
| **DNS** | Sistema que traduz nomes (ex: google.com) em endereços IP |
| **SSL/TLS** | Criptografia que protege a comunicação (o cadeado verde do HTTPS) |
| **CDN** | Content Delivery Network — cópias do site espalhadas pelo mundo para carregar rápido |
| **Proxy Reverso** | Servidor que fica na frente dos outros, recebe as requisições e encaminha para o serviço certo |
| **Migration** | Script que cria ou modifica tabelas no banco de dados |
| **Health Check** | Endpoint que informa se o serviço está funcionando corretamente |
| **Swap** | Memória extra usando o disco rígido (mais lento que RAM, mas evita travamentos) |
| **fail2ban** | Programa que bloqueia IPs que tentam invadir (muitas tentativas de senha errada) |
| **crontab** | Agendador de tarefas do Linux (ex: rodar backup todo dia às 3h) |
| **Prometheus** | Sistema que coleta métricas (uso de CPU, memória, requisições, etc.) |
| **Grafana** | Painel de monitoramento visual (gráficos e dashboards) |

---

> **Dúvidas?** Abra uma issue no repositório ou consulte a documentação de cada serviço:
>
> - Oracle Cloud: https://docs.oracle.com/en-us/iaas/Content/home.htm
> - Cloudflare: https://developers.cloudflare.com
> - Docker: https://docs.docker.com
> - Keycloak: https://www.keycloak.org/documentation
> - Nginx: https://nginx.org/en/docs/
