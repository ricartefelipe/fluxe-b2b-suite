resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_secretsmanager_secret" "db" {
  name = "${var.project_name}/${var.environment}/db"
}

resource "random_password" "db" {
  length  = 24
  special = true
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id     = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = "suite"
    password = random_password.db.result
    port     = 5432
  })
  depends_on = [aws_db_instance.core]
}

resource "aws_db_instance" "core" {
  identifier     = "${var.project_name}-${var.environment}-core"
  engine         = "postgres"
  engine_version = "16"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  storage_encrypted     = true
  db_name               = "saascore"
  username              = "suite"
  password              = random_password.db.result
  port                  = 5432
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  multi_az              = var.environment == "prod"
  publicly_accessible    = false
  skip_final_snapshot   = var.environment != "prod"
}

output "rds_core_endpoint" {
  value     = aws_db_instance.core.address
  sensitive = false
}
