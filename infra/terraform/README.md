# Fluxe B2B Suite — IaC (Terraform AWS)

Infraestrutura como código para rodar a suite na AWS: VPC, RDS, ElastiCache, Amazon MQ (RabbitMQ), ECS Fargate, ALB e frontend (S3 + CloudFront).

## Pré-requisitos

- Terraform >= 1.5
- AWS CLI configurado (`aws configure`) ou variáveis `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
- Conta AWS com permissões para criar VPC, RDS, ElastiCache, MQ, ECS, ALB, S3, CloudFront

## Uso rápido

```bash
cd infra/terraform
terraform init
terraform plan -var="environment=staging"
terraform apply -var="environment=staging" -auto-approve
```

State fica em `terraform.tfstate` (local). Para state remoto no S3, use o exemplo em `backend.s3.example`.

## Recursos criados

| Recurso | Descrição |
|---------|-----------|
| VPC | Rede com subnets públicas e privadas, NAT Gateway |
| RDS | PostgreSQL 16 (Core); endpoint em output `rds_core_endpoint` |
| ElastiCache | Redis (Core); endpoint em `elasticache_core_endpoint` |
| Amazon MQ | RabbitMQ (broker único para Orders + Payments) |
| ECS | Cluster Fargate + roles + log group |
| ALB | Application Load Balancer + target groups para Core (8080), Orders (3000), Payments (8000) |
| S3 + CloudFront | Bucket e distribuição para frontend estático; URL em `frontend_url` |

## Variáveis principais

| Variável | Default | Descrição |
|----------|---------|-----------|
| environment | staging | staging ou prod |
| aws_region | us-east-1 | Região AWS |
| project_name | fluxe-b2b | Prefixo dos recursos |
| create_backend_bucket | false | Se true, cria bucket S3 e tabela DynamoDB para state |

## Outputs

Após `terraform apply`:

- `vpc_id`, `private_subnet_ids`, `public_subnet_ids`
- `rds_core_endpoint`
- `elasticache_core_endpoint`
- `amazon_mq_broker_id`, `amazon_mq_primary_endpoint`
- `ecs_cluster_name`, `ecs_cluster_arn`
- `alb_dns_name`
- `frontend_url`, `frontend_bucket`, `cloudfront_distribution_id`

## Deploy das aplicações

1. **Imagens:** Use as imagens no GHCR (build pelo CI dos repos spring-saas-core, node-b2b-orders, py-payments-ledger).
2. **ECS:** Crie task definitions e services que usem as subnets privadas, security group ECS, e as variáveis de ambiente (RDS, Redis, RabbitMQ) a partir dos outputs/Secrets Manager.
3. **Frontend:** Faça upload do build (ex.: `nx build ops-portal`) para o bucket S3 e invalide o CloudFront se necessário.

Ordem e variáveis de ambiente: [documento-implantacao.md](../../docs/documento-implantacao.md) e [LACUNAS-CLOUD-IAC.md](../../docs/LACUNAS-CLOUD-IAC.md).
