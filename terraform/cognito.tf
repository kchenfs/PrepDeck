# terraform/cognito.tf

# ------------------------------------------------------------------------------
# COGNITO USER POOL FOR AUTHENTICATION
# ------------------------------------------------------------------------------

resource "aws_cognito_user_pool" "user_pool" {
  name = "momotaro-user-pool"

  # Configure password policies
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  # Configure users to sign in with their email address
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

  # 👇 THIS IS THE CORRECTED BLOCK FOR YOUR CUSTOM ATTRIBUTE 👇
  schema {
   # The name MUST start with "custom:" to mark it as a custom attribute.
    name                = "custom:restaurantId"
    attribute_data_type = "String"
    mutable             = true
    
    # This block is required for string attributes
    string_attribute_constraints {
      min_length = 1      # The ID cannot be empty
      max_length = 256    # Allows for a generous ID length
    }
  }

  # Do not automatically send a welcome email to new users
  auto_verified_attributes = ["email"]

  tags = {
    Name        = "Momotaro User Pool"
    Environment = "Production"
  }
}

# ------------------------------------------------------------------------------
# COGNITO IDENTITY PROVIDER (e.g., Google)
# ------------------------------------------------------------------------------
# This tells Cognito to trust Google as a sign-in option.

resource "aws_cognito_identity_provider" "google" {
  user_pool_id  = aws_cognito_user_pool.user_pool.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id        = "YOUR_GOOGLE_CLIENT_ID" # You'll get this from the Google API Console
    client_secret    = "YOUR_GOOGLE_CLIENT_SECRET" # You'll get this from the Google API Console
    authorize_scopes = "email openid profile"
  }

  # Map attributes from Google to Cognito
  attribute_mapping = {
    email    = "email"
    username = "sub" # 'sub' is Google's unique ID for the user
  }
}

# ------------------------------------------------------------------------------
# COGNITO USER POOL CLIENT
# ------------------------------------------------------------------------------

resource "aws_cognito_user_pool_client" "app_client" {
  name = "momotaro-app-client"
  user_pool_id = aws_cognito_user_pool.user_pool.id
  generate_secret = false
  explicit_auth_flows = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]

  # Tell the client that it's allowed to use the Google identity provider
  supported_identity_providers = ["Google", "COGNITO"]
  
  # You'll need to provide the URL where users are sent after logging in/out
  callback_urls = ["http://localhost:3000/"] # For local development
  logout_urls   = ["http://localhost:3000/login"]
}