# Ativar com: terraform apply -var="create_backend_bucket=true"
# Depois migrar state para S3 e setar create_backend_bucket=false

resource "aws_s3_bucket" "tf_state" {
  count  = var.create_backend_bucket ? 1 : 0
  bucket = "fluxe-b2b-terraform-state"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "tf_state" {
  count  = var.create_backend_bucket ? 1 : 0
  bucket = aws_s3_bucket.tf_state[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tf_state" {
  count  = var.create_backend_bucket ? 1 : 0
  bucket = aws_s3_bucket.tf_state[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_dynamodb_table" "tf_lock" {
  count          = var.create_backend_bucket ? 1 : 0
  name           = "fluxe-b2b-terraform-lock"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
