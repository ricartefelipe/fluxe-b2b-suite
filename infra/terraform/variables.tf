variable "environment" {
  type        = string
  description = "Ambiente: staging ou prod"
  default     = "staging"
}

variable "aws_region" {
  type        = string
  description = "Região AWS"
  default     = "us-east-1"
}

variable "project_name" {
  type        = string
  description = "Nome do projeto (prefixo em recursos)"
  default     = "fluxe-b2b"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR da VPC"
  default     = "10.0.0.0/16"
}

variable "db_allocated_storage" {
  type        = number
  description = "Storage inicial RDS (GB)"
  default     = 20
}

variable "db_instance_class" {
  type        = string
  description = "Classe da instância RDS"
  default     = "db.t3.micro"
}

variable "ecs_fargate_cpu" {
  type        = number
  description = "CPU para tasks Fargate"
  default     = 256
}

variable "ecs_fargate_memory" {
  type        = number
  description = "Memória para tasks Fargate (MB)"
  default     = 512
}

variable "frontend_domain" {
  type        = string
  description = "Domínio do frontend (opcional, para ACM e CloudFront)"
  default     = ""
}

variable "create_backend_bucket" {
  type        = bool
  description = "Criar bucket S3 e tabela DynamoDB para state (só uma vez)"
  default     = false
}
