# terraform/terraform_state_backend.tf

resource "aws_s3_bucket" "terraform_state" {
  bucket = "momotaro-terraform-state-f8x2y7"

  lifecycle {
    prevent_destroy = true
  }
}

# NEW: Use a separate resource for versioning
resource "aws_s3_bucket_versioning" "terraform_state_versioning" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_dynamodb_table" "terraform_state_lock" {
  name         = "momotaro-terraform-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}