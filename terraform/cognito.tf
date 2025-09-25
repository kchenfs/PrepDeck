# terraform/cognito.tf

# ------------------------------------------------------------------------------
# COGNITO USER POOL FOR AUTHENTICATION
# ------------------------------------------------------------------------------

resource "aws_cognito_user_pool" "user_pool" {
  name = "momotaro-user-pool"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
    string_attribute_constraints {
        min_length = 1
        max_length = 2048
    }
  }

  schema {
    name                = "restaurantId"
    attribute_data_type = "String"
    mutable             = true
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  auto_verified_attributes = ["email"]

  tags = {
    Name        = "Momotaro User Pool"
    Environment = "Production"
  }
}

# ------------------------------------------------------------------------------
# COGNITO IDENTITY PROVIDER (e.g., Google)
# ------------------------------------------------------------------------------
resource "aws_cognito_identity_provider" "google" {
  user_pool_id  = aws_cognito_user_pool.user_pool.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
    authorize_scopes = "email openid profile"
  }

  attribute_mapping = {
    email    = "email"
    username = "sub"
  }
}

# ------------------------------------------------------------------------------
# COGNITO USER POOL CLIENT
# ------------------------------------------------------------------------------
resource "aws_cognito_user_pool_client" "app_client" {
  name = "prepdeck-app-client" # Renamed to match your project
  user_pool_id = aws_cognito_user_pool.user_pool.id
  generate_secret = false
  explicit_auth_flows = ["ALLOW_USER_SRP_AUTH", "ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  supported_identity_providers = ["Google", "COGNITO"]
  
  # 👇 THESE ARE THE REQUIRED ADDITIONS 👇
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  # Update URLs to include production domain to match your Amplify config
  callback_urls = [
    "http://localhost:5173/",
    "https://prepdeck.momotarosushi.ca/"
  ]
  logout_urls   = [
    "http://localhost:5173/",
    "https://prepdeck.momotarosushi.ca/"
  ]
}


resource "aws_cognito_user_pool_domain" "main" {
  # This is the unique prefix. Use your project name here.
  # It must be unique across your AWS region.
  domain       = "prepdeck" # <-- Use your chosen unique prefix

  # This links the domain to your user pool.
  user_pool_id = aws_cognito_user_pool.user_pool.id
}
