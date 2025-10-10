# terraform/parameters.tf

# ------------------------------------------------------------------------------
# AWS SYSTEMS MANAGER (SSM) PARAMETER STORE FOR UBER EATS API CREDENTIALS
# ------------------------------------------------------------------------------
# We are using SSM Parameter Store's SecureString type to securely store
# the API credentials. This is a cost-effective and secure method.

resource "aws_ssm_parameter" "uber_eats_client_id_prod" {
  name  = "/momotaro/uber_eats/client_id_prod"
  type  = "SecureString"
  value = var.uber_eats_client_id_prod

  tags = {
    Name        = "Uber Eats Client ID"
    Environment = "Production"
  }
}

# Parameter for the Uber Eats Client Secret
resource "aws_ssm_parameter" "uber_eats_client_secret_prod" {
  name  = "/momotaro/uber_eats/client_secret_prod"
  type  = "SecureString"
  value = var.uber_eats_client_secret_prod

  tags = {
    Name        = "Uber Eats Client Secret"
    Environment = "Production"
    overwrite = true
  }
}


resource "aws_ssm_parameter" "uber_eats_client_id_dev" {
  name  = "/momotaro/uber_eats/client_id_dev"
  type  = "SecureString"
  value = var.uber_eats_client_id_dev

  tags = {
    Name        = "Uber Eats Client ID"
    Environment = "Development"
  }
}

# Parameter for the Uber Eats Client Secret
resource "aws_ssm_parameter" "uber_eats_client_secret_dev" {
  name  = "/momotaro/uber_eats/client_secret_dev"
  type  = "SecureString"
  value = var.uber_eats_client_secret_dev

  tags = {
    Name        = "Uber Eats Client Secret"
    Environment = "Development"
  }
}
