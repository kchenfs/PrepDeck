# terraform/restaurants_table.tf

# ------------------------------------------------------------------------------
# DYNAMODB TABLE FOR RESTAURANTS
# ------------------------------------------------------------------------------

resource "aws_dynamodb_table" "restaurants_table" {
  # Table name for storing restaurant information
  name         = "Restaurants"
  billing_mode = "PAY_PER_REQUEST"

  # The primary key, which will link to the Cognito custom attribute
  hash_key = "RestaurantID"

  # Define the attributes of the table.
  attribute {
    name = "RestaurantID"
    type = "S" # "S" for String
  }

  # Add other useful attributes for each restaurant.
  # Note: You only need to define attributes that are part of a key or index here.
  # Other attributes like RestaurantName can be added to items without being defined in the schema.

  tags = {
    Name        = "Momotaro Restaurants Table"
    Environment = "Production"
  }
}

# ------------------------------------------------------------------------------
# DYNAMODB TABLE FOR API TOKEN CACHING
# ------------------------------------------------------------------------------
# This table stores the OAuth token from Uber Eats to avoid hitting rate limits.
resource "aws_dynamodb_table" "api_token_cache" {
  name           = "ApiTokenCache"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "ProviderName"

  attribute {
    name = "ProviderName"
    type = "S"
  }

  tags = {
    Name        = "API Token Cache"
    Environment = "Production"
  }
}

# ------------------------------------------------------------------------------
# DYNAMODB TABLE FOR THE MENU
# ------------------------------------------------------------------------------
resource "aws_dynamodb_table" "menu_table" {
  name           = "Menu"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "ItemID"

  attribute {
    name = "ItemID"
    type = "S"
  }

  tags = {
    Name        = "Menu Table"
    Environment = "Production"
  }
}

# ------------------------------------------------------------------------------
# DYNAMODB TABLE FOR ORDERS
# ------------------------------------------------------------------------------

resource "aws_dynamodb_table" "orders_table" {
  # Table name as specified in the plan
  name         = "Momotaro-Dashboard-Orders"
  billing_mode = "PAY_PER_REQUEST"

  # Define the primary key for the table
  hash_key = "OrderID"

  # Define the attributes of the table.
  attribute {
    name = "OrderID"
    type = "S" # "S" stands for String
  }

  tags = {
    Name        = "Momotaro Orders Table"
    Environment = "Production"
  }
}
