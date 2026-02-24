resource "aws_mq_broker" "rabbitmq" {
  broker_name         = "${var.project_name}-${var.environment}"
  engine_type         = "RabbitMQ"
  engine_version      = "3.12"
  host_instance_type  = "mq.t3.micro"
  deployment_mode     = "SINGLE_INSTANCE"
  publicly_accessible = false
  subnet_ids          = [aws_subnet.private[0].id]
  security_groups     = [aws_security_group.amazonmq.id]

  user {
    username = "admin"
    password = random_password.mq.result
  }
  maintenance_window_start_time {
    day_of_week = "sunday"
    time_of_day = "03:00"
    time_zone   = "UTC"
  }
}

resource "random_password" "mq" {
  length  = 24
  special = true
}

output "amazon_mq_broker_id" {
  value = aws_mq_broker.rabbitmq.id
}

output "amazon_mq_primary_endpoint" {
  value     = try(aws_mq_broker.rabbitmq.instances[0].endpoints[0], "")
  sensitive = false
}
