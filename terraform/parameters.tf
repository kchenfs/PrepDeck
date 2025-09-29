# terraform/parameters.tf

# ------------------------------------------------------------------------------
# AWS SYSTEMS MANAGER (SSM) PARAMETER STORE FOR UBER EATS API CREDENTIALS
# ------------------------------------------------------------------------------
# We are using SSM Parameter Store's SecureString type to securely store
# the API credentials. This is a cost-effective and secure method.

resource "aws_ssm_parameter" "uber_eats_client_id" {
  name  = "/momotaro/uber_eats/client_id"
  type  = "SecureString"
  value = var.uber_eats_client_id

  tags = {
    Name        = "Uber Eats Client ID"
    Environment = "Production"
  }
}

# Parameter for the Uber Eats Client Secret
resource "aws_ssm_parameter" "uber_eats_client_secret" {
  name  = "/momotaro/uber_eats/client_secret"
  type  = "SecureString"
  value = var.uber_eats_client_secret

  tags = {
    Name        = "Uber Eats Client Secret"
    Environment = "Production"
  }
}

