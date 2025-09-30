# terraform/dynamodb.tf

# ------------------------------------------------------------------------------
# DYNAMODB TABLE FOR API TOKEN CACHING
# ------------------------------------------------------------------------------
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
  hash_key       = "ItemID" # Your internal, primary ID

  # Define all attributes that will be used in keys or indexes
  attribute {
    name = "ItemID"
    type = "S"
  }
  
  attribute {
    name = "UberEatsID" # The ID from the Uber Eats system
    type = "S"
  }

  # THIS IS THE CHANGE: Add a Global Secondary Index
  # This lets us query the table efficiently using the UberEatsID.
  global_secondary_index {
    name            = "UberEatsID-index"
    hash_key        = "UberEatsID"
    projection_type = "ALL" # Include all attributes in the index
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
  name         = "Momotaro-Dashboard-Orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "OrderID"

  attribute {
    name = "OrderID"
    type = "S"
  }

  tags = {
    Name        = "Momotaro Orders Table"
    Environment = "Production"
  }
}

